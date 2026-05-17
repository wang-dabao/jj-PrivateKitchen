// miniprogram/utils/cloud.ts
export function callFunction(name: string, data: Record<string, any> = {}): Promise<any> {
  return wx.cloud.callFunction({ name, data }).then(res => res.result)
}
