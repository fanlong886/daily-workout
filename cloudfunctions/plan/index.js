/**
 * 云函数 plan —— P1-4 官方计划模板 + 跟练（蓝图 §3 / §6）
 * action: list（官方列表 + 我的进行中计划）/ detail / join / completeDay / quit
 *
 * 说明：
 * - 连续天数等统计逻辑不在本云函数（约束见蓝图；打卡走 checkin.create 复用徽章/广场链路）
 * - plan_items 允许导入时只带 type_name：读取时按名称自动映射 training_types 的 _id/icon（免人工回填）
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const plansCollection = db.collection('plans');
const planItemsCollection = db.collection('plan_items');
const userPlansCollection = db.collection('user_plans');
const checkinsCollection = db.collection('checkins');
const typesCollection = db.collection('training_types');

const ok = (data) => ({ code: 0, message: 'ok', data: data });
const fail = (code, message) => ({ code: code, message: message, data: null });

/* ---- UTC+8 日期工具（口径与 checkin/stats 云函数一致，见蓝图 §9.1） ---- */

function utc8Now() {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return fmtDate(utc8Now());
}

/* ---- 通用查询 ---- */

// training_types 名称 → {_id, icon, name} 映射（免人工回填 type_id 的兜底）
async function loadTypeNameMap() {
  const res = await typesCollection.limit(100).get();
  const map = {};
  res.data.forEach((t) => {
    map[t.name] = { _id: t._id, icon: t.icon || '', name: t.name };
  });
  return map;
}

// 本人某计划的全部打卡（plan_day 集合）
async function loadPlanDoneDays(openid, planId) {
  const res = await checkinsCollection
    .where({ user_id: openid, plan_id: planId })
    .field({ plan_day: true })
    .limit(1000)
    .get();
  const doneSet = new Set();
  res.data.forEach((item) => {
    if (item.plan_day) doneSet.add(item.plan_day);
  });
  return doneSet;
}

// 组装计划的天任务列表（type_name 映射兜底 + done 标记）
function buildDays(items, nameMap, doneSet) {
  return items
    .sort((a, b) => a.day_no - b.day_no)
    .map((item) => {
      const mapped = !item.type_id && item.type_name && nameMap[item.type_name]
        ? nameMap[item.type_name]
        : null;
      return {
        day_no: item.day_no,
        title: item.title,
        duration_min: item.duration_min,
        tips: item.tips || '',
        type_id: item.type_id || (mapped ? mapped._id : ''),
        icon: item.icon || (mapped ? mapped.icon : ''),
        type_name: item.type_name || (mapped ? mapped.name : ''),
        done: doneSet ? doneSet.has(item.day_no) : false
      };
    });
}

async function findMyUserPlan(openid, planId, status) {
  const where = { user_id: openid, plan_id: planId };
  if (status) where.status = status;
  const res = await userPlansCollection.where(where).orderBy('created_at', 'desc').limit(1).get();
  return res.data[0] || null;
}

/* ---- action 实现 ---- */

// list：官方计划 + 我的进行中计划（含逐日 done 标记）
async function handleList(openid) {
  const officialRes = await plansCollection
    .where({ is_official: true })
    .orderBy('total_days', 'asc')
    .get();

  const official = officialRes.data.map((p) => ({
    _id: p._id,
    title: p.title,
    cover: p.cover || '',
    level: p.level || '',
    total_days: p.total_days,
    goal_tag: p.goal_tag || '',
    description: p.description || ''
  }));

  const ongoingRes = await userPlansCollection
    .where({ user_id: openid, status: 'ongoing' })
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();

  // 已完成计划（最近一条）：供计划页完成态展示
  const completedRes = await userPlansCollection
    .where({ user_id: openid, status: 'completed' })
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();

  let my = null;
  const ongoing = ongoingRes.data[0];
  if (ongoing) {
    const planRes = await plansCollection.doc(ongoing.plan_id).get().catch(() => null);
    const plan = planRes ? planRes.data : null;
    const itemsRes = await planItemsCollection.where({ plan_id: ongoing.plan_id }).limit(100).get();
    const doneSet = await loadPlanDoneDays(openid, ongoing.plan_id);
    const nameMap = await loadTypeNameMap();

    my = {
      plan_id: ongoing.plan_id,
      title: plan ? plan.title : '训练计划',
      cover: plan ? plan.cover || '' : '',
      total_days: plan ? plan.total_days : itemsRes.data.length,
      status: ongoing.status,
      current_day: ongoing.current_day,
      start_date: ongoing.start_date,
      days: buildDays(itemsRes.data, nameMap, doneSet)
    };
  }

  let completed = null;
  const completedDoc = completedRes.data[0];
  if (completedDoc) {
    const planRes = await plansCollection.doc(completedDoc.plan_id).get().catch(() => null);
    completed = {
      plan_id: completedDoc.plan_id,
      title: planRes && planRes.data ? planRes.data.title : '训练计划',
      total_days: planRes && planRes.data ? planRes.data.total_days : 0
    };
  }

  return ok({ official: official, my: my, completed: completed });
}

