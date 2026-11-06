// 打卡成功反馈：庆祝态 + 连续天数（create 返回的 streak_after）+ 新解锁徽章 + 海报入口
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    streak: {
      type: Number,
      value: 0
    },
    date: {
      type: String,
      value: ''
    },
    // 本次打卡新解锁的徽章（checkin.create 返回的 new_badges）
    newBadges: {
      type: Array,
      value: []
    }
  },

  methods: {
    onDone() {
      this.triggerEvent('close');
    },
    // 生成打卡海报：交给父页面打开 share-poster 组件
    onSharePoster() {
      this.triggerEvent('share');
    },
    noop() {}
  }
});
