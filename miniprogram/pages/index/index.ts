import shop from '../../config/shop'
import { callFunction } from '../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    shop,
    currentOrderId: '',
    showProfile: false,
    profileNickName: '',
    profileAvatarUrl: '',
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
    async goMenu() {
      if (app.globalData.userProfile) {
        this.navigateToMenu()
        return
      }
      if (!app.globalData.openid) {
        wx.showLoading({ title: '请稍候…' })
        try {
          await app.fetchOpenId()
        } catch (_) {
          // fetchOpenId 内部已打印日志
        }
        wx.hideLoading()
        if (!app.globalData.openid) {
          wx.showToast({ title: '网络不给力，请重试', icon: 'none' })
          return
        }
      }
      this.setData({ showProfile: true })
    },
    navigateToMenu() {
      app.globalData.tableNo = 1
      wx.navigateTo({ url: '/pages/menu/index' })
    },
    onChooseAvatar(e: any) {
      this.setData({ profileAvatarUrl: e.detail.avatarUrl })
    },
    onNickNameInput(e: any) {
      this.setData({ profileNickName: e.detail.value })
    },
    async saveProfile() {
      const { profileNickName, profileAvatarUrl } = this.data
      if (!profileNickName.trim()) {
        wx.showToast({ title: '请输入昵称', icon: 'none' })
        return
      }
      wx.showLoading({ title: '保存中' })
      try {
        const res = await callFunction('saveProfile', { nickName: profileNickName, avatarUrl: profileAvatarUrl })
        app.globalData.userProfile = { nickName: res.profile.nickName, avatarUrl: res.profile.avatarUrl }
        this.setData({ showProfile: false })
        wx.hideLoading()
        this.navigateToMenu()
      } catch (e: any) {
        wx.hideLoading()
        console.error('保存 profile 失败:', e)
        wx.showToast({ title: e.errMsg || '保存失败，请重试', icon: 'none' })
      }
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
