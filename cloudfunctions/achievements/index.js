/**
 * 云函数 achievements —— P1 成就徽章（蓝图 §3 P1-6）
 * action: list（徽章墙数据：定义 + 解锁状态 + 进度）
 *
 * 口径决策：解锁条件 = 历史最长连续打卡天数（longest_streak）达到阈值，只增不减、永久持有。
 * 徽章定义内置为常量（P1 共 5 枚固定里程碑，无需控制台导入）；未来扩展徽章种类时再考虑入库。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const checkinsCollection = db.collection('checkins');
const userBadgesCollection = db.collection('user_achievements');

// 徽章定义（内置常量，阈值 = 历史最长连续打卡天数）
const BADGES = [
  { code: 'streak_3', name: '星火', icon: '🔥', desc: '连续打卡 3 天', threshold: 3 },
  { code: 'streak_7', name: '一周之约', icon: '📅', desc: '连续打卡 7 天', threshold: 7 },
  { code: 'streak_21', name: '习惯成型', icon: '💪', desc: '连续打卡 21 天', threshold: 21 },
  { code: 'streak_50', name: '半百征程', icon: '🏅', desc: '连续打卡 50 天', threshold: 50 },
  { code: 'streak_100', name: '百日筑基', icon: '🏆', desc: '连续打卡 100 天', threshold: 100 }
];

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

/* ---- 连续天数工具（UTC+8 字符串口径，与 checkin/stats 云函数一致，见蓝图 §9.1） ---- */

function utc8Now() {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

// 历史最长连续打卡天数：排序日期后扫描连续段（每段起止差 1 天即延续）
function calcLongestStreak(dateSet) {
  const dates = Array.from(dateSet).sort();
  let longest = 0;
  let cur = 0;
  let prevMs = null;
  dates.forEach((date) => {
    const ms = Date.parse(date + 'T00:00:00Z');
    if (prevMs !== null && ms - prevMs === 24 * 3600 * 1000) {
      cur++;
    } else {
      cur = 1;
    }
    if (cur > longest) longest = cur;
    prevMs = ms;
  });
  return longest;
}

async function loadUserDateSet(openid) {
  const res = await checkinsCollection
    .where({ user_id: openid })
    .field({ date: true })
    .limit(1000)
    .get();
  return new Set(res.data.map((item) => item.date));
}

/**
 * 核心入口：计算最长连续并检查解锁。
 * 供本函数 list 使用；checkin.create 的解锁检查走 checkin 云函数内同款逻辑（口径一致）。
 */
async function evaluateBadges(openid) {
  const dateSet = await loadUserDateSet(openid);
  const longest = calcLongestStreak(dateSet);

  const ownedRes = await userBadgesCollection
    .where({ user_id: openid })
    .limit(100)
    .get();
  const ownedMap = {}; // code -> unlocked_at
  ownedRes.data.forEach((item) => {
    ownedMap[item.code] = item.unlocked_at;
  });

  return { longest: longest, ownedMap: ownedMap };
}

async function handleList(openid) {
  const { longest, ownedMap } = await evaluateBadges(openid);

  const badges = BADGES.map((def) => ({
    code: def.code,
    name: def.name,
    icon: def.icon,
    desc: def.desc,
    threshold: def.threshold,
    unlocked: ownedMap[def.code] !== undefined,
    unlocked_at: ownedMap[def.code] || null,
    progress: Math.min(longest, def.threshold) // 未解锁时用于进度展示
  }));

  return ok({ badges: badges, longest_streak: longest });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');

  try {
    switch (event.action) {
      case 'list':
        return await handleList(OPENID);
      default:
        return fail(1002, '参数有误：未知 action ' + String(event.action));
    }
  } catch (err) {
    console.error('[achievements] action=' + event.action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
