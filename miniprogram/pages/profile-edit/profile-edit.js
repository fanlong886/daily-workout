// 编辑资料页：昵称 / 性别 / 身高 / 目标 → user.update（蓝图 §9.2）
const request = require('../../utils/request.js');

const app = getApp();

Page({
  data: {
    loading: true,
    saving: false,
    nickname: '',
    gender: 'unknown',
    genders: [
      { value: 'unknown', label: '保密' },
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ],
    height: '', // 字符串，提交时转数字；空 = 不修改
    goals: ['减脂', '塑形', '保持'],
    goal: '减脂'
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    // globalData 有缓存直接用，否则拉取
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
      .catch(() => this.setData({ loading: false }));
  },

  applyProfile(profile) {
    this.setData({
      loading: false,
      nickname: profile.nickname || '',
      gender: profile.gender || 'unknown',
      height: profile.heightCm ? String(profile.heightCm) : '',
      goal: profile.goal || '减脂'
    });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onSelectGender(e) {
    this.setData({ gender: e.currentTarget.dataset.value });
  },

  onHeightInput(e) {
    this.setData({ height: e.detail.value });
  },

  onSelectGoal(e) {
    this.setData({ goal: e.currentTarget.dataset.value });
  },

  // 保存：按 user.update 白名单逐项校验，空字段不提交
  onSave() {
    if (this.data.saving) return;

    const nickname = this.data.nickname.trim();
    if (nickname.length < 1 || nickname.length > 20) {
      wx.showToast({ title: '昵称需为 1-20 个字符', icon: 'none' });
      return;
    }
    let height;
    if (this.data.height !== '') {
      height = Number(this.data.height);
      if (isNaN(height) || height < 80 || height > 250) {
        wx.showToast({ title: '身高需为 80-250 的数字', icon: 'none' });
        return;
      }
    }

    const payload = { action: 'update', nickname: nickname, gender: this.data.gender, goal: this.data.goal };
    if (height !== undefined) payload.height_cm = height;

    this.setData({ saving: true });
    request
      .call('user', payload)
      .then((res) => {
        app.globalData.profile = res.profile; // 同步全局缓存
        this.setData({ saving: false });
        wx.showToast({ title: '已保存', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 600);
      })
      .catch(() => this.setData({ saving: false }));
  }
});
