// utils/syncClient.js
// Chrona mobile sync client (uni-app)
// - deviceId: 一次生成，永久保存
// - requestId: 每次上传生成（幂等）
// - buildPayloadFromLocal: 从 utils/storage.js 打包真实数据
// - syncNow: 正式同步入口（节流 + 重试 + 状态落盘）

const API_BASE = 'https://www.chrona.com.cn' // 线上域名
const DEVICE_ID_KEY = 'chrona_device_id'

// 同步状态记录（便于你以后做“上次同步时间/失败提示”）
const SYNC_LAST_OK_AT_KEY = 'chrona_sync_last_ok_at'
const SYNC_LAST_FAIL_AT_KEY = 'chrona_sync_last_fail_at'
const SYNC_LAST_RESULT_KEY = 'chrona_sync_last_result'

// 默认节流：5 分钟
const DEFAULT_THROTTLE_MS = 5 * 60 * 1000

// ✅ 引入本地数据工具（CommonJS 导出）
// 注意：这里用相对路径，最稳，不依赖 @ 别名
const storage = require('./storage.js')

// --- uuid (不依赖第三方库) ---
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// --- deviceId：一次生成，永久保存 ---
export function getOrCreateDeviceId() {
  let id = ''
  try { id = uni.getStorageSync(DEVICE_ID_KEY) } catch (_) {}
  if (id) return id

  const sys = (uni.getSystemInfoSync && uni.getSystemInfoSync()) || {}
  const platform = sys.platform || 'unknown'
  const model = sys.model || 'device'
  id = `${platform}_${model}_${Date.now()}_${Math.random().toString(16).slice(2)}`

  try { uni.setStorageSync(DEVICE_ID_KEY, id) } catch (_) {}
  return id
}

// --- 获取 appVersion（兼容不同平台）---
export function getAppVersionSafe() {
  try {
    const sys = (uni.getSystemInfoSync && uni.getSystemInfoSync()) || {}
    return sys.appWgtVersion || sys.appVersion || '0.0.0'
  } catch (_) {
    return '0.0.0'
  }
}

// --- 读取“最近同步状态” ---
export function getLastSyncState() {
  try {
    return uni.getStorageSync(SYNC_LAST_RESULT_KEY) || null
  } catch (_) {
    return null
  }
}

// --- 写入同步状态 ---
function setLastSyncState(obj) {
  try { uni.setStorageSync(SYNC_LAST_RESULT_KEY, obj || null) } catch (_) {}
}

// --- 从本地打包真实业务数据（你后面扩展 payload 就改这里） ---
export function buildPayloadFromLocal(extra = {}) {
  const profile = storage.getUserProfile ? storage.getUserProfile() : {}
  const coupleStartDate = storage.getCoupleStartDate ? storage.getCoupleStartDate() : ''
  const importantDays = storage.getList ? storage.getList() : []
  const periodRecord = storage.getPeriodRecord ? storage.getPeriodRecord() : null

  return {
    // 业务数据
    profile,
    coupleStartDate,
    importantDays,
    periodRecord,

    // 元信息（便于你后端调试/未来做版本迁移）
    meta: {
      generatedAt: Date.now(),
      payloadVersion: 1
    },

    // 允许调用方塞更多字段
    ...extra
  }
}

// --- 上传核心 ---
export async function uploadToServer(payload, options = {}) {
  const deviceId = getOrCreateDeviceId()
  const requestId = uuidv4()

  const sys = (uni.getSystemInfoSync && uni.getSystemInfoSync()) || {}
  const platform = options.platform || sys.platform || 'unknown'
  const appVersion = options.appVersion || getAppVersionSafe()
  const schemaVersion = options.schemaVersion || 1

  const body = {
    deviceId,
    requestId,
    platform,
    appVersion,
    schemaVersion,
    payload
  }

  const url = `${API_BASE}/api/sync/upload`

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: body,
      timeout: options.timeout || 15000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            ok: true,
            statusCode: res.statusCode,
            data: res.data,
            requestId,
            deviceId
          })
          return
        }
        reject({
          ok: false,
          statusCode: res.statusCode,
          data: res.data,
          requestId,
          deviceId
        })
      },
      fail: (err) => {
        reject({
          ok: false,
          error: err,
          requestId,
          deviceId
        })
      }
    })
  })
}

// --- 简单重试（网络抖动时有用）---
export async function uploadWithRetry(payload, retry = 2, options = {}) {
  let lastErr = null
  for (let i = 0; i <= retry; i++) {
    try {
      const r = await uploadToServer(payload, options)
      return r
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, 300 * (i + 1)))
    }
  }
  throw lastErr
}

// --- 节流判断 ---
function shouldThrottle(throttleMs) {
  const ms = typeof throttleMs === 'number' ? throttleMs : DEFAULT_THROTTLE_MS
  try {
    const lastOk = parseInt(uni.getStorageSync(SYNC_LAST_OK_AT_KEY) || '0', 10)
    if (!lastOk) return false
    return (Date.now() - lastOk) < ms
  } catch (_) {
    return false
  }
}

/**
 * ✅ 正式同步入口
 * - 默认 5 分钟节流
 * - 默认重试 2 次
 * - 成功/失败都会把状态写入 storage，方便 UI 展示
 *
 * @param {Object} options
 *  - extraPayload: Object 追加到 payload
 *  - throttleMs: number 节流时间（ms），传 0 表示不节流
 *  - retry: number 重试次数（默认 2）
 *  - schemaVersion/appVersion/platform/timeout: 透传到 uploadToServer
 */
export async function syncNow(options = {}) {
  const throttleMs = (typeof options.throttleMs === 'number') ? options.throttleMs : DEFAULT_THROTTLE_MS

  if (throttleMs > 0 && shouldThrottle(throttleMs)) {
    const state = {
      ok: true,
      throttled: true,
      at: Date.now(),
      message: 'throttled'
    }
    setLastSyncState(state)
    return state
  }

  const payload = buildPayloadFromLocal(options.extraPayload || {})
  const retry = typeof options.retry === 'number' ? options.retry : 2

  const uploadOptions = {
    schemaVersion: options.schemaVersion || 1,
    appVersion: options.appVersion,
    platform: options.platform,
    timeout: options.timeout
  }

  try {
    const r = await uploadWithRetry(payload, retry, uploadOptions)

    try { uni.setStorageSync(SYNC_LAST_OK_AT_KEY, Date.now()) } catch (_) {}
    const state = {
      ok: true,
      throttled: false,
      at: Date.now(),
      requestId: r.requestId,
      deviceId: r.deviceId,
      server: r.data
    }
    setLastSyncState(state)
    return state
  } catch (e) {
    try { uni.setStorageSync(SYNC_LAST_FAIL_AT_KEY, Date.now()) } catch (_) {}
    const state = {
      ok: false,
      throttled: false,
      at: Date.now(),
      requestId: e.requestId,
      deviceId: e.deviceId,
      error: e.data || e.error || e
    }
    setLastSyncState(state)
    throw state
  }
}
