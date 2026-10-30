/**
 * 前端数据访问唯一出口。
 * 所有云函数调用必须经此封装：统一解析 { code, message, data } 结构
 * （口径见《MVP产品蓝图》§9.1），code !== 0 时统一 toast 报错并 reject。
 * 禁止在页面 / 组件中直接调用 wx.cloud.callFunction 或操作云数据库。
 */

/**
 * 调用云函数
 * @param {string} name 云函数名，如 'login'（后续批次：checkin / stats / body / user）
 * @param {Object} data 入参（不含身份信息，openid 由云函数从上下文获取）
 * @returns {Promise<any>} 成功时 resolve 业务数据 data；失败时 reject { code, message, data: null }
 */
function call(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data || {}
    })
      .then(function (res) {
        var result = res.result;
        if (result && result.code === 0) {
          resolve(result.data);
          return;
        }
        var message = (result && result.message) || '服务开小差了，稍后再试';
        wx.showToast({ title: message, icon: 'none' });
        reject(result || { code: 5000, message: message, data: null });
      })
      .catch(function (err) {
        console.error('[request] 云函数调用失败:', name, err);
        wx.showToast({ title: '网络开小差了，稍后再试', icon: 'none' });
        reject({ code: 5000, message: '网络异常', data: null });
      });
  });
}

module.exports = {
  call: call
};
