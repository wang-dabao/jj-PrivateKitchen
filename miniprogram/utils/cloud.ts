// miniprogram/utils/cloud.ts
const app = getApp<IAppOption>()

export function callFunction(name: string, data: Record<string, any> = {}): Promise<any> {
  return wx.cloud.callFunction({ name, data }).then(res => res.result)
}

export function getDb() {
  return wx.cloud.database()
}
