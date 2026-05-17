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
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}