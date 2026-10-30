// 我的页：真实资料（globalData 优先，兜底 user.get）；菜单入口见 wxml
const request = require('../../utils/request.js');

const app = getApp();

Page({
  data: {
    nickname: '',
    goal: '减脂',
    avatarText: '练' // 头像占位：昵称首字
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    if (app.globalData.profile) {
      this.applyProfile(app.globalData.profile);
      return;
    }
    request
      .call('user', { action: 'get' })
      .then((res) => {
        app.globalData.profile = res.profile;
        this.applyProfile(res.profile);
      })
      .catch(() => {
        // 未登录/网络异常：保留默认占位，下次 onShow 重试
      });
  },

  applyProfile(profile) {
    const nickname = profile.nickname || '健身er';
    this.setData({
      nickname: nickname,
      goal: profile.goal || '减脂',
      avatarText: nickname.slice(0, 1)
    });
  },

  // 编辑资料 → 独立页面（保存后返回，onShow 自动刷新）
  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  // 体重记录 → 切到数据 tab（录入与曲线都在那里）
  onBodyRecord() {
    wx.switchTab({ url: '/pages/stats/stats' });
  },

  onAbout() {
    wx.showModal({
      title: '今天练了吗',
      content: '大众健身打卡小程序：打卡、记录、坚持。\n当前版本：P0',
      showCancel: false
    });
  }
});
