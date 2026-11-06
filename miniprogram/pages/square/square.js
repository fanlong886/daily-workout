// 打卡广场：公开 feed（只读 + 点赞），下拉刷新 + 触底分页
const request = require('../../utils/request.js');

Page({
  data: {
    loading: true,
    list: [],
    page: 1,
    hasMore: false,
    loadingMore: false
  },

  onShow() {
    this.refresh();
  },

  // 下拉刷新（json 已开启 enablePullDownRefresh）
  onPullDownRefresh() {
    this.refresh(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) this.loadMore();
  },

  refresh(done) {
    request
      .call('square', { action: 'list', page: 1, page_size: 10 })
      .then((res) => {
        this.setData({
          loading: false,
          list: res.list,
          page: 1,
          hasMore: res.has_more
        });
      })
      .catch(() => this.setData({ loading: false }))
      .finally(() => {
        if (done) done();
      });
  },

  loadMore() {
    this.setData({ loadingMore: true });
    request
      .call('square', { action: 'list', page: this.data.page + 1, page_size: 10 })
      .then((res) => {
        this.setData({
          list: this.data.list.concat(res.list),
          page: this.data.page + 1,
          hasMore: res.has_more,
          loadingMore: false
        });
      })
      .catch(() => this.setData({ loadingMore: false }));
  },

  // 点赞/取消赞：用云端返回值更新该项
  onLikeTap(e) {
    const postId = e.currentTarget.dataset.id;
    request
      .call('square', { action: 'like', post_id: postId })
      .then((res) => {
        const list = this.data.list.map((item) => {
          if (item._id !== postId) return item;
          return Object.assign({}, item, { like_count: res.like_count, liked: res.liked });
        });
        this.setData({ list: list });
      })
      .catch(() => {});
  }
});
