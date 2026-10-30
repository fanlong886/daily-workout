/**
 * 云函数 checkin —— 蓝图 §9.3
 * action 分发：types / create / todayStatus / list / monthCalendar / update / delete
 * 统一返回 { code, message, data }；openid 一律取自上下文；date 由服务端按 UTC+8 生成。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const checkinsCollection = db.collection('checkins');
const typesCollection = db.collection('training_types');

const INTENSITIES = ['低', '中', '高'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

/* ---- UTC+8 日期工具（云函数运行于 UTC，须显式 +8；口径见蓝图 §9.1） ---- */

// 以 UTC+8 自然日为基准的日期对象（其 UTC 表示即 UTC+8 本地时间）
function utc8Now() {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return fmtDate(utc8Now());
}

/* ---- 连续天数（云端唯一实现；口径 §9.1：今天有记录从今天往回数，否则从昨天往回数） ----
 * 前端展示入口为 miniprogram/utils/streak.js，两端口径一致，禁止在页面内另算 */
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

// 取本人全部打卡日期（去重）；个人记录量小，一次拉取内存计算
async function loadUserDateSet(openid) {
  const res = await checkinsCollection
    .where({ user_id: openid })
    .field({ date: true })
    .limit(1000)
    .get();
  return new Set(res.data.map((item) => item.date));
}

// 取本人某条记录并校验归属（2001 不存在 / 2002 非本人）
async function getOwnCheckin(openid, checkinId) {
  if (!checkinId || typeof checkinId !== 'string') return { error: fail(1002, '参数有误：checkin_id') };
  let doc;
  try {
    const res = await checkinsCollection.doc(checkinId).get();
    doc = res.data;
  } catch (err) {
    return { error: fail(2001, '记录不存在') };
  }
  if (!doc) return { error: fail(2001, '记录不存在') };
  if (doc.user_id !== openid) return { error: fail(2002, '无权操作') };
  return { doc: doc };
}

// 校验类型并返回字典行（2003 无效）
async function getType(typeId) {
  const res = await typesCollection.where({ _id: typeId, enabled: true }).limit(1).get();
  return res.data.length > 0 ? res.data[0] : null;
}

/* ---- action 实现 ---- */

// 类型字典：enabled=true，按 sort 升序；前端可缓存 24h
async function handleTypes() {
  const res = await typesCollection
    .where({ enabled: true })
    .orderBy('sort', 'asc')
    .get();
  return ok({
    types: res.data.map((t) => ({
      _id: t._id,
      name: t.name,
      icon: t.icon || '',
      default_duration_min: t.default_duration_min,
      sort: t.sort
    }))
  });
}

// 创建打卡：服务端生成 date，一天可多条；返回打卡后连续天数供成功页直接展示
async function handleCreate(openid, event) {
  const typeId = event.type_id;
  const duration = event.duration_min;
  const intensity = event.intensity || '中';
  const note = event.note || '';
  const photoFileId = event.photo_file_id || '';

  if (!typeId || typeof typeId !== 'string') return fail(1002, '参数有误：type_id');
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
    return fail(1002, '参数有误：时长需为 1-600 的整数分钟');
  }
  if (INTENSITIES.indexOf(intensity) === -1) return fail(1002, '参数有误：intensity');
  if (typeof note !== 'string' || note.length > 200) return fail(1002, '参数有误：备注过长');

  const type = await getType(typeId);
  if (!type) return fail(2003, '训练类型无效');

  const date = todayStr();
  const before = await checkinsCollection.where({ user_id: openid, date: date }).count();
  const isTodayFirst = before.total === 0;

  const added = await checkinsCollection.add({
    data: {
      user_id: openid,
      date: date,
      type_id: typeId,
      type_name: type.name, // 快照冗余，字典改名不影响历史展示
      duration_min: duration,
      intensity: intensity,
      note: note,
      photo_file_id: photoFileId,
      source: 'manual',
      created_at: db.serverDate()
    }
  });

  const dateSet = await loadUserDateSet(openid);
  dateSet.add(date);
  const streakAfter = calcStreak(dateSet, date, true);

  return ok({
    checkin_id: added._id,
    date: date,
    is_today_first: isTodayFirst,
    streak_after: streakAfter
  });
}

// 今日状态：是否已练、今日条数、当前连续天数（今天未练不清零，见 §9.1）
async function handleTodayStatus(openid) {
  const date = todayStr();
  const countRes = await checkinsCollection.where({ user_id: openid, date: date }).count();
  const dateSet = await loadUserDateSet(openid);
  const checkedToday = countRes.total > 0;

  return ok({
    date: date,
    checked_today: checkedToday,
    today_count: countRes.total,
    current_streak: calcStreak(dateSet, date, checkedToday)
  });
}

