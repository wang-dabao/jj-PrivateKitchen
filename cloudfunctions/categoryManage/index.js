const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { action, data } = event
  const coll = db.collection('categories')

  if ((action === 'update' || action === 'delete') && (!data || !data._id)) {
    return { error: 'missing data._id' }
  }

  switch (action) {
    case 'list':
      return (await coll.orderBy('sort', 'asc').get()).data
    case 'add':
      return (await coll.add({ data: { ...data, sort: data.sort || 0 } }))._id
    case 'update': {
      const { _id, ...fields } = data
      await coll.doc(_id).update({ data: fields })
      return { ok: true }
    }
    case 'delete':
      await coll.doc(data._id).remove()
      return { ok: true }
    case 'reorder': {
      const all = (await coll.orderBy('sort', 'asc').get()).data
      const idx = all.findIndex(c => c._id === data._id)
      if (idx < 0) return { error: 'category not found' }

      let targetIdx: number
      if (data.newIndex !== undefined) {
        targetIdx = data.newIndex
      } else {
        targetIdx = data.direction === 'up' ? idx - 1 : idx + 1
      }
      if (targetIdx < 0 || targetIdx >= all.length || targetIdx === idx) return { ok: true }

      const item = all.splice(idx, 1)[0]
      all.splice(targetIdx, 0, item)

      const tasks = all.map((c, i) => coll.doc(c._id).update({ data: { sort: i } }))
      await Promise.all(tasks)
      return { ok: true }
    }
    default:
      return { error: 'unknown action' }
  }
}
