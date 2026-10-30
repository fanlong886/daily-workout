/**
 * 云函数 body —— 蓝图 §9.5
 * action: add（体重录入，同日可多条）/ trend（体重趋势，同日取最后一次）
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const bodyCollection = db.collection('body_metrics');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

/* ---- UTC+8 日期工具（与其他云函数口径一致，见蓝图 §9.1） ---- */

function utc8Now() {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return fmtDate(utc8Now());
}

// 录入：weight_kg 必填（25-300，保留 1 位小数）；date 默认今天，可补录过去、不可晚于今天
async function handleAdd(openid, event) {
  if (typeof event.weight_kg !== 'number' || isNaN(event.weight_kg) || event.weight_kg < 25 || event.weight_kg > 300) {
    return fail(1002, '参数有误：体重需为 25-300 之间的数字');
  }
  let bodyFat = null;
  if (event.body_fat_pct !== undefined && event.body_fat_pct !== null) {
    if (typeof event.body_fat_pct !== 'number' || isNaN(event.body_fat_pct) || event.body_fat_pct < 1 || event.body_fat_pct > 70) {
      return fail(1002, '参数有误：体脂率需为 1-70 之间的数字');
    }
    bodyFat = event.body_fat_pct;
  }

  let date = event.date || todayStr();
  if (typeof date !== 'string' || !DATE_RE.test(date)) return fail(1002, '参数有误：date 需为 YYYY-MM-DD');
  if (date > todayStr()) return fail(1002, '日期不能晚于今天');

  const added = await bodyCollection.add({
    data: {
      user_id: openid,
      date: date,
      weight_kg: Math.round(event.weight_kg * 10) / 10,
      body_fat_pct: bodyFat,
      created_at: db.serverDate()
    }
  });

  return ok({ record_id: added._id });
}

// 趋势：最近 days 天（默认 30，上限 365），按日期升序，同日取最后一次录入
async function handleTrend(openid, event) {
  const days = Number.isInteger(event.days) && event.days > 0 ? Math.min(event.days, 365) : 30;

  const start = utc8Now();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startStr = fmtDate(start);

  const res = await bodyCollection
    .where({ user_id: openid, date: _.gte(startStr) })
    .orderBy('date', 'asc')
    .orderBy('created_at', 'asc')
    .limit(1000)
    .get();

  // 升序遍历同键覆盖 → 每个日期留下最后一次录入
  const byDate = {};
  res.data.forEach((item) => {
    byDate[item.date] = item;
  });
  const records = Object.keys(byDate)
    .sort()
    .map((date) => ({
      date: date,
      weight_kg: byDate[date].weight_kg,
      body_fat_pct: byDate[date].body_fat_pct
    }));

  const latest = records.length > 0 ? records[records.length - 1] : null;
  let diffKg = null;
  if (records.length >= 2) {
    diffKg = Math.round((latest.weight_kg - records[0].weight_kg) * 10) / 10;
  }

  return ok({
    records: records,
    latest: latest,
    diff_kg: diffKg
  });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');

  try {
    switch (event.action) {
      case 'add':
        return await handleAdd(OPENID, event);
      case 'trend':
        return await handleTrend(OPENID, event);
      default:
        return fail(1002, '参数有误：未知 action ' + String(event.action));
    }
  } catch (err) {
    console.error('[body] action=' + event.action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
