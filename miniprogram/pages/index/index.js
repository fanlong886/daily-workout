// 今日页：打卡台。数据来自 checkin.todayStatus / checkin.create（蓝图 §9.3）
const request = require('../../utils/request.js');

Page({
  data: {
    loading: true,       // 首屏加载中
    checkedToday: false, // 今日是否已打卡
    streakDays: 0,       // 连续天数（云端计算返回，页面不本地重算）
    todayCount: 0,       // 今日打卡条数
    weekCount: 0,        // 本周打卡次数（stats.summary.week_count）
    recommend: {
      title: '新手燃脂 15 分钟',
      desc: '低冲击 · 无器械 · 客厅就能练',
      duration: 15
    },
    showEditor: false,   // 打卡弹层
    successInfo: null    // 打卡成功信息 { streak, date, isFirst }
  },

  onShow() {
    // onShow 而非 onLoad：从其他 tab 返回时刷新今日状态
    this.refreshTodayStatus();
    this.refreshWeekCount();
  },

  // 本周概览：首页只用到 week_count，与数据页 summary 共用接口
  refreshWeekCount() {
    request
      .call('stats', { action: 'summary' })
      .then((res) => this.setData({ weekCount: res.week_count }))
      .catch(() => {});
  },

  refreshTodayStatus() {
    request
      .call('checkin', { action: 'todayStatus' })
      .then((res) => {
        this.setData({
          loading: false,
          checkedToday: res.checked_today,
          streakDays: res.current_streak,
          todayCount: res.today_count
        });
      })
      .catch(() => this.setData({ loading: false }));
  },

  // 打开打卡弹层（快速打卡按钮）
  onQuickCheckin() {
    if (this.data.loading) return;
    this.setData({ showEditor: true });
  },

  // 弹层打卡成功：用 create 返回值直接更新，免二次请求
  onCheckinCreated(e) {
    const { streak, date } = e.detail;
    this.setData({
      showEditor: false,
      checkedToday: true,
      streakDays: streak,
      weekCount: this.data.weekCount + 1, // 本地 +1，与云端口径下次 onShow 校正
      successInfo: { streak: streak, date: date }
    });
  },

  // 成功弹层关闭
  onSuccessClose() {
    this.setData({ successInfo: null });
  },

  // 打卡弹层关闭
  onEditorClose() {
    this.setData({ showEditor: false });
  },

  // 今日推荐入口：跟练为 P1，本批占位
  onRecommendTap() {
    wx.showToast({ title: '跟练功能下一批次上线', icon: 'none' });
  }
});
