const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { tableNo, items, remark } = event
  if (!tableNo || !items || !items.length) {
    return { error: 'missing required fields' }
  }
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.count, 0)
  const order = {
    tableNo,
    items,
    totalPrice,
    remark: remark || '',
    status: 'pending',
    createdAt: db.serverDate(),
  }
  const result = await db.collection('orders').add({ data: order })
  return { orderId: result._id }
}
