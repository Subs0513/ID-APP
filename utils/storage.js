const KEY_COUPLE_START = 'couple_start_date';
const KEY_LIST = 'important_days_list';
const KEY_USER_PROFILE = 'user_profile';

// ✅ 新增：经期记录 key（你原文件里已存在）
const KEY_PERIOD_RECORD = 'period_record_v1';

function getUserProfile() {
  return uni.getStorageSync(KEY_USER_PROFILE) || {};
}
function setUserProfile(profile) {
  uni.setStorageSync(KEY_USER_PROFILE, profile || {});
}
function clearUserProfile() {
  uni.removeStorageSync(KEY_USER_PROFILE);
}

function getCoupleStartDate() {
  return uni.getStorageSync(KEY_COUPLE_START) || '';
}
function setCoupleStartDate(dateStr) {
  uni.setStorageSync(KEY_COUPLE_START, dateStr || '');
}

function getList() {
  return uni.getStorageSync(KEY_LIST) || [];
}
function setList(list) {
  uni.setStorageSync(KEY_LIST, list || []);
}

/** ✅ 新增：经期记录读写（配合 KEY_PERIOD_RECORD） */
function getPeriodRecord() {
  return uni.getStorageSync(KEY_PERIOD_RECORD) || null;
}
function setPeriodRecord(record) {
  uni.setStorageSync(KEY_PERIOD_RECORD, record || null);
}
function clearPeriodRecord() {
  uni.removeStorageSync(KEY_PERIOD_RECORD);
}

function clearAllLocalData() {
  // 清除用户资料
  uni.removeStorageSync(KEY_USER_PROFILE);

  // 清除恋爱开始日期
  uni.removeStorageSync(KEY_COUPLE_START);

  // 清除重要日列表
  uni.removeStorageSync(KEY_LIST);

  // ✅ 清除经期记录（你原文件里已存在）
  uni.removeStorageSync(KEY_PERIOD_RECORD);
}

module.exports = {
  KEY_COUPLE_START,
  KEY_LIST,
  KEY_USER_PROFILE,
  KEY_PERIOD_RECORD, // ✅ 导出

  getUserProfile,
  setUserProfile,
  clearUserProfile,

  getCoupleStartDate,
  setCoupleStartDate,

  getList,
  setList,

  // ✅ 新增导出
  getPeriodRecord,
  setPeriodRecord,
  clearPeriodRecord,

  clearAllLocalData
};
