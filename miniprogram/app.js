// 应用入口：云开发初始化 + 静默登录；业务逻辑不写在这里
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前微信基础库版本过低，无法使用云开发能力，请升级基础库');
      return;
    }
    wx.cloud.init({
      // 不传 env = 使用本 AppID 的「默认环境」（当前账号仅一个免费体验版环境 cloud1）。
      // 注意：env ID 需与控制台完全一致，抄写易错；未来新增多环境时再在此显式指定
      traceUser: true
    });

    // 静默登录/建档（蓝图 §9.2 user.login）：失败不阻塞启动，页面内兜底重试
    const request = require('./utils/request.js');
    request
      .call('login')
      .then((res) => {
        this.globalData.profile = res.profile;
        this.globalData.isNewUser = res.is_new_user;
      })
      .catch(() => {
        // 统一错误提示已在 request.js 中处理
      });
  },

  globalData: {
    profile: null,       // 登录后的用户资料（UserProfile，驼峰命名）
    isNewUser: false,    // 是否首次建档（后续引导用）
    trainingTypes: null  // 训练类型字典缓存 { list, fetchedAt }（打卡弹层使用）
  }
});
