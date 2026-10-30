// 体重录入弹层：体重必填 + 体脂可选 + 日期可选（默认今天，可回选 30 天内补录）
const request = require('../../utils/request.js');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this.initDates();
          this.setData({ submitting: false });
        }
      }
    }
  },

  data: {
    weight: '',       // 用户输入的体重（字符串，提交时转数字）
    bodyFat: '',      // 体脂（可选）
    submitting: false,
    today: '',        // YYYY-MM-DD（UTC+8）
    minDate: '',      // 可回选的最早日期（30 天前，与趋势窗口一致）
    selectedDate: '', // 选中的日期
    dateLabel: '今天'
  },

  lifetimes: {
    attached() {
      this.initDates();
    }
  },

  methods: {
    // UTC+8 自然日（口径同 §9.1）；趋势窗口 30 天，补录范围与之对齐
    initDates() {
      const now = new Date(Date.now() + 8 * 3600 * 1000);
      const today = now.toISOString().slice(0, 10);
      const min = new Date(now);
      min.setUTCDate(min.getUTCDate() - 29);
      this.setData({
        today: today,
        minDate: min.toISOString().slice(0, 10),
        selectedDate: today,
        dateLabel: '今天'
      });
    },

    onWeightInput(e) {
      this.setData({ weight: e.detail.value });
    },

    onBodyFatInput(e) {
      this.setData({ bodyFat: e.detail.value });
    },

    // 原生日期选择器：限定 start ~ end 区间
    onDateChange(e) {
      const selected = e.detail.value;
      const label = selected === this.data.today ? '今天' : this.fmtLabel(selected);
      this.setData({ selectedDate: selected, dateLabel: label });
    },

    fmtLabel(date) {
      const parts = date.split('-');
      return Number(parts[1]) + '月' + Number(parts[2]) + '日';
    },

    onConfirm() {
      if (this.data.submitting) return;

      const weight = parseFloat(this.data.weight);
      if (isNaN(weight) || weight < 25 || weight > 300) {
        wx.showToast({ title: '体重需为 25-300 之间的数字', icon: 'none' });
        return;
      }
      let bodyFat;
      if (this.data.bodyFat !== '') {
        bodyFat = parseFloat(this.data.bodyFat);
        if (isNaN(bodyFat) || bodyFat < 1 || bodyFat > 70) {
          wx.showToast({ title: '体脂率需为 1-70 之间的数字', icon: 'none' });
          return;
        }
      }

      this.setData({ submitting: true });
      request
        .call('body', {
          action: 'add',
          weight_kg: weight,
          body_fat_pct: bodyFat,
          date: this.data.selectedDate
        })
        .then(() => {
          this.setData({ submitting: false, weight: '', bodyFat: '' });
          this.triggerEvent('created');
        })
        .catch(() => this.setData({ submitting: false }));
    },

    onClose() {
      this.triggerEvent('close');
    },

    noop() {}
  }
});
