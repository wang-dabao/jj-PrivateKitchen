const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { data: categories } = await db.collection('categories')
    .orderBy('sort', 'asc')
    .get()
  const { data: dishes } = await db.collection('dishes')
    .where({ isAvailable: true })
    .orderBy('sort', 'asc')
    .get()
  return { categories, dishes }
}
