// 徽章墙：5 枚连续打卡里程碑，已解锁亮色 + 解锁日期，未解锁灰色 + 进度
const request = require('../../utils/request.js');

Page({
  data: {
    loading: true,
    badges: [],      // [{code,name,icon,desc,threshold,unlocked,unlocked_at,progress}]
    longestStreak: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ loading: true });
    request
      .call('achievements', { action: 'list' })
      .then((res) => {
        const badges = res.badges.map((b) => {
          // 解锁日期展示：M月D日
          let unlockedLabel = '';
          if (b.unlocked && b.unlocked_at) {
            const d = new Date(b.unlocked_at);
            unlockedLabel = (d.getMonth() + 1) + '月' + d.getDate() + '日解锁';
          }
          return Object.assign({}, b, {
            unlockedLabel: unlockedLabel,
            percent: Math.floor((b.progress / b.threshold) * 100)
          });
        });
        this.setData({ loading: false, badges: badges, longestStreak: res.longest_streak });
      })
      .catch(() => this.setData({ loading: false }));
  }
});
