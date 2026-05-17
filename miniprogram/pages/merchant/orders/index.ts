import { callFunction } from '../../../utils/cloud'

const STATUS_TABS = [
  { key: 'pending', label: '待接单' },
  { key: 'accepted', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: '待接单', accepted: '已接单', served: '已上菜', completed: '已完成',
}

Component({
  data: {
    tabs: STATUS_TABS,
    activeTab: 'pending',
    orders: [] as any[],
  },
  lifetimes: {
    attached() { this.loadOrders() },
  },
  methods: {
    async loadOrders() {
      const { activeTab } = this.data
      const orders = await callFunction('orderManage', {
        action: 'list',
        data: activeTab === 'accepted' ? {} : { status: activeTab },
      })
      const formatted = orders.map((o: any) => ({ ...o, totalText: (o.totalPrice / 100).toFixed(2) }))
      const filtered = (activeTab === 'accepted'
        ? formatted.filter((o: any) => o.status === 'accepted' || o.status === 'served')
        : formatted)
      this.setData({ orders: filtered })
    },
    switchTab(e: any) {
      this.setData({ activeTab: e.currentTarget.dataset.key })
      this.loadOrders()
    },
    async changeStatus(e: any) {
      const { id, status } = e.currentTarget.dataset
      await callFunction('orderManage', { action: 'updateStatus', data: { _id: id, status } })
      this.loadOrders()
    },
    getLabel(s: string) { return STATUS_LABEL[s] || s },
  },
})
