const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { action, data } = event
  const coll = db.collection('orders')

  switch (action) {
    case 'list': {
      const where = data?.status ? { status: data.status } : { status: _.neq('completed') }
      return (await coll.where(where).orderBy('createdAt', 'desc').get()).data
    }
    case 'updateStatus': {
      if (!data || !data._id) return { error: 'missing data._id' }
      await coll.doc(data._id).update({ data: { status: data.status } })
      return { ok: true }
    }
    default:
      return { error: 'unknown action' }
  }
}
