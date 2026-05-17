const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const { data } = await db.collection('users').doc(OPENID).get().catch(() => ({ data: null }))
  return { openid: OPENID, profile: data }
}
