const app = getApp<IAppOption>()

Component({
  data: {
    tableNo: 0,
    showTablePicker: false,
    tableNumbers: Array.from({ length: 20 }, (_, i) => i + 1),
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = (currentPage as any).options || {}
      const tableNo = parseInt(options.tableNo) || 0
      if (tableNo > 0) {
        app.globalData.tableNo = tableNo
        this.setData({ tableNo })
        wx.redirectTo({ url: '/pages/menu/index' })
      }
    },
  },
  methods: {
    onTableSelect(e: any) {
      const tableNo = parseInt(e.currentTarget.dataset.no)
      app.globalData.tableNo = tableNo
      this.setData({ tableNo, showTablePicker: false })
      wx.navigateTo({ url: '/pages/menu/index' })
    },
    openTablePicker() {
      this.setData({ showTablePicker: true })
    },
    closeTablePicker() {
      this.setData({ showTablePicker: false })
    },
    goMerchant() {
      wx.navigateTo({ url: '/pages/merchant/dashboard/index' })
    },
  },
})
