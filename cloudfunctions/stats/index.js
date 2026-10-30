/**
 * 云函数 stats —— 蓝图 §9.4
 * action: summary（统计摘要：累计天数/连续天数/本周次数/本月天数/累计时长）
 * P0 基于本人 checkins 实时聚合，不建 user_stats 冗余表。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const checkinsCollection = db.collection('checkins');

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

/* ---- UTC+8 日期工具（与 checkin 云函数口径一致，见蓝图 §9.1） ---- */

function utc8Now() {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

// UTC+8 本周周一（自然周，周一为起点）
function mondayStr(today) {
  const d = new Date(today + 'T00:00:00Z');
  const offset = (d.getUTCDay() + 6) % 7; // 周日=0 → 6，周一 → 0
  d.setUTCDate(d.getUTCDate() - offset);
  return fmtDate(d);
}

/* ---- 连续天数（口径 §9.1，与 checkin 云函数 / utils/streak.js 一致） ---- */
function calcStreak(dateSet, today, checkedToday) {
  const cursor = new Date(today + 'T00:00:00Z');
  if (!checkedToday) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!dateSet.has(fmtDate(cursor))) return 0;
  }
  let streak = 0;
  while (dateSet.has(fmtDate(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function handleSummary(openid) {
  const today = fmtDate(utc8Now());
  const monday = mondayStr(today);
  const monthPrefix = today.slice(0, 7); // YYYY-MM

  const res = await checkinsCollection
    .where({ user_id: openid })
    .field({ date: true, duration_min: true })
    .limit(1000)
    .get();

  const dateSet = new Set();
  let totalDuration = 0;
  let weekCount = 0;
  let monthDateSet = new Set();

  res.data.forEach((item) => {
    dateSet.add(item.date);
    totalDuration += item.duration_min || 0;
    if (item.date >= monday) weekCount++;
    if (item.date.slice(0, 7) === monthPrefix) monthDateSet.add(item.date);
  });

  return ok({
    total_days: dateSet.size,
    current_streak: calcStreak(dateSet, today, dateSet.has(today)),
    week_count: weekCount,
    month_days: monthDateSet.size,
    total_duration_min: totalDuration
  });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');

  try {
    switch (event.action) {
      case 'summary':
        return await handleSummary(OPENID);
      default:
        return fail(1002, '参数有误：未知 action ' + String(event.action));
    }
  } catch (err) {
    console.error('[stats] action=' + event.action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
