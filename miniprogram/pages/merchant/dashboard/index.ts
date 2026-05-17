import { callFunction } from '../../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    isLoggedIn: false,
    password: '',
    orders: [] as any[],
    pollingTimer: 0,
  },
  lifetimes: {
    attached() {
      if (app.globalData.isMerchant) {
        this.setData({ isLoggedIn: true })
        this.loadOrders()
        this.startPolling()
      }
    },
    detached() {
      if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
    },
  },
  methods: {
    onPasswordInput(e: any) { this.setData({ password: e.detail.value }) },
    login() {
      if (this.data.password === 'admin123') {
        app.globalData.isMerchant = true
        this.setData({ isLoggedIn: true })
        this.loadOrders()
        this.startPolling()
      } else {
        wx.showToast({ title: '密码错误', icon: 'none' })
      }
    },
    async loadOrders() {
      const orders = await callFunction('orderManage', { action: 'list', data: { status: 'pending' } })
      this.setData({ orders })
    },
    startPolling() {
      const timer = setInterval(() => this.loadOrders(), 10000)
      this.setData({ pollingTimer: timer as any })
    },
    async acceptOrder(e: any) {
      await callFunction('orderManage', { action: 'updateStatus', data: { _id: e.currentTarget.dataset.id, status: 'accepted' } })
      this.loadOrders()
    },
    goOrders() { wx.navigateTo({ url: '/pages/merchant/orders/index' }) },
    goDishes() { wx.navigateTo({ url: '/pages/merchant/dishes/index' }) },
    getStatusLabel(status: string) {
      const map: Record<string, string> = { pending: '待接单', accepted: '已接单', served: '已上菜', completed: '已完成' }
      return map[status] || status
    },
  },
})
