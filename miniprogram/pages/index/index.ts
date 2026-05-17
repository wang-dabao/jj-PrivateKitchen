import shop from '../../config/shop'

const app = getApp<IAppOption>()

Component({
  data: {
    shop,
    currentOrderId: '',
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = (currentPage as any).options || {}
      const tableNo = parseInt(options.tableNo) || 0
      if (tableNo > 0) {
        app.globalData.tableNo = tableNo
        wx.redirectTo({ url: '/pages/menu/index' })
        return
      }
      const orderId = wx.getStorageSync('currentOrderId')
      if (orderId) this.setData({ currentOrderId: orderId })
    },
  },
  methods: {
    goMenu() {
      app.globalData.tableNo = 1
      wx.navigateTo({ url: '/pages/menu/index' })
    },
    onHeroTap() {
      const count = (this as any)._heroTapCount || 0
      if (count >= 4) {
        (this as any)._heroTapCount = 0
        wx.navigateTo({ url: '/pages/merchant/dashboard/index' })
      } else {
        (this as any)._heroTapCount = count + 1
      }
    },
    goMyOrder() {
      wx.navigateTo({ url: `/pages/order/index?orderId=${this.data.currentOrderId}` })
    },
  },
})
