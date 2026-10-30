// 打卡编辑弹层：类型（读字典）+ 时长（步进，默认 20）+ 强度 + 备注 → checkin.create
const request = require('../../utils/request.js');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) this.onShow();
      }
    }
  },

  data: {
    loading: false,
    submitting: false,
    types: [],           // 训练类型字典（checkin.types）
    selectedTypeId: '',  // 当前选中类型
    duration: 20,        // 时长（分钟），默认 20
    intensities: ['低', '中', '高'],
    selectedIntensity: '中',
    note: ''
  },

  methods: {
    // 每次打开拉取字典（组件内简单缓存，24h 内不重复请求）
    onShow() {
      const app = getApp();
      const cached = app.globalData.trainingTypes;
      if (cached && Date.now() - cached.fetchedAt < 24 * 3600 * 1000) {
        this.applyTypes(cached.list);
        return;
      }
      this.setData({ loading: true });
      request
        .call('checkin', { action: 'types' })
        .then((res) => {
          app.globalData.trainingTypes = { list: res.types, fetchedAt: Date.now() };
          this.applyTypes(res.types);
        })
        .catch(() => this.setData({ loading: false }));
    },

    applyTypes(types) {
      const selectedTypeId =
        this.data.selectedTypeId && types.some((t) => t._id === this.data.selectedTypeId)
          ? this.data.selectedTypeId
          : types.length > 0
            ? types[0]._id // 默认选中第一项（自选训练，兜底项）
            : '';
      // 切换类型时同步其默认时长
      const selected = types.find((t) => t._id === selectedTypeId);
      this.setData({
        loading: false,
        types: types,
        selectedTypeId: selectedTypeId,
        duration: selected ? selected.default_duration_min : 20
      });
    },

    onSelectType(e) {
      const typeId = e.currentTarget.dataset.id;
      const selected = this.data.types.find((t) => t._id === typeId);
      this.setData({
        selectedTypeId: typeId,
        duration: selected ? selected.default_duration_min : this.data.duration
      });
    },

    onDurationMinus() {
      if (this.data.duration > 5) this.setData({ duration: this.data.duration - 5 });
    },

    onDurationPlus() {
      if (this.data.duration < 600) this.setData({ duration: this.data.duration + 5 });
    },

    onSelectIntensity(e) {
      this.setData({ selectedIntensity: e.currentTarget.dataset.value });
    },

    onNoteInput(e) {
      this.setData({ note: e.detail.value });
    },

    onConfirm() {
      if (this.data.submitting) return;
      if (!this.data.selectedTypeId) {
        wx.showToast({ title: '请选择训练类型', icon: 'none' });
        return;
      }
      this.setData({ submitting: true });
      request
        .call('checkin', {
          action: 'create',
          type_id: this.data.selectedTypeId,
          duration_min: this.data.duration,
          intensity: this.data.selectedIntensity,
          note: this.data.note
        })
        .then((res) => {
          this.setData({ submitting: false });
          this.triggerEvent('created', {
            streak: res.streak_after,
            date: res.date,
            isFirst: res.is_today_first
          });
        })
        .catch(() => this.setData({ submitting: false }));
    },

    onClose() {
      this.triggerEvent('close');
    },

    noop() {} // 拦截弹层内点击冒泡，防止误关
  }
});
