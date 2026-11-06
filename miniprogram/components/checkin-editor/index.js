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

  lifetimes: {
    // 上次「分享到广场」的选择记忆在本地（默认开启）
    attached() {
      const saved = wx.getStorageSync('share_to_square');
      this.setData({ shareToSquare: saved === '' ? true : !!saved });
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
    note: '',
    photoPath: '',       // 本地临时照片路径（确认打卡时上传云存储）
    shareToSquare: true  // 同时发布到打卡广场（隐私最小化：仅昵称/类型/时长）
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

    // 选照片/拍照：单张、压缩（P0 仅支持单张 photo_file_id）
    choosePhoto() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => {
          this.setData({ photoPath: res.tempFiles[0].tempFilePath });
        }
      });
    },

    clearPhoto() {
      this.setData({ photoPath: '' });
    },

    // 广场分享开关：选择记忆到本地
    onSquareChange(e) {
      const on = !!e.detail.value;
      this.setData({ shareToSquare: on });
      wx.setStorageSync('share_to_square', on);
    },

    // 上传照片到云存储，返回 fileID；无照片或上传失败返回 ''（照片可选，失败不阻塞打卡）
    uploadPhotoIfNeeded() {
      const path = this.data.photoPath;
      if (!path) return Promise.resolve('');

      const dot = path.lastIndexOf('.');
      const ext = dot > -1 ? path.slice(dot) : '.jpg';
      const cloudPath = 'checkins/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + ext;

      return wx.cloud
        .uploadFile({ cloudPath: cloudPath, filePath: path })
        .then((res) => res.fileID)
        .catch(() => {
          wx.showToast({ title: '照片上传失败，已跳过', icon: 'none' });
          return '';
        });
    },

    onConfirm() {
      if (this.data.submitting) return;
      if (!this.data.selectedTypeId) {
        wx.showToast({ title: '请选择训练类型', icon: 'none' });
        return;
      }
      this.setData({ submitting: true });
      this.uploadPhotoIfNeeded()
        .then((fileID) => {
          return request.call('checkin', {
            action: 'create',
            type_id: this.data.selectedTypeId,
            duration_min: this.data.duration,
            intensity: this.data.selectedIntensity,
            note: this.data.note,
            photo_file_id: fileID,
            share_to_square: this.data.shareToSquare
          });
        })
        .then((res) => {
          this.setData({ submitting: false, photoPath: '' });
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
