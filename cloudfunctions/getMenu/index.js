const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function resolveImages(dishes) {
  const fileIDs = []
  for (const d of dishes) {
    const imgs = Array.isArray(d.images) ? d.images : (Array.isArray(d.image) ? d.image : (d.image ? [d.image] : []))
    for (const f of imgs) {
      if (typeof f === 'string' && f.startsWith('cloud://')) fileIDs.push(f)
    }
  }
  if (!fileIDs.length) return dishes
  const res = await cloud.getTempFileURL({ fileList: fileIDs })
  const map = {}
  for (const f of res.fileList) {
    if (f.status === 0 && f.tempFileURL) map[f.fileID] = f.tempFileURL
  }
  return dishes.map(d => {
    const imgs = Array.isArray(d.images) ? d.images : (Array.isArray(d.image) ? d.image : (d.image ? [d.image] : []))
    return { ...d, images: imgs.map(f => map[f] || f) }
  })
}

exports.main = async () => {
  const { data: categories } = await db.collection('categories')
    .orderBy('sort', 'asc')
    .get()
  const { data: dishes } = await db.collection('dishes')
    .where({ isAvailable: true })
    .orderBy('sort', 'asc')
    .get()
  const resolved = await resolveImages(dishes)
  return { categories, dishes: resolved }
}
