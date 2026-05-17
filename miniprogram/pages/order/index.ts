import { callFunction } from '../../utils/cloud'

const STATUS_MAP: Record<string, string> = {
  pending: '待接单',
  accepted: '已接单',
  served: '已上菜',
  completed: '已完成',
}

Component({
  data: {
    orderId: '',
    order: null as any,
    statusText: '',
    computedTotal: 0,
    pollingTimer: 0,
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const options = (pages[pages.length - 1] as any).options || {}
      this.setData({ orderId: options.orderId || '' })
      this.fetchOrder()
      this.startPolling()
    },
    detached() {
      this.stopPolling()
    },
  },
  pageLifetimes: {
    show() {
      if (this.data.orderId) {
        this.fetchOrder()
        this.startPolling()
      }
    },
    hide() {
      this.stopPolling()
    },
  },
  methods: {
    async fetchOrder() {
      if (!this.data.orderId) return
      try {
        const order = await callFunction('getOrder', { orderId: this.data.orderId })
        const computedTotal = (order.items || []).reduce((s: number, i: any) => s + i.price * i.count, 0)
        this.setData({
          order,
          statusText: STATUS_MAP[order.status] || order.status,
          computedTotal,
        })
        if (order.status === 'completed') {
          wx.removeStorageSync('currentOrderId')
          this.stopPolling()
        }
      } catch (e) {
        console.error('获取订单失败:', e)
      }
    },
    goHome() {
      wx.redirectTo({ url: '/pages/index/index' })
    },
    startPolling() {
      this.stopPolling()
      const timer = setInterval(() => this.fetchOrder(), 5000)
      this.setData({ pollingTimer: timer as any })
    },
    stopPolling() {
      if (this.data.pollingTimer) {
        clearInterval(this.data.pollingTimer)
        this.setData({ pollingTimer: 0 })
      }
    },
  },
})
