// 计划页：我的进行中计划 + 官方计划列表（plan.list，蓝图 §9 风格）
const request = require('../../utils/request.js');

Page({
  data: {
    loading: true,
    official: [],       // 官方计划列表
    my: null,           // 进行中的计划 {plan_id, title, total_days, current_day, days:[...]}
    todayItem: null,    // 今天应完成的任务（第一个未完成的 day）
    doneCount: 0        // 已完成天数
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ loading: true });
    request
      .call('plan', { action: 'list' })
      .then((res) => {
        const my = res.my;
        let todayItem = null;
        let doneCount = 0;
        if (my && my.days) {
          doneCount = my.days.filter((d) => d.done).length;
          todayItem = my.days.find((d) => !d.done) || null;
        }
        this.setData({ loading: false, official: res.official, my: my, todayItem: todayItem, doneCount: doneCount });
      })
      .catch(() => this.setData({ loading: false }));
  },

  // 继续跟练：跳跟练执行页（当前应完成的 day）
  goWorkout() {
    const day = this.data.todayItem;
    if (!day || !this.data.my) return;
    wx.navigateTo({
      url: '/pages/workout/workout?plan_id=' + this.data.my.plan_id + '&day_no=' + day.day_no
    });
  },

  // 查看计划详情
  goDetail(e) {
    wx.navigateTo({ url: '/pages/plan-detail/plan-detail?plan_id=' + e.currentTarget.dataset.id });
  }
});
