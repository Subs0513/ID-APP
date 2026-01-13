function pad(n) {
    return n < 10 ? '0' + n : '' + n;
}
function formatDate(date) {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${y}-${m}-${d}`;
}
function parseDate(dateStr) {
    // dateStr: "YYYY-MM-DD"
    if (!dateStr) {
        return null;
    }
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
        return null;
    }
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) {
        return null;
    }
    return new Date(y, m - 1, d);
}
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function diffDays(dateStrA, dateStrB) {
    // B - A (天)
    const a = parseDate(dateStrA);
    const b = parseDate(dateStrB);
    if (!a || !b) {
        return 0;
    }
    const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
    return Math.floor(ms / 86400000);
}
function todayStr() {
    return formatDate(new Date());
}
function daysSince(dateStr) {
    return diffDays(dateStr, todayStr());
}
function daysTo(dateStr) {
    return diffDays(todayStr(), dateStr);
}
module.exports = {
    formatDate,
    parseDate,
    todayStr,
    diffDays,
    daysSince,
    daysTo
};
