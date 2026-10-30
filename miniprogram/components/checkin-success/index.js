// 打卡成功反馈：庆祝态 + 连续天数（用 create 返回的 streak_after，不本地重算）
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
    }
  },

  methods: {
    onDone() {
      this.triggerEvent('close');
    },
    noop() {}
  }
});
