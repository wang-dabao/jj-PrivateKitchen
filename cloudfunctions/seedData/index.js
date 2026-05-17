const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const categories = [
  { name: '招牌推荐', sort: 1 },
  { name: '凉菜', sort: 2 },
  { name: '热菜', sort: 3 },
  { name: '汤品', sort: 4 },
  { name: '主食', sort: 5 },
  { name: '饮品', sort: 6 },
]

const dishes = [
  { name: '姜姜红烧肉', price: 4800, description: '精选五花肉，慢炖两小时，肥而不腻，入口即化', categoryIndex: 0, sort: 1, image: '' },
  { name: '秘制酱鸭', price: 5800, description: '自制酱料腌制24小时，肉质紧实，酱香浓郁', categoryIndex: 0, sort: 2, image: '' },
  { name: '清蒸鲈鱼', price: 6800, description: '每日新鲜鲈鱼，清蒸保留原汁原味', categoryIndex: 0, sort: 3, image: '' },
  { name: '蒜泥白肉', price: 3200, description: '薄切猪后腿肉，配秘制蒜泥酱', categoryIndex: 1, sort: 1, image: '' },
  { name: '凉拌木耳', price: 1800, description: '东北黑木耳，酸辣爽口，开胃解腻', categoryIndex: 1, sort: 2, image: '' },
  { name: '拍黄瓜', price: 1200, description: '新鲜黄瓜，现拍现拌，清脆爽口', categoryIndex: 1, sort: 3, image: '' },
  { name: '鱼香肉丝', price: 3200, description: '经典川味，酸甜微辣，下饭神器', categoryIndex: 2, sort: 1, image: '' },
  { name: '宫保鸡丁', price: 3500, description: '花生与鸡丁的经典搭配，麻辣鲜香', categoryIndex: 2, sort: 2, image: '' },
  { name: '干煸四季豆', price: 2200, description: '四季豆煸至微焦，加入肉末芽菜提香', categoryIndex: 2, sort: 3, image: '' },
  { name: '麻婆豆腐', price: 2200, description: '嫩豆腐配牛肉末，麻辣烫香，正宗川味', categoryIndex: 2, sort: 4, image: '' },
  { name: '糖醋里脊', price: 3800, description: '猪里脊炸至金黄，裹上酸甜酱汁', categoryIndex: 2, sort: 5, image: '' },
  { name: '番茄蛋花汤', price: 1500, description: '新鲜番茄与农家土鸡蛋，家常好味', categoryIndex: 3, sort: 1, image: '' },
  { name: '酸菜粉丝汤', price: 1800, description: '自制酸菜，汤底鲜滑', categoryIndex: 3, sort: 2, image: '' },
  { name: '米饭', price: 200, description: '东北五常大米，粒粒饱满', categoryIndex: 4, sort: 1, image: '' },
  { name: '手工水饺', price: 2800, description: '猪肉白菜馅，现点现包，12个/份', categoryIndex: 4, sort: 2, image: '' },
  { name: '葱油拌面', price: 1600, description: '手工拉面，葱油炸香', categoryIndex: 4, sort: 3, image: '' },
  { name: '自制酸梅汤', price: 1200, description: '传统配方熬制，冰镇解暑', categoryIndex: 5, sort: 1, image: '' },
  { name: '柠檬水', price: 800, description: '新鲜柠檬切片，清爽解渴', categoryIndex: 5, sort: 2, image: '' },
]

async function clearAll(collName) {
  const MAX = 100
  try {
    const { data } = await db.collection(collName).limit(MAX).get()
    const batchDelete = data.map(doc => db.collection(collName).doc(doc._id).remove())
    await Promise.all(batchDelete)
    return data.length
  } catch (e) {
    // 集合不存在时忽略
    return 0
  }
}

exports.main = async () => {
  const removedCategories = await clearAll('categories')
  const removedDishes = await clearAll('dishes')

  const catIds = []
  for (const cat of categories) {
    const res = await db.collection('categories').add({ data: cat })
    catIds.push(res._id)
  }

  for (const dish of dishes) {
    await db.collection('dishes').add({
      data: {
        name: dish.name,
        price: dish.price,
        description: dish.description,
        categoryId: catIds[dish.categoryIndex],
        sort: dish.sort,
        isAvailable: true,
        images: dish.image ? [dish.image] : [],
      },
    })
  }

  return {
    ok: true,
    removed: { categories: removedCategories, dishes: removedDishes },
    inserted: { categories: catIds.length, dishes: dishes.length },
  }
}
