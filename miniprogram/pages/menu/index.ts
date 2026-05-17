import { callFunction } from '../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    categories: [] as any[],
    dishes: [] as any[],
    activeCategoryId: '',
    cart: [] as CartItem[],
    cartTotal: 0,
    cartCount: 0,
  },
  lifetimes: {
    attached() {
      this.loadMenu()
      this.syncCart()
    },
  },
  pageLifetimes: {
    show() {
      this.syncCart()
    },
  },
  methods: {
    async loadMenu() {
      wx.showLoading({ title: '加载中' })
      try {
        const res = await callFunction('getMenu')
        this.setData({
          categories: res.categories,
          dishes: res.dishes,
          activeCategoryId: res.categories[0]?._id || '',
        })
      } catch (e) {
        wx.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    },
    switchCategory(e: any) {
      this.setData({ activeCategoryId: e.currentTarget.dataset.id })
    },
    addToCart(e: any) {
      const { id, name, price } = e.currentTarget.dataset
      const cart = app.globalData.cart
      const existing = cart.find(i => i.dishId === id)
      if (existing) {
        existing.count++
      } else {
        cart.push({ dishId: id, name, price, count: 1 })
      }
      app.globalData.cart = cart
      this.syncCart()
      wx.showToast({ title: '已加入', icon: 'success', duration: 800 })
    },
    syncCart() {
      const cart = app.globalData.cart
      const cartCount = cart.reduce((s, i) => s + i.count, 0)
      const cartTotal = cart.reduce((s, i) => s + i.price * i.count, 0)
      this.setData({ cart, cartCount, cartTotal })
    },
    goCart() {
      wx.navigateTo({ url: '/pages/cart/index' })
    },
  },
})
