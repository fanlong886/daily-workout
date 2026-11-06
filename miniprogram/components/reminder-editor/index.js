// 每日提醒设置弹层：开关（含订阅授权）+ 时间（HH:mm）→ user.update
const request = require('../../utils/request.js');
const config = require('../../config.js');

const app = getApp();

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) this.init();
      }
    }
  },

  data: {
    enabled: false,
    time: '20:00',
    saving: false
  },

  methods: {
    // 每次打开从全局资料回显当前设置
    init() {
      const profile = app.globalData.profile;
      if (profile) {
        this.setData({
          enabled: !!profile.reminderEnabled,
          time: profile.reminderTime || '20:00'
        });
      }
    },

    // 开关：开启时先请求一次性订阅授权（用户勾选"总是保持"后不再弹窗）
    onSwitchChange(e) {
      const on = e.detail.value;
      if (this.data.saving) {
        this.setData({ enabled: this.data.enabled });
        return;
      }

      if (!on) {
        this.saveReminder(false, this.data.time);
        return;
      }

      wx.requestSubscribeMessage({
        tmplIds: [config.REMINDER_TEMPLATE_ID],
        success: (res) => {
          if (res[config.REMINDER_TEMPLATE_ID] === 'accept') {
            this.saveReminder(true, this.data.time);
          } else {
            // 用户拒绝订阅：开了开关也收不到推送，直接回退并提示
            wx.showToast({ title: '未授权订阅，无法送达提醒', icon: 'none' });
            this.setData({ enabled: false });
          }
        },
        fail: () => {
          wx.showToast({ title: '订阅请求失败，请重试', icon: 'none' });
          this.setData({ enabled: false });
        }
      });
    },

    // 时间调整：已开启状态下改时间立即生效
    onTimeChange(e) {
      const time = e.detail.value;
      this.setData({ time: time });
      if (this.data.enabled) {
        this.saveReminder(true, time);
      }
    },

    saveReminder(enabled, time) {
      if (this.data.saving) return;
      this.setData({ saving: true });

      request
        .call('user', {
          action: 'update',
          reminder_enabled: enabled,
          reminder_time: time
        })
        .then((res) => {
          app.globalData.profile = res.profile;
          this.setData({ saving: false, enabled: enabled, time: time });
          wx.showToast({ title: enabled ? '提醒已开启' : '提醒已关闭', icon: 'success' });
          this.triggerEvent('changed');
        })
        .catch(() => {
          // 失败回滚开关显示
          const profile = app.globalData.profile;
          this.setData({
            saving: false,
            enabled: !!(profile && profile.reminderEnabled)
          });
        });
    },

    onClose() {
      this.triggerEvent('close');
    },

    noop() {}
  }
});