// detail：计划 + 全量天任务 + 加入状态
async function handleDetail(openid, event) {
  if (!event.plan_id || typeof event.plan_id !== 'string') return fail(1002, '参数有误：plan_id');

  const planRes = await plansCollection.doc(event.plan_id).get().catch(() => null);
  if (!planRes || !planRes.data) return fail(2001, '计划不存在');
  const plan = planRes.data;

  const itemsRes = await planItemsCollection
    .where({ plan_id: event.plan_id })
    .limit(100)
    .get();

  const mine = await findMyUserPlan(openid, event.plan_id);
  const doneSet = mine ? await loadPlanDoneDays(openid, event.plan_id) : null;
  const nameMap = await loadTypeNameMap();

  return ok({
    plan: {
      _id: plan._id,
      title: plan.title,
      cover: plan.cover || '',
      level: plan.level || '',
      total_days: plan.total_days,
      goal_tag: plan.goal_tag || '',
      description: plan.description || ''
    },
    items: buildDays(itemsRes.data, nameMap, doneSet),
    joined: !!mine,
    my_status: mine ? mine.status : null
  });
}

// join：加入计划；同计划进行中不允许重复（2004）
async function handleJoin(openid, event) {
  if (!event.plan_id || typeof event.plan_id !== 'string') return fail(1002, '参数有误：plan_id');

  const planRes = await plansCollection.doc(event.plan_id).get().catch(() => null);
  if (!planRes || !planRes.data) return fail(2001, '计划不存在');

  const existing = await findMyUserPlan(openid, event.plan_id, 'ongoing');
  if (existing) return fail(2004, '该计划正在进行中，无需重复加入');

  const added = await userPlansCollection.add({
    data: {
      user_id: openid,
      plan_id: event.plan_id,
      start_date: todayStr(),
      status: 'ongoing',
      current_day: 1,
      created_at: db.serverDate()
    }
  });

  return ok({ user_plan_id: added._id });
}

// completeDay：幂等推进。打卡由前端先调 checkin.create(plan 参数)；
// 本 action 校验该 plan_day 已有打卡后推进 current_day / 完成状态
async function handleCompleteDay(openid, event) {
  if (!event.plan_id || typeof event.plan_id !== 'string') return fail(1002, '参数有误：plan_id');
  if (!Number.isInteger(event.day_no) || event.day_no < 1) return fail(1002, '参数有误：day_no');

  const mine = await findMyUserPlan(openid, event.plan_id, 'ongoing');
  if (!mine) return fail(2005, '计划不在进行中');

  const doneSet = await loadPlanDoneDays(openid, event.plan_id);
  if (!doneSet.has(event.day_no)) {
    // 该天还没有打卡记录：提示前端先完成 checkin.create（幂等防御）
    return ok({ already_done: false, current_day: mine.current_day, status: mine.status, finished: false });
  }

  // 推进到下一个未完成的 day_no；全部完成则标记 completed
  const itemsRes = await planItemsCollection
    .where({ plan_id: event.plan_id })
    .field({ day_no: true })
    .limit(100)
    .get();
  const allDays = itemsRes.data.map((item) => item.day_no).sort((a, b) => a - b);
  const nextDay = allDays.find((d) => !doneSet.has(d));

  const patch = nextDay
    ? { current_day: nextDay }
    : { status: 'completed', current_day: mine.current_day };
  await userPlansCollection.doc(mine._id).update({ data: patch });

  return ok({
    already_done: true,
    current_day: nextDay || mine.current_day,
    status: nextDay ? 'ongoing' : 'completed',
    finished: !nextDay
  });
}

// quit：放弃计划（保留历史打卡）
async function handleQuit(openid, event) {
  if (!event.plan_id || typeof event.plan_id !== 'string') return fail(1002, '参数有误：plan_id');

  const mine = await findMyUserPlan(openid, event.plan_id, 'ongoing');
  if (!mine) return fail(2005, '计划不在进行中');

  await userPlansCollection.doc(mine._id).update({ data: { status: 'quit' } });
  return ok({ quit: true });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(1001, '请重新进入小程序');
  const action = event.action;

  try {
    switch (action) {
      case 'list':
        return await handleList(OPENID);
      case 'detail':
        return await handleDetail(OPENID, event);
      case 'join':
        return await handleJoin(OPENID, event);
      case 'completeDay':
        return await handleCompleteDay(OPENID, event);
      case 'quit':
        return await handleQuit(OPENID, event);
      default:
        return fail(1002, '参数有误：未知 action ' + String(action));
    }
  } catch (err) {
    console.error('[plan] action=' + action + ' error:', err);
    return fail(5000, '服务开小差了，稍后再试');
  }
};
