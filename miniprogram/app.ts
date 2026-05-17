// app.ts
App<IAppOption>({
  globalData: {
    tableNo: 0,
    isMerchant: false,
    cart: [] as CartItem[],
    envId: 'cloudbase-d2gvp2x81fbf01e2b',
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true,
      })
    }
  },
})

