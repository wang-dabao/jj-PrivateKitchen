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
      if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
    },
  },
  methods: {
    async fetchOrder() {
      try {
        const order = await callFunction('getOrder', { orderId: this.data.orderId })
        this.setData({
          order,
          statusText: STATUS_MAP[order.status] || order.status,
        })
        if (order.status === 'completed') {
          if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
        }
      } catch (e) { /* ignore poll errors */ }
    },
    startPolling() {
      const timer = setInterval(() => this.fetchOrder(), 5000)
      this.setData({ pollingTimer: timer as any })
    },
  },
})
