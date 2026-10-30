// 当月日历点亮组件（蓝图：P0 当月只读点亮，不可切月、不可补签）
Component({
  properties: {
    // "YYYY-MM"
    month: {
      type: String,
      value: ''
    },
    // 已点亮日期集合（"YYYY-MM-DD" 数组，内部转 Set）
    checked: {
      type: Array,
      value: [],
      observer() {
        this.rebuild();
      }
    },
    // 高亮"今天"
    today: {
      type: String,
      value: ''
    }
  },

  data: {
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    cells: [], // [{ day: 1, date: 'YYYY-MM-DD', checked: bool, isToday: bool }]，前置 null 占位
    checkedCount: 0
  },

  lifetimes: {
    attached() {
      this.rebuild();
    }
  },

  observers: {
    month() {
      this.rebuild();
    }
  },

  methods: {
    rebuild() {
      const month = this.data.month;
      if (!/^\d{4}-\d{2}$/.test(month)) return;

      const year = Number(month.slice(0, 4));
      const monthNum = Number(month.slice(5, 7));
      const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
      const checkedSet = new Set(this.data.checked);

      // 1 号是周几（周一起始的偏移）
      const firstWeekday = new Date(Date.UTC(year, monthNum - 1, 1)).getUTCDay();
      const leading = (firstWeekday + 6) % 7;

      const cells = [];
      for (let i = 0; i < leading; i++) {
        cells.push(null);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const date = month + '-' + String(d).padStart(2, '0');
        cells.push({
          day: d,
          date: date,
          checked: checkedSet.has(date),
          isToday: date === this.data.today
        });
      }

      this.setData({ cells: cells, checkedCount: checkedSet.size });
    }
  }
});
