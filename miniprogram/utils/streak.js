/**
 * 连续天数前端唯一计算入口（口径以《MVP产品蓝图》§9.1 为准）：
 * - 今天有记录：从今天往回连续计数
 * - 今天没有记录：从昨天往回计数（今天未练不清零）
 * - 自然日以 UTC+8 为准，date 格式 YYYY-MM-DD
 *
 * ⚠️ 连续天数计算只允许出现在本文件（前端入口）与对应云函数（云端），
 * 其他任何文件不得重复实现此逻辑；两端口径必须保持一致。
 */

/**
 * 计算当前连续天数
 * @param {string[]} dates 已打卡日期集合（YYYY-MM-DD 字符串数组，可重复，内部去重）
 * @returns {number} 当前连续天数
 */
function calcCurrentStreak(dates) {
  if (!dates || dates.length === 0) return 0;

  const dateSet = new Set(dates);

  // UTC+8 自然日：给 UTC 时间加 8 小时后，其 UTC 表示即 UTC+8 本地时间
  const cursor = new Date(Date.now() + 8 * 3600 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10);

  // 今天没练：从昨天往回数（不清零展示）
  if (!dateSet.has(fmt(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!dateSet.has(fmt(cursor))) return 0;
  }

  let streak = 0;
  while (dateSet.has(fmt(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

module.exports = {
  calcCurrentStreak: calcCurrentStreak
};