// 打卡历史分页：date 倒序 + created_at 倒序
async function handleList(openid, event) {
  const page = Number.isInteger(event.page) && event.page > 0 ? event.page : 1;
  const pageSize = Number.isInteger(event.page_size) && event.page_size > 0
    ? Math.min(event.page_size, 50)
    : 20;

  const res = await checkinsCollection
    .where({ user_id: openid })
    .orderBy('date', 'desc')
    .orderBy('created_at', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize + 1) // 多取一条判断 has_more
    .get();

  const hasMore = res.data.length > pageSize;
  const list = res.data.slice(0, pageSize).map((item) => ({
    _id: item._id,
    date: item.date,
    type_id: item.type_id,
    type_name: item.type_name,
    duration_min: item.duration_min,
    intensity: item.intensity,
    note: item.note || '',
    photo_file_id: item.photo_file_id || '',
    created_at: item.created_at
  }));

  return ok({ list: list, page: page, page_size: pageSize, has_more: hasMore });
}

// 当月日历点亮（P0 前端固定当月只读；month 参数为 P1 切月预留）
async function handleMonthCalendar(openid, event) {
  let month = event.month || todayStr().slice(0, 7);
  if (!MONTH_RE.test(month)) return fail(1002, '参数有误：month 需为 YYYY-MM');

  const year = Number(month.slice(0, 4));
  const monthNum = Number(month.slice(5, 7));
  if (monthNum < 1 || monthNum > 12) return fail(1002, '参数有误：month');

  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const firstDay = month + '-01';
  const lastDay = month + '-' + String(daysInMonth).padStart(2, '0');

  const res = await checkinsCollection
    .where({ user_id: openid, date: _.gte(firstDay).and(_.lte(lastDay)) })
    .field({ date: true })
    .limit(1000)
    .get();

  const checkedSet = new Set(res.data.map((item) => item.date));
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = month + '-' + String(d).padStart(2, '0');
    days.push({ date: dateStr, checked: checkedSet.has(dateStr) });
  }

  return ok({ month: month, days: days, checked_count: checkedSet.size });
}

// 编辑打卡：可改 type_id / duration_min / intensity / note / photo_file_id；date、source 不可改
async function handleUpdate(openid, event) {
  const checkinId = event.checkin_id;
  const patch = {};

  if (event.type_id !== undefined) {
    if (!event.type_id || typeof event.type_id !== 'string') return fail(1002, '参数有误：type_id');
    const type = await getType(event.type_id);
    if (!type) return fail(2003, '训练类型无效');
    patch.type_id = event.type_id;
    patch.type_name = type.name; // 同步快照
  }
  if (event.duration_min !== undefined) {
    if (!Number.isInteger(event.duration_min) || event.duration_min < 1 || event.duration_min > 600) {
      return fail(1002, '参数有误：时长需为 1-600 的整数分钟');
    }
    patch.duration_min = event.duration_min;
  }
  if (event.intensity !== undefined) {
    if (INTENSITIES.indexOf(event.intensity) === -1) return fail(1002, '参数有误：intensity');
    patch.intensity = event.intensity;
  }
  if (event.note !== undefined) {
    if (typeof event.note !== 'string' || event.note.length > 200) return fail(1002, '参数有误：备注过长');
    patch.note = event.note;
  }
  if (event.photo_file_id !== undefined) {
    if (typeof event.photo_file_id !== 'string') return fail(1002, '参数有误：photo_file_id');
    patch.photo_file_id = event.photo_file_id;
  }

  if (Object.keys(patch).length === 0) return fail(1002, '参数有误：至少传一个可更新字段');

  const found = await getOwnCheckin(openid, checkinId);
  if (found.error) return found.error;

  await checkinsCollection.doc(checkinId).update({ data: patch });
  return ok({ updated: true });
}

// 删除打卡：删除后重算连续天数（若删的是今日唯一记录，状态自然回退）
async function handleDelete(openid, event) {
  const found = await getOwnCheckin(openid, event.checkin_id);
  if (found.error) return found.error;

  await checkinsCollection.doc(event.checkin_id).remove();

  // 顺带清理云存储照片，避免孤儿文件；清理失败不影响删除结果
  if (found.doc.photo_file_id) {
    try {
      await cloud.deleteFile({ fileList: [found.doc.photo_file_id] });
    } catch (e) {
      console.warn('[checkin] 删除照片文件失败:', e);
    }
  }

  const date = todayStr();
  const dateSet = await loadUserDateSet(openid);
  const checkedToday = dateSet.has(date);

  return ok({
    deleted: true,
    current_streak: calcStreak(dateSet, date, checkedToday)
  });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');
  const action = event.action;

  try {
    switch (action) {
      case 'types':
        return await handleTypes();
      case 'create':
        return await handleCreate(OPENID, event);
      case 'todayStatus':
        return await handleTodayStatus(OPENID);
      case 'list':
        return await handleList(OPENID, event);
      case 'monthCalendar':
        return await handleMonthCalendar(OPENID, event);
      case 'update':
        return await handleUpdate(OPENID, event);
      case 'delete':
        return await handleDelete(OPENID, event);
      default:
        return fail(1002, '参数有误：未知 action ' + String(action));
    }
  } catch (err) {
    console.error('[checkin] action=' + action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
