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

exports.main = async (event) => {
  const { action, data } = event
  const coll = db.collection('dishes')

  if ((action === 'update' || action === 'delete' || action === 'toggleAvailable') && (!data || !data._id)) {
    return { error: 'missing data._id' }
  }

  switch (action) {
    case 'list':
      return await resolveImages((await coll.orderBy('sort', 'asc').get()).data)
    case 'add':
      return (await coll.add({ data: { ...data, isAvailable: true, sort: data.sort || 0 } }))._id
    case 'update': {
      const { _id, ...fields } = data
      await coll.doc(_id).update({ data: fields })
      return { ok: true }
    }
    case 'toggleAvailable': {
      const dish = (await coll.doc(data._id).get()).data
      await coll.doc(data._id).update({ data: { isAvailable: !dish.isAvailable } })
      return { ok: true }
    }
    case 'delete':
      await coll.doc(data._id).remove()
      return { ok: true }
    default:
      return { error: 'unknown action' }
  }
}
