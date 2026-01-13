const KEY_COUPLE_START = 'COUPLE_START_DATE';
const KEY_LIST = 'IMPORTANT_DAYS_LIST';
const KEY_USER_PROFILE = 'USER_PROFILE';

// ✅ 新增：经期记录缓存 key（只新增，不改原逻辑）
const KEY_PERIOD_RECORD = 'period_record_v1';

/** { nickName: string, avatarUrl: string } */
function getUserProfile() {
    return uni.getStorageSync(KEY_USER_PROFILE) || null;
}
function setUserProfile(profile) {
    uni.setStorageSync(KEY_USER_PROFILE, profile || null);
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
    uni.setStorageSync(KEY_LIST, Array.isArray(list) ? list : []);
}

/** ✅ 退出登录时清空 1.0 本地数据 */
function clearAllLocalData() {
    try {
        uni.removeStorageSync(KEY_USER_PROFILE);
    } catch (e) {
        console.log('CatchClause', e);
        console.log('CatchClause', e);
    }
    try {
        uni.removeStorageSync(KEY_COUPLE_START);
    } catch (e) {
        console.log('CatchClause', e);
        console.log('CatchClause', e);
    }
    try {
        uni.removeStorageSync(KEY_LIST);
    } catch (e) {
        console.log('CatchClause', e);
        console.log('CatchClause', e);
    }

    // ✅ 新增：清空“经期记录”缓存（只加清理，不动原逻辑）
    try {
        uni.removeStorageSync(KEY_PERIOD_RECORD);
    } catch (e) {
        console.log('CatchClause', e);
        console.log('CatchClause', e);
    }

    // 兜底：兼容你之前可能写过的 key
    const extraKeys = ['userProfile'];
    extraKeys.forEach((k) => {
        try {
            uni.removeStorageSync(k);
        } catch (e) {
            console.log('CatchClause', e);
            console.log('CatchClause', e);
        }
    });
}
module.exports = {
    KEY_COUPLE_START,
    KEY_LIST,
    KEY_USER_PROFILE,
    getUserProfile,
    setUserProfile,
    clearUserProfile,
    getCoupleStartDate,
    setCoupleStartDate,
    getList,
    setList,
    clearAllLocalData
};
