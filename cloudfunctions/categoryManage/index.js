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
    default:
      return { error: 'unknown action' }
  }
}
