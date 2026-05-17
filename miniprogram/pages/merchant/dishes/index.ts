import { callFunction } from '../../../utils/cloud'

function normalizeImages(dish: any): string[] {
  if (!dish) return []
  if (Array.isArray(dish.images)) return dish.images
  if (Array.isArray(dish.image)) return dish.image
  if (typeof dish.image === 'string' && dish.image) return [dish.image]
  return []
}

Component({
  data: {
    categories: [] as any[],
    dishes: [] as any[],
    activeCategoryId: '',
    showDishForm: false,
    showCategoryForm: false,
    editingDish: null as any,
    editingCategory: null as any,
    dishForm: { name: '', price: '', description: '', images: [] as string[], categoryId: '' },
    categoryForm: { name: '' },
    uploading: false,
  },
  lifetimes: { attached() { this.loadData() } },
  methods: {
    async loadData() {
      const categories = await callFunction('categoryManage', { action: 'list' })
      const dishes = await callFunction('dishManage', { action: 'list' })
      this.setData({ categories, dishes, activeCategoryId: categories[0]?._id || '' })
    },
    switchCategory(e: any) { this.setData({ activeCategoryId: e.currentTarget.dataset.id }) },
    addDish() {
      this.setData({
        showDishForm: true,
        editingDish: null,
        dishForm: { name: '', price: '', description: '', images: [], categoryId: this.data.activeCategoryId },
      })
    },
    editDish(e: any) {
      const dish = this.data.dishes.find(d => d._id === e.currentTarget.dataset.id)
      this.setData({
        showDishForm: true,
        editingDish: dish,
        dishForm: {
          name: dish.name,
          price: String(dish.price / 100),
          description: dish.description || '',
          images: normalizeImages(dish),
          categoryId: dish.categoryId,
        },
      })
    },
    async saveDish() {
      const { dishForm, editingDish } = this.data
      const data = {
        name: dishForm.name,
        price: Math.round(parseFloat(dishForm.price) * 100),
        description: dishForm.description,
        images: dishForm.images,
        categoryId: dishForm.categoryId,
      }
      if (editingDish) {
        await callFunction('dishManage', { action: 'update', data: { _id: editingDish._id, ...data } })
      } else {
        await callFunction('dishManage', { action: 'add', data })
      }
      this.setData({ showDishForm: false })
      this.loadData()
    },
    async toggleDish(e: any) {
      await callFunction('dishManage', { action: 'toggleAvailable', data: { _id: e.currentTarget.dataset.id } })
      this.loadData()
    },
    async deleteDish(e: any) {
      const res = await new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>(r => wx.showModal({ title: '确认删除', success: r }))
      if (!res.confirm) return
      await callFunction('dishManage', { action: 'delete', data: { _id: e.currentTarget.dataset.id } })
      this.loadData()
    },
    onDishFieldChange(e: any) {
      const { field } = e.currentTarget.dataset
      this.setData({ [`dishForm.${field}`]: e.detail.value })
    },
    async onChooseImage() {
      const res = await wx.chooseImage({ count: 9, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
      this.setData({ uploading: true })
      const uploads = res.tempFilePaths.map(p =>
        wx.cloud.uploadFile({ cloudPath: `dishes/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`, filePath: p })
      )
      const results = await Promise.all(uploads)
      const newImages = results.map(r => r.fileID)
      this.setData({
        'dishForm.images': [...this.data.dishForm.images, ...newImages],
        uploading: false,
      })
    },
    onRemoveImage(e: any) {
      const idx = e.currentTarget.dataset.index
      const images = [...this.data.dishForm.images]
      images.splice(idx, 1)
      this.setData({ 'dishForm.images': images })
    },
    showAddCategory() { this.setData({ showCategoryForm: true, editingCategory: null, categoryForm: { name: '' } }) },
    editCategory(e: any) {
      const cat = this.data.categories.find(c => c._id === e.currentTarget.dataset.id)
      this.setData({ showCategoryForm: true, editingCategory: cat, categoryForm: { name: cat.name } })
    },
    async saveCategory() {
      const { categoryForm, editingCategory } = this.data
      if (editingCategory) {
        await callFunction('categoryManage', { action: 'update', data: { _id: editingCategory._id, name: categoryForm.name } })
      } else {
        await callFunction('categoryManage', { action: 'add', data: { name: categoryForm.name } })
      }
      this.setData({ showCategoryForm: false })
      this.loadData()
    },
    async deleteCategory(e: any) {
      const res = await new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>(r => wx.showModal({ title: '确认删除', success: r }))
      if (!res.confirm) return
      await callFunction('categoryManage', { action: 'delete', data: { _id: e.currentTarget.dataset.id } })
      this.loadData()
    },
    onCategoryFieldChange(e: any) { this.setData({ ['categoryForm.name']: e.detail.value }) },
    hideDishForm() { this.setData({ showDishForm: false }) },
    hideCategoryForm() { this.setData({ showCategoryForm: false }) },
    hideModals() { this.setData({ showDishForm: false, showCategoryForm: false }) },
  },
})
