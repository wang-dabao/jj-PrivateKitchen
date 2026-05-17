/// <reference path="./types/index.d.ts" />

interface CartItem {
  dishId: string
  name: string
  price: number
  count: number
}

interface IAppOption {
  globalData: {
    tableNo: number
    isMerchant: boolean
    cart: CartItem[]
    envId: string
    openid: string
    userProfile: { nickName: string; avatarUrl: string } | null
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback
  fetchOpenId(): Promise<void>
}