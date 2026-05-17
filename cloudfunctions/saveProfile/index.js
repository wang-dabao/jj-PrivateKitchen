const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { nickName, avatarUrl } = event
  if (!nickName && !avatarUrl) return { error: 'nothing to save' }
  const profile = { nickName: nickName || '', avatarUrl: avatarUrl || '', updatedAt: db.serverDate() }
  await db.collection('users').doc(OPENID).set({ data: profile })
  return { ok: true, profile }
}
