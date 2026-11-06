/**
 * 云函数 user —— 蓝图 §9.2
 * action: get（读取本人资料）/ update（白名单字段更新本人资料）
 * login（静默建档）为独立云函数；本函数只处理已建档用户。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const usersCollection = db.collection('users');

const GENDERS = ['unknown', 'male', 'female'];
const GOALS = ['减脂', '塑形', '保持'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

// profile 白名单序列化：与 login 云函数保持一致
function toProfile(doc) {
  return {
    id: doc._id,
    nickname: doc.nickname,
    avatarUrl: doc.avatar_url || '',
    gender: doc.gender || 'unknown',
    heightCm: doc.height_cm === undefined ? null : doc.height_cm,
    goal: doc.goal,
    reminderEnabled: !!doc.reminder_enabled,
    reminderTime: doc.reminder_time || '20:00',
    createdAt: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
    lastActiveAt: doc.last_active_at instanceof Date ? doc.last_active_at.toISOString() : doc.last_active_at
  };
}

async function findUser(openid) {
  const res = await usersCollection.where({ openid: openid }).limit(1).get();
  return res.data.length > 0 ? res.data[0] : null;
}

async function handleGet(openid) {
  const user = await findUser(openid);
  if (!user) return fail(2001, '用户不存在，请重新进入小程序');
  return ok({ profile: toProfile(user) });
}

async function handleUpdate(openid, event) {
  const patch = {};

  if (event.nickname !== undefined) {
    if (typeof event.nickname !== 'string' || event.nickname.length < 1 || event.nickname.length > 20) {
      return fail(1002, '参数有误：昵称需为 1-20 个字符');
    }
    patch.nickname = event.nickname;
  }
  if (event.avatar_url !== undefined) {
    if (typeof event.avatar_url !== 'string' || event.avatar_url.length > 500) {
      return fail(1002, '参数有误：avatar_url');
    }
    patch.avatar_url = event.avatar_url;
  }
  if (event.gender !== undefined) {
    if (GENDERS.indexOf(event.gender) === -1) return fail(1002, '参数有误：gender');
    patch.gender = event.gender;
  }
  if (event.height_cm !== undefined) {
    if (typeof event.height_cm !== 'number' || event.height_cm < 80 || event.height_cm > 250) {
      return fail(1002, '参数有误：身高需为 80-250 的数字');
    }
    patch.height_cm = event.height_cm;
  }
  if (event.goal !== undefined) {
    if (GOALS.indexOf(event.goal) === -1) return fail(1002, '参数有误：goal');
    patch.goal = event.goal;
  }
  if (event.reminder_enabled !== undefined) {
    if (typeof event.reminder_enabled !== 'boolean') return fail(1002, '参数有误：reminder_enabled');
    patch.reminder_enabled = event.reminder_enabled;
  }
  if (event.reminder_time !== undefined) {
    if (typeof event.reminder_time !== 'string' || !TIME_RE.test(event.reminder_time)) {
      return fail(1002, '参数有误：提醒时间需为 HH:mm 格式');
    }
    patch.reminder_time = event.reminder_time;
  }

  if (Object.keys(patch).length === 0) return fail(1002, '参数有误：至少传一个可更新字段');

  const user = await findUser(openid);
  if (!user) return fail(2001, '用户不存在，请重新进入小程序');

  patch.last_active_at = db.serverDate();
  await usersCollection.doc(user._id).update({ data: patch });

  const updated = await findUser(openid);
  return ok({ profile: toProfile(updated) });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');

  try {
    switch (event.action) {
      case 'get':
        return await handleGet(OPENID);
      case 'update':
        return await handleUpdate(OPENID, event);
      default:
        return fail(1002, '参数有误：未知 action ' + String(event.action));
    }
  } catch (err) {
    console.error('[user] action=' + event.action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
