// 计划详情页：计划信息 + 全量天任务（完成态）+ 开始/继续计划
const request = require('../../utils/request.js');

Page({
  data: {
    loading: true,
    plan: null,
    items: [],
    joined: false,
    myStatus: null,
    joining: false
  },

  onLoad(options) {
    this.planId = options.plan_id || '';
    this.refresh();
  },

  onShow() {
    // 从跟练页返回时刷新完成态
    if (this.planId) this.refresh();
  },

  refresh() {
    this.setData({ loading: true });
    request
      .call('plan', { action: 'detail', plan_id: this.planId })
      .then((res) => {
        this.setData({
          loading: false,
          plan: res.plan,
          items: res.items,
          joined: res.joined,
          myStatus: res.my_status
        });
      })
      .catch(() => this.setData({ loading: false }));
  },

  // 开始计划：join 成功后直接进跟练页做 Day 1
  onJoin() {
    if (this.data.joining || this.data.joined) return;
    this.setData({ joining: true });
    request
      .call('plan', { action: 'join', plan_id: this.planId })
      .then(() => {
        this.setData({ joining: false, joined: true, myStatus: 'ongoing' });
        const first = this.data.items.find((item) => !item.done) || this.data.items[0];
        if (first) {
          wx.redirectTo({
            url: '/pages/workout/workout?plan_id=' + this.planId + '&day_no=' + first.day_no
          });
        }
      })
      .catch(() => this.setData({ joining: false }));
  },

  // 已加入：跳跟练页（第一个未完成的天）
  onContinue() {
    const next = this.data.items.find((item) => !item.done);
    if (next) {
      wx.navigateTo({
        url: '/pages/workout/workout?plan_id=' + this.planId + '&day_no=' + next.day_no
      });
    }
  }
});
