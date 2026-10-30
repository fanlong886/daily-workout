// 记录详情弹层：查看 → 编辑（时长/强度/备注）→ checkin.update；删除 → checkin.delete
const request = require('../../utils/request.js');

Component({
  properties: {
    // 打卡记录对象（checkin.list 的项）
    record: {
      type: Object,
      value: null
    },
    visible: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) this.reset();
      }
    }
  },

  data: {
    editing: false,
    dateLabel: '', // 标题日期（M月D日）
    duration: 20,
    intensities: ['低', '中', '高'],
    intensity: '中',
    note: '',
    hasPhoto: false, // 该记录是否带照片
    submitting: false,
    deleting: false
  },

  methods: {
    // 每次打开回到查看态并按记录预填
    reset() {
      const r = this.data.record;
      if (r) {
        const parts = (r.date || '').split('-');
        const dateLabel = parts.length === 3 ? `${Number(parts[1])}月${Number(parts[2])}日` : r.date;
        this.setData({
          editing: false,
          dateLabel: dateLabel,
          duration: r.duration_min,
          intensity: r.intensity,
          note: r.note || '',
          hasPhoto: !!r.photo_file_id,
          submitting: false,
          deleting: false
        });
      }
    },

    // 查看态行
    onPreviewPhoto() {
      if (this.data.record && this.data.record.photo_file_id) {
        wx.previewImage({ urls: [this.data.record.photo_file_id] });
      }
    },

    // 进入编辑态
    onEdit() {
      this.setData({ editing: true });
    },

    onDurationMinus() {
      if (this.data.duration > 5) this.setData({ duration: this.data.duration - 5 });
    },

    onDurationPlus() {
      if (this.data.duration < 600) this.setData({ duration: this.data.duration + 5 });
    },

    onSelectIntensity(e) {
      this.setData({ intensity: e.currentTarget.dataset.value });
    },

    onNoteInput(e) {
      this.setData({ note: e.detail.value });
    },

    // 保存修改：checkin.update（只改时长/强度/备注，类型与日期不可变）
    onSave() {
      if (this.data.submitting) return;
      this.setData({ submitting: true });
      request
        .call('checkin', {
          action: 'update',
          checkin_id: this.data.record._id,
          duration_min: this.data.duration,
          intensity: this.data.intensity,
          note: this.data.note
        })
        .then(() => {
          this.setData({ submitting: false, editing: false });
          wx.showToast({ title: '已保存', icon: 'success' });
          this.triggerEvent('updated');
        })
        .catch(() => this.setData({ submitting: false }));
    },

    onCancelEdit() {
      this.reset();
    },

    // 删除：二次确认 → checkin.delete → 通知父级刷新（带回重算后的连续天数）
    onDelete() {
      if (this.data.deleting) return;
      wx.showModal({
        title: '删除这条打卡？',
        content: '删除后当天连续天数会重新计算，不可恢复。',
        confirmText: '删除',
        confirmColor: '#FA5151',
        success: (res) => {
          if (!res.confirm) return;
          this.setData({ deleting: true });
          request
            .call('checkin', { action: 'delete', checkin_id: this.data.record._id })
            .then((res) => {
              this.triggerEvent('deleted', { streak: res.current_streak });
            })
            .catch(() => this.setData({ deleting: false }));
        }
      });
    },

    onClose() {
      this.triggerEvent('close');
    },

    noop() {}
  }
});
