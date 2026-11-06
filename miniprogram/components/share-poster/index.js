// 打卡分享海报：Canvas 2D 绘制竖版海报 → 保存相册 / 分享好友
// 小程序码需上线后才能生成（wxacode 接口限制），当前版本底部为文案引导位
const request = require('../../utils/request.js');

const app = getApp();

// 海报绘制尺寸（px）：内部 2 倍图保证清晰度
const POSTER_W = 600;
const POSTER_H = 960;

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) this.generate();
      }
    }
  },

  data: {
    generating: false,
    posterPath: '' // 绘制完成后生成的本地临时图片路径
  },

  methods: {
    generate() {
      this.setData({ generating: true, posterPath: '' });

      // 海报数据：摘要 + 昵称
      request
        .call('stats', { action: 'summary' })
        .then((summary) => {
          const profile = app.globalData.profile || {};
          return this.draw({
            nickname: profile.nickname || '健身er',
            streak: summary.current_streak,
            totalDays: summary.total_days,
            monthDays: summary.month_days
          });
        })
        .then((posterPath) => this.setData({ generating: false, posterPath: posterPath }))
        .catch((err) => {
          console.error('[share-poster] 生成失败:', err);
          this.setData({ generating: false });
          wx.showToast({ title: '海报生成失败，稍后再试', icon: 'none' });
          this.close();
        });
    },

    // Canvas 2D 绘制海报并导出临时文件
    draw(data) {
      return new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .in(this)
          .select('#posterCanvas')
          .fields({ node: true })
          .exec((res) => {
            if (!res || !res[0]) {
              reject(new Error('canvas 节点未就绪'));
              return;
            }
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            canvas.width = POSTER_W;
            canvas.height = POSTER_H;

            /* -- 顶部橙色区 -- */
            const grad = ctx.createLinearGradient(0, 0, 0, 360);
            grad.addColorStop(0, '#FF5C38');
            grad.addColorStop(1, '#E6461F');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, POSTER_W, 360);

            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.font = 'bold 34px sans-serif';
            ctx.fillText('今天练了吗', 40, 64);
            ctx.font = '20px sans-serif';
            ctx.globalAlpha = 0.85;
            ctx.fillText('打开就能练 · 3 步就打卡', 40, 96);
            ctx.globalAlpha = 1;

            // 连续天数大字（居中）
            ctx.textAlign = 'center';
            ctx.font = 'bold 96px sans-serif';
            ctx.fillText(String(data.streak), POSTER_W / 2, 218);
            ctx.font = '24px sans-serif';
            ctx.fillText('连续打卡（天）', POSTER_W / 2, 258);

            /* -- 白色信息区 -- */
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 360, POSTER_W, POSTER_H - 360);

            // 昵称 + 日期
            const now = new Date(Date.now() + 8 * 3600 * 1000);
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '.');
            ctx.fillStyle = '#242833';
            ctx.textAlign = 'left';
            ctx.font = 'bold 28px sans-serif';
            ctx.fillText(data.nickname, 40, 430);
            ctx.font = '20px sans-serif';
            ctx.fillStyle = '#A6ACBD';
            ctx.textAlign = 'right';
            ctx.fillText(dateStr, POSTER_W - 40, 430);

            // 三列数据
            const cols = [
              { label: '累计打卡', value: data.totalDays + ' 天' },
              { label: '本月打卡', value: data.monthDays + ' 天' },
              { label: '坚持就是胜利', value: '💪' }
            ];
            cols.forEach((col, i) => {
              const cx = 40 + 160 * i + 60;
              ctx.textAlign = 'left';
              ctx.fillStyle = '#242833';
              ctx.font = 'bold 30px sans-serif';
              ctx.fillText(col.value, cx - 60 + 10, 510);
              ctx.fillStyle = '#A6ACBD';
              ctx.font = '20px sans-serif';
              ctx.fillText(col.label, cx - 60 + 10, 542);
            });

            // 分隔线
            ctx.fillStyle = '#EDEFF4';
            ctx.fillRect(40, 580, POSTER_W - 80, 2);

            // 底部引导文案（小程序码位：上线后替换为真实码图）
            ctx.fillStyle = '#7A8090';
            ctx.textAlign = 'center';
            ctx.font = '24px sans-serif';
            ctx.fillText('让「坚持」变成看得见的连续天数', POSTER_W / 2, 700);
            ctx.font = '20px sans-serif';
            ctx.fillStyle = '#A6ACBD';
            ctx.fillText('微信搜索「今天练了吗pro」和我一起练', POSTER_W / 2, 740);

            // 底部橙色条
            ctx.fillStyle = '#FFF0EB';
            ctx.fillRect(0, POSTER_H - 120, POSTER_W, 120);
            ctx.fillStyle = '#FF5C38';
            ctx.font = 'bold 26px sans-serif';
            ctx.fillText('今天，你练了吗？', POSTER_W / 2, POSTER_H - 55);

            // 导出临时图片
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (res) => resolve(res.tempFilePath),
              fail: reject
            });
          });
      });
    },

    // 保存到相册（含授权拒绝引导）
    onSave() {
      if (!this.data.posterPath) return;
      wx.saveImageToPhotosAlbum({
        filePath: this.data.posterPath,
        success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: (err) => {
          if (err.errMsg && err.errMsg.indexOf('auth den') > -1) {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中开启「保存到相册」权限后重试',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) wx.openSetting();
              }
            });
          }
        }
      });
    },

    // 唤起微信分享面板（发给好友/朋友圈）
    onShareMenu() {
      if (!this.data.posterPath) return;
      wx.showShareImageMenu({
        path: this.data.posterPath,
        fail: () => {} // 用户取消不提示
      });
    },

    close() {
      this.triggerEvent('close');
    },

    noop() {}
  }
});
