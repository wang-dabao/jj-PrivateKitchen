import { callFunction } from '../../utils/cloud'

const app = getApp<IAppOption>()

function normalizeDish(dish: any) {
  const images: string[] = Array.isArray(dish.images) ? dish.images
    : (Array.isArray(dish.image) ? dish.image
    : (dish.image ? [dish.image] : []))
  return { ...dish, thumbImage: images[0] || '', images }
}

async function resolveCloudUrls(dishes: any[]) {
  const fileIDs: string[] = []
  for (const d of dishes) {
    for (const f of (d.images || [])) {
      if (typeof f === 'string' && f.startsWith('cloud://')) fileIDs.push(f)
    }
  }
  if (!fileIDs.length) return dishes
  const res = await wx.cloud.getTempFileURL({ fileList: fileIDs })
  const map: Record<string, string> = {}
  for (const f of res.fileList) {
    if (f.status === 0 && f.tempFileURL) map[f.fileID] = f.tempFileURL
  }
  return dishes.map(d => ({
    ...d,
    images: (d.images || []).map((f: string) => map[f] || f),
    thumbImage: map[d.thumbImage] || d.thumbImage || '',
  }))
}

Component({
  data: {
    categories: [] as any[],
    dishes: [] as any[],
    activeCategoryId: '',
    cart: [] as CartItem[],
    cartTotal: 0,
    cartCount: 0,
    showDetail: false,
    detailDish: null as any,
    detailImgIndex: 0,
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
        const normalized = (res.dishes || []).map(normalizeDish)
        const dishes = await resolveCloudUrls(normalized)
        this.setData({
          categories: res.categories,
          dishes,
          activeCategoryId: res.categories[0]?._id || '',
        })
      } catch (e) {
        const msg = (e as any)?.errMsg || (e as any)?.message || String(e)
        wx.showToast({ title: msg, icon: 'none', duration: 5000 })
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
        cart.push({ dishId: id, name, price: Number(price), count: 1 })
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
    onTapDish(e: any) {
      const dish = this.data.dishes.find(d => d._id === e.currentTarget.dataset.id)
      if (dish) this.setData({ showDetail: true, detailDish: dish, detailImgIndex: 0 })
    },
    onSwiperChange(e: any) {
      this.setData({ detailImgIndex: e.detail.current })
    },
    onPreviewImage() {
      const dish = this.data.detailDish
      if (dish?.images?.length) {
        wx.previewImage({ urls: dish.images, current: dish.images[this.data.detailImgIndex] })
      }
    },
    onCloseDetail() { this.setData({ showDetail: false }) },
    addFromDetail() {
      const dish = this.data.detailDish
      if (!dish) return
      const cart = app.globalData.cart
      const existing = cart.find(i => i.dishId === dish._id)
      if (existing) existing.count++
      else cart.push({ dishId: dish._id, name: dish.name, price: dish.price, count: 1 })
      app.globalData.cart = cart
      this.syncCart()
      this.setData({ showDetail: false })
      wx.showToast({ title: '已加入', icon: 'success', duration: 800 })
    },
    goCart() {
      wx.navigateTo({ url: '/pages/cart/index' })
    },
  },
})
