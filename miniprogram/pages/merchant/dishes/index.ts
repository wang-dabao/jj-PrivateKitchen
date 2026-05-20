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
    dishForm: { name: '', price: '', description: '', images: [] as string[], categoryId: '', categoryIndex: 0, categoryName: '' },
    dishFormImagesDisplay: [] as string[],
    categoryForm: { name: '' },
    uploading: false,
  },

  lifetimes: { attached() { this.loadData() } },
  methods: {
    async loadData() {
      const categories = await callFunction('categoryManage', { action: 'list' })
      const dishes = await callFunction('dishManage', { action: 'list' })
      const activeCategoryId = categories.some(c => c._id === this.data.activeCategoryId) ? this.data.activeCategoryId : (categories[0]?._id || '')
      this.setData({ categories, dishes, activeCategoryId })
    },
    switchCategory(e: any) {
      this.setData({ activeCategoryId: e.currentTarget.dataset.id })
    },
    addDish() {
      const cats = this.data.categories
      const idx = cats.findIndex(c => c._id === this.data.activeCategoryId)
      this.setData({
        showDishForm: true,
        editingDish: null,
        dishForm: { name: '', price: '', description: '', images: [], categoryId: this.data.activeCategoryId, categoryIndex: idx >= 0 ? idx : 0, categoryName: idx >= 0 ? cats[idx].name : '' },
        dishFormImagesDisplay: [],
      })
    },
    async editDish(e: any) {
      const dish = this.data.dishes.find(d => d._id === e.currentTarget.dataset.id)
      const cats = this.data.categories
      const idx = cats.findIndex(c => c._id === dish.categoryId)
      const images = normalizeImages(dish)
      this.setData({
        showDishForm: true,
        editingDish: dish,
        dishForm: {
          name: dish.name,
          price: String(dish.price / 100),
          description: dish.description || '',
          images,
          categoryId: dish.categoryId,
          categoryIndex: idx >= 0 ? idx : 0,
          categoryName: idx >= 0 ? cats[idx].name : '',
        },
      })
      this.resolveFormImages()
    },
    async resolveFormImages() {
      const images = this.data.dishForm.images as string[]
      const cloudIds = images.filter(f => typeof f === 'string' && f.startsWith('cloud://'))
      if (!cloudIds.length) {
        this.setData({ dishFormImagesDisplay: images })
        return
      }
      const res = await wx.cloud.getTempFileURL({ fileList: cloudIds })
      const map: Record<string, string> = {}
      for (const f of res.fileList) {
        if (f.status === 0 && f.tempFileURL) map[f.fileID] = f.tempFileURL
      }
      const resolved = images.map((f: string) => map[f] || f)
      this.setData({ dishFormImagesDisplay: resolved })
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
    onDishCategoryChange(e: any) {
      const idx = parseInt(e.detail.value, 10)
      const cat = this.data.categories[idx]
      this.setData({
        'dishForm.categoryIndex': idx,
        'dishForm.categoryId': cat._id,
        'dishForm.categoryName': cat.name,
      })
    },

    async onChooseImage() {
      const res = await wx.chooseImage({ count: 9, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
      this.setData({ uploading: true })
      const uploads = res.tempFilePaths.map(p =>
        wx.cloud.uploadFile({ cloudPath: `dishes/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`, filePath: p })
      )
      const results = await Promise.all(uploads)
      const newImages = results.map(r => r.fileID)
      const newDisplay = await this.resolveFileIDs(newImages)
      this.setData({
        'dishForm.images': [...this.data.dishForm.images, ...newImages],
        dishFormImagesDisplay: [...this.data.dishFormImagesDisplay, ...newDisplay],
        uploading: false,
      })
    },
    async resolveFileIDs(fileIDs: string[]): Promise<string[]> {
      const cloudIds = fileIDs.filter(f => typeof f === 'string' && f.startsWith('cloud://'))
      if (!cloudIds.length) return fileIDs
      const res = await wx.cloud.getTempFileURL({ fileList: cloudIds })
      const map: Record<string, string> = {}
      for (const f of res.fileList) {
        if (f.status === 0 && f.tempFileURL) map[f.fileID] = f.tempFileURL
      }
      return fileIDs.map(f => map[f] || f)
    },
    onRemoveImage(e: any) {
      const idx = e.currentTarget.dataset.index
      const images = [...this.data.dishForm.images]
      const display = [...this.data.dishFormImagesDisplay]
      images.splice(idx, 1)
      display.splice(idx, 1)
      this.setData({ 'dishForm.images': images, dishFormImagesDisplay: display })
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
