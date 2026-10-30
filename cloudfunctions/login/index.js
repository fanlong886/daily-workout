/**
 * 云函数 login —— 蓝图 §9.2 user.login 静默登录/注册
 * 职责：从上下文取 openid → 查 users 建档/更新活跃时间 → 返回 { is_new_user, profile }
 * 统一返回 { code, message, data }；openid 一律取自上下文，前端不传身份参数。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const usersCollection = db.collection('users');

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

// 生成默认昵称：健身er_四位随机
function randomNickname() {
  return '健身er_' + String(Math.floor(1000 + Math.random() * 9000));
}

// profile 白名单序列化：时间字段转 ISO 字符串，库内实现细节不出 service 层
function toProfile(doc) {
  return {
    id: doc._id,
    nickname: doc.nickname,
    avatarUrl: doc.avatar_url || '',
    gender: doc.gender || 'unknown',
    heightCm: doc.height_cm === undefined ? null : doc.height_cm,
    goal: doc.goal,
    createdAt: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
    lastActiveAt: doc.last_active_at instanceof Date ? doc.last_active_at.toISOString() : doc.last_active_at
  };
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail(1001, '请重新进入小程序');
  }

  try {
    const found = await usersCollection.where({ openid: OPENID }).limit(1).get();

    // 老用户：刷新活跃时间后返回
    if (found.data.length > 0) {
      const user = found.data[0];
      await usersCollection.doc(user._id).update({
        data: { last_active_at: db.serverDate() }
      });
      return ok({
        is_new_user: false,
        profile: toProfile(user)
      });
    }

    // 新用户建档（默认值见蓝图 §10.1）
    const now = db.serverDate();
    const nickname = randomNickname();
    const added = await usersCollection.add({
      data: {
        openid: OPENID,
        nickname: nickname,
        avatar_url: '',
        gender: 'unknown',
        height_cm: null,
        goal: '减脂',
        created_at: now,
        last_active_at: now
      }
    });

    return ok({
      is_new_user: true,
      profile: {
        id: added._id,
        nickname: nickname,
        avatarUrl: '',
        gender: 'unknown',
        heightCm: null,
        goal: '减脂',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[login] error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
