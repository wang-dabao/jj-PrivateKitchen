const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { orderId } = event
  if (!orderId) return { error: 'missing orderId' }
  const result = await db.collection('orders').doc(orderId).get()
  return result.data
}
