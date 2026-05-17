import { callFunction } from '../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    cart: [] as CartItem[],
    totalPrice: 0,
    remark: '',
    tableNo: app.globalData.tableNo,
  },
  lifetimes: {
    attached() {
      this.syncCart()
    },
  },
  methods: {
    syncCart() {
      const cart = app.globalData.cart
      const totalPrice = cart.reduce((s, i) => s + i.price * i.count, 0)
      this.setData({ cart, totalPrice })
    },
    increase(e: any) {
      const item = app.globalData.cart.find(i => i.dishId === e.currentTarget.dataset.id)
      if (item) item.count++
      this.syncCart()
    },
    decrease(e: any) {
      const item = app.globalData.cart.find(i => i.dishId === e.currentTarget.dataset.id)
      if (item) {
        item.count--
        if (item.count <= 0) {
          app.globalData.cart = app.globalData.cart.filter(i => i.dishId !== item.dishId)
        }
      }
      this.syncCart()
    },
    async submitOrder() {
      const { cart, totalPrice } = this.data
      if (!cart.length) return wx.showToast({ title: '购物车为空', icon: 'none' })
      if (!app.globalData.tableNo) return wx.showToast({ title: '请先选择桌号', icon: 'none' })
      wx.showLoading({ title: '提交中' })
      try {
        const profile = app.globalData.userProfile
        const res = await callFunction('submitOrder', {
          tableNo: app.globalData.tableNo,
          items: (cart as CartItem[]).map(i => ({
            dishId: i.dishId,
            name: i.name,
            price: i.price,
            count: i.count,
          })),
          remark: this.data.remark,
          userId: app.globalData.openid,
          userName: profile?.nickName || '',
          userAvatar: profile?.avatarUrl || '',
        })
        app.globalData.cart = []
        wx.setStorageSync('currentOrderId', res.orderId)
        wx.redirectTo({ url: `/pages/order/index?orderId=${res.orderId}` })
      } catch (e) {
        wx.showToast({ title: '提交失败', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    },
    onRemarkInput(e: any) {
      this.setData({ remark: e.detail.value })
    },
  },
})
