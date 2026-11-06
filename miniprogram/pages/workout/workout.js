// 跟练执行页：倒计时计时器 → 完成 = checkin.create(plan 参数) + plan.completeDay（幂等推进）
const request = require('../../utils/request.js');

Page({
  data: {
    loading: true,
    dayNo: 1,
    item: null,          // 当日任务 {title, duration_min, icon, tips}
    remainSec: 0,        // 剩余秒数
    minutes: '00:00',    // 剩余时间的 mm:ss 展示（每秒随 remainSec 同步）
    totalSec: 0,
    running: false,      // 是否计时中
    finishing: false,    // 打卡提交中
    finished: false      // 已完成（防重复提交 + 完成态展示）
  },

  timer: null,

  onLoad(options) {
    this.planId = options.plan_id || '';
    this.dayNo = Number(options.day_no) || 1;
    this.refresh();
  },

  refresh() {
    request
      .call('plan', { action: 'detail', plan_id: this.planId })
      .then((res) => {
        const item = res.items.find((d) => d.day_no === this.dayNo) || res.items[0] || null;
        if (!item) {
          wx.showToast({ title: '未找到该天任务', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 800);
          return;
        }
        const totalSec = item.duration_min * 60;
        this.setData({ loading: false, item: item, remainSec: totalSec, totalSec: totalSec, minutes: this.fmt(totalSec) });
        this.startTimer();
      })
      .catch(() => this.setData({ loading: false }));
  },

  /* ---- 计时器 ---- */

  startTimer() {
    if (this.timer) return;
    this.setData({ running: true });
    this.timer = setInterval(() => {
      const remain = this.data.remainSec;
      if (remain <= 1) {
        this.clearTimer();
        this.setData({ remainSec: 0, minutes: this.fmt(0), running: false });
        wx.vibrateShort({ type: 'heavy' });
        wx.showToast({ title: '时间到！点完成打卡', icon: 'none' });
        return;
      }
      this.setData({ remainSec: remain - 1, minutes: this.fmt(remain - 1) });
    }, 1000);
  },

  pauseTimer() {
    this.clearTimer();
    this.setData({ running: false });
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // 切后台自动暂停，返回保留剩余秒数（Review Focus #5）
  onHide() {
    this.pauseTimer();
  },

  onUnload() {
    this.clearTimer();
  },

  onToggleRun() {
    if (this.data.finished) return;
    if (this.data.running) this.pauseTimer();
    else this.startTimer();
  },

  fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  },

  /* ---- 完成打卡：checkin.create(plan 参数) → plan.completeDay（幂等） ---- */

  onFinish() {
    if (this.data.finishing || this.data.finished || !this.data.item) return;
    this.pauseTimer();
    this.setData({ finishing: true });

    request
      .call('checkin', {
        action: 'create',
        type_id: this.data.item.type_id,
        duration_min: this.data.item.duration_min,
        intensity: '中',
        note: '计划 Day ' + this.dayNo + '：' + this.data.item.title,
        plan_id: this.planId,
        plan_day: this.dayNo
      })
      .then((res) => {
        const badges = res.new_badges || [];
        return request
          .call('plan', { action: 'completeDay', plan_id: this.planId, day_no: this.dayNo })
          .then((r) => ({ badges: badges, complete: r }));
      })
      .then(({ badges, complete }) => {
        this.setData({ finishing: false, finished: true });
        wx.showToast({
          title: complete.finished ? '计划完成！🎉' : 'Day ' + this.dayNo + ' 完成！' + (badges.length ? '解锁 ' + badges[0].name : ''),
          icon: 'none',
          duration: 2000
        });
        setTimeout(() => wx.navigateBack(), 1600);
      })
      .catch(() => this.setData({ finishing: false }));
  },

  // 放弃：返回上一页，不产生任何记录（Review Focus #2）
  onQuit() {
    wx.showModal({
      title: '放弃本次跟练？',
      content: '不会产生打卡记录，计划进度不变。',
      confirmText: '放弃',
      success: (res) => {
        if (res.confirm) wx.navigateBack();
      }
    });
  }
});
