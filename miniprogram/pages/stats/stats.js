// 数据页：摘要（真实）+ 月历点亮 + 体重趋势 + 历史记录列表（分页、可编辑删除）
const request = require('../../utils/request.js');

Page({
  data: {
    // 摘要卡
    summary: {
      totalDays: 0,
      streakDays: 0,
      monthDays: 0,
      totalHours: 0
    },

    // 月历（checkin.monthCalendar）
    month: '',           // YYYY-MM
    checkedDays: [],     // 点亮日期数组
    checkedCount: 0,
    todayStr: '',        // 高亮今天

    // 体重（body.trend）
    weightRecords: [],
    weightLatest: null,  // { date, weight_kg, body_fat_pct }
    weightDiff: null,    // 与区间最早的差值
    hasFatSeries: false, // 区间内是否有体脂数据（决定体脂线与图例）

    // 历史记录（checkin.list 分页）
    records: [],
    page: 1,
    hasMore: false,
    loadingRecords: false,

    // 弹层
    showBodyEditor: false,
    activeRecord: null   // 记录详情弹层的数据
  },

  onShow() {
    // 从其他 tab / 编辑资料返回时全量刷新
    this.refreshSummary();
    this.refreshCalendar();
    this.refreshWeight();
    this.refreshRecords(true);
  },

  refreshSummary() {
    request
      .call('stats', { action: 'summary' })
      .then((res) => {
        this.setData({
          summary: {
            totalDays: res.total_days,
            streakDays: res.current_streak,
            monthDays: res.month_days,
            totalHours: Math.round((res.total_duration_min / 60) * 10) / 10
          }
        });
      })
      .catch(() => {});
  },

  refreshCalendar() {
    const now = new Date(Date.now() + 8 * 3600 * 1000);
    const month = now.toISOString().slice(0, 7);
    const todayStr = now.toISOString().slice(0, 10);

    request
      .call('checkin', { action: 'monthCalendar' })
      .then((res) => {
        this.setData({
          month: res.month,
          checkedDays: res.days.filter((d) => d.checked).map((d) => d.date),
          checkedCount: res.checked_count,
          todayStr: todayStr
        });
      })
      .catch(() => {});
  },

  refreshWeight() {
    request
      .call('body', { action: 'trend', days: 30 })
      .then((res) => {
        const hasFatSeries = res.records.some(
          (r) => r.body_fat_pct !== null && r.body_fat_pct !== undefined
        );
        this.setData({
          weightRecords: res.records,
          weightLatest: res.latest,
          weightDiff: res.diff_kg,
          hasFatSeries: hasFatSeries
        }, () => this.drawWeightChart());
      })
      .catch(() => {});
  },

  // 历史记录：reset=true 重回第一页
  refreshRecords(reset) {
    if (this.data.loadingRecords) return;
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loadingRecords: true });

    request
      .call('checkin', { action: 'list', page: page, page_size: 20 })
      .then((res) => {
        const records = reset ? res.list : this.data.records.concat(res.list);
        this.setData({
          records: records,
          page: page,
          hasMore: res.has_more,
          loadingRecords: false
        });
      })
      .catch(() => this.setData({ loadingRecords: false }));
  },

  onReachBottom() {
    if (this.data.hasMore) this.refreshRecords(false);
  },

  // 点击记录 → 详情弹层
  onRecordTap(e) {
    const record = this.data.records.find((r) => r._id === e.currentTarget.dataset.id);
    if (record) this.setData({ activeRecord: record });
  },

  onRecordDetailClose() {
    this.setData({ activeRecord: null });
  },

  // 记录被编辑：刷新列表与摘要（连续天数不变，保守起见全刷）
  onRecordUpdated() {
    this.setData({ activeRecord: null });
    this.refreshSummary();
    this.refreshCalendar();
    this.refreshRecords(true);
  },

  // 记录被删除：同步首页/摘要的连续天数口径
  onRecordDeleted(e) {
    this.setData({ activeRecord: null });
    this.refreshSummary();
    this.refreshCalendar();
    this.refreshRecords(true);
    // 通知首页刷新（若用户切回时 onShow 也会刷，这里仅触发一次提前同步）
    this.refreshTodayBadge(e.detail.streak);
  },

  refreshTodayBadge() {
    // 预留：跨页状态同步由各页 onShow 自行刷新，无需额外处理
  },

  // 打开/关闭体重录入弹层
  onOpenBodyEditor() {
    this.setData({ showBodyEditor: true });
  },

  onBodyEditorClose() {
    this.setData({ showBodyEditor: false });
  },

  onBodyCreated() {
    this.setData({ showBodyEditor: false });
    wx.showToast({ title: '已记录', icon: 'success' });
    this.refreshWeight();
  },

  // 体重/体脂折线：Canvas 2D 轻量自绘（体重少于 2 条记录不画；体脂有值才画线）。
  // 两条线各自 min-max 归一化——体重与体脂数量级差异大，同轴会压扁一条线
  drawWeightChart() {
    const records = this.data.weightRecords;
    if (records.length < 2) return;

    const weights = records.map((r) => r.weight_kg);
    // 体脂子集：记录其在原数组中的位置作为 x，保证日期对齐
    const fatPoints = [];
    records.forEach((r, i) => {
      if (r.body_fat_pct !== null && r.body_fat_pct !== undefined) {
        fatPoints.push({ x: i, v: r.body_fat_pct });
      }
    });

    wx.createSelectorQuery()
      .in(this)
      .select('#weightChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio || 2;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const W = res[0].width;
        const H = res[0].height;
        const padL = 10, padR = 10, padT = 14, padB = 20;
        const lastIdx = weights.length - 1;
        const px = (i, total) => padL + (i * (W - padL - padR)) / (total - 1);

        // 一条序列：各点 {x, v}，v 在该序列内归一化
        const drawSeries = (points, color) => {
          if (points.length < 2) return;
          const values = points.map((p) => p.v);
          const min = Math.min.apply(null, values);
          const max = Math.max.apply(null, values);
          const range = max - min || 1;
          const py = (v) => padT + (1 - (v - min) / range) * (H - padT - padB);

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          points.forEach((p, i) => {
            const x = px(p.x, lastIdx + 1);
            if (i === 0) ctx.moveTo(x, py(p.v));
            else ctx.lineTo(x, py(p.v));
          });
          ctx.stroke();

          // 末端点 + 数值标签
          const last = points[points.length - 1];
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px(last.x, lastIdx + 1), py(last.v), 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(last.v + (color === '#00B578' ? '%' : 'kg'), px(last.x, lastIdx + 1), py(last.v) - 6);
        };

        ctx.clearRect(0, 0, W, H);
        drawSeries(
          records.map((r, i) => ({ x: i, v: r.weight_kg })),
          '#FF5C38'
        );
        drawSeries(fatPoints, '#00B578');
      });
  }
});
