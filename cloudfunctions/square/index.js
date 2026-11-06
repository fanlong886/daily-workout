/**
 * 云函数 square —— P1 打卡广场（蓝图 §3 P1-5）
 * action: list（公开 feed 分页）/ like（点赞切换：赞/取消赞）
 * feed 内容隐私最小化：仅昵称/头像/类型/时长，不含备注和照片。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const feedCollection = db.collection('square_feed');

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

// 公开 feed 分页：created_at 倒序 + 当前用户点赞状态标记
async function handleList(openid, event) {
  const page = Number.isInteger(event.page) && event.page > 0 ? event.page : 1;
  const pageSize = Number.isInteger(event.page_size) && event.page_size > 0
    ? Math.min(event.page_size, 50)
    : 10;

  const res = await feedCollection
    .orderBy('created_at', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize + 1) // 多取一条判断 has_more
    .get();

  const hasMore = res.data.length > pageSize;
  const list = res.data.slice(0, pageSize).map((item) => ({
    _id: item._id,
    user_id: item.user_id,
    nickname: item.nickname,
    avatar_url: item.avatar_url || '',
    icon: item.icon || '',
    type_name: item.type_name,
    duration_min: item.duration_min,
    date: item.date,
    like_count: item.like_count || 0,
    liked: (item.liked_by || []).indexOf(openid) > -1,
    created_at: item.created_at
  }));

  return ok({ list: list, page: page, page_size: pageSize, has_more: hasMore });
}

// 点赞切换：已赞则取消，未赞则加上；like_count 冗余同步
async function handleLike(openid, event) {
  const postId = event.post_id;
  if (!postId || typeof postId !== 'string') return fail(1002, '参数有误：post_id');

  let doc;
  try {
    const res = await feedCollection.doc(postId).get();
    doc = res.data;
  } catch (err) {
    return fail(2001, '动态不存在或已被删除');
  }
  if (!doc) return fail(2001, '动态不存在或已被删除');

  const likedBy = doc.liked_by || [];
  const liked = likedBy.indexOf(openid) > -1;

  if (liked) {
    await feedCollection.doc(postId).update({
      data: {
        liked_by: _.pull(openid),
        like_count: _.inc(-1)
      }
    });
    return ok({
      like_count: Math.max((doc.like_count || 0) - 1, 0),
      liked: false
    });
  }

  await feedCollection.doc(postId).update({
    data: {
      liked_by: _.push([openid]),
      like_count: _.inc(1)
    }
  });
  return ok({
    like_count: (doc.like_count || 0) + 1,
    liked: true
  });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');

  try {
    switch (event.action) {
      case 'list':
        return await handleList(OPENID, event);
      case 'like':
        return await handleLike(OPENID, event);
      default:
        return fail(1002, '参数有误：未知 action ' + String(event.action));
    }
  } catch (err) {
    console.error('[square] action=' + event.action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
