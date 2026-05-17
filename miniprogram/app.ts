// app.ts
App<IAppOption>({
  globalData: {
    tableNo: 0,
    isMerchant: false,
    cart: [] as CartItem[],
    envId: 'cloudbase-d2gvp2x81fbf01e2b',
    openid: '',
    userProfile: null,
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true,
      })
      this.fetchOpenId()
    }
  },
  async fetchOpenId() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getOpenId' })
      const { openid, profile } = res.result as any
      this.globalData.openid = openid
      if (profile) {
        this.globalData.userProfile = { nickName: profile.nickName, avatarUrl: profile.avatarUrl }
      }
    } catch (e) {
      console.error('获取 openid 失败:', e)
    }
  },
})
