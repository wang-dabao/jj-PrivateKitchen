const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const result = {}

  // 检查 categories
  try {
    const { data } = await db.collection('categories').orderBy('sort', 'asc').get()
    result.categories = { ok: true, count: data.length, data }
  } catch (e) {
    result.categories = { ok: false, error: e.message }
  }

  // 检查 dishes
  try {
    const { data } = await db.collection('dishes').orderBy('sort', 'asc').get()
    result.dishes = { ok: true, count: data.length, data }
  } catch (e) {
    result.dishes = { ok: false, error: e.message }
  }

  // 检查 orders
  try {
    const { data } = await db.collection('orders').orderBy('createdAt', 'desc').get()
    result.orders = { ok: true, count: data.length, data }
  } catch (e) {
    result.orders = { ok: false, error: e.message }
  }

  return result
}
