/**
 * 云函数 reminder —— P1 每日提醒（蓝图 §3 P1-2）
 * 定时触发：每天 20:00（北京时间，见 config.json 触发器）
 * 逻辑：给所有开启提醒且当天尚未打卡的用户发送「打卡提醒」订阅消息。
 * 一次性订阅说明：用户授权一次只能收一条，推送消耗配额后由打卡成功时的静默续订补回。
 * 手动测试：开发者工具右键该云函数「云端测试」，不传参数即可执行。
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const usersCollection = db.collection('users');
const checkinsCollection = db.collection('checkins');

// 订阅消息模板 ID（mp 后台「我的模板」，关键词顺序：提醒时间/打卡状态/打卡主题/备注）
const TMPL_ID = 'D4SGGA5U5yVZbo8ebAcf8Uj7Bwxw5DXUIhLlrtI5rA8';

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

function todayStr() {
  // UTC+8 自然日（口径与 checkin/stats 云函数一致，见蓝图 §9.1）
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const isManualTest = !OPENID; // 定时触发无用户上下文；云端测试也会走到这里
  const today = todayStr();

  try {
    const res = await usersCollection
      .where({ reminder_enabled: true })
      .limit(1000)
      .get();

    let sent = 0;
    let skippedCheckedIn = 0;
    let failed = 0;

    for (const user of res.data) {
      // 已打卡的用户今天不打扰
      const count = await checkinsCollection
        .where({ user_id: user.openid, date: today })
        .count();
      if (count.total > 0) {
        skippedCheckedIn++;
        continue;
      }

      try {
        await cloud.openapi.subscribeMessage.send({
          touser: user.openid,
          templateId: TMPL_ID,
          page: 'pages/index/index',
          data: {
            // 关键词顺序 = 申请模板时的点选顺序：提醒时间/打卡状态/打卡主题/备注
            keyword1: { value: `${today} ${(user.reminder_time || '20:00')}` },
            keyword2: { value: '今日还未打卡' },
            keyword3: { value: '今天练了吗？该动起来啦' },
            keyword4: { value: '点击进入小程序完成今日打卡' }
          }
        });
        sent++;
      } catch (e) {
        // 43101 = 用户未订阅或配额已用尽（等打卡续订后自然恢复）
        console.warn('[reminder] 推送失败 openid=' + user.openid, e.errMsg || e.message);
        failed++;
      }
    }

    return ok({
      total_users: res.data.length,
      sent: sent,
      skipped_checked_in: skippedCheckedIn,
      failed: failed,
      triggered_by: isManualTest ? 'manual_test' : 'timer'
    });
  } catch (err) {
    console.error('[reminder] error:', err);
    return fail(5000, '提醒任务执行失败');
  }
};
