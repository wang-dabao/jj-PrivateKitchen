import { callFunction } from '../../../utils/cloud'

interface CategoryRect {
  top: number
  bottom: number
  center: number
}

Component({
  data: {
    categories: [] as any[],
    showForm: false,
    editingCategory: null as any,
    categoryForm: { name: '' },
    dragIndex: -1,
    dragOverIndex: -1,
    dragFloatY: 0,
  },
  _rowRects: [] as CategoryRect[],
  _dragStartY: 0,

  lifetimes: { attached() { this.loadData() } },
  methods: {
    async loadData() {
      const categories = await callFunction('categoryManage', { action: 'list' })
      this.setData({ categories })
    },

    /* Add / Edit / Delete */

    showAdd() {
      this.setData({ showForm: true, editingCategory: null, categoryForm: { name: '' } })
    },
    editCategory(e: any) {
      if (this.data.dragIndex >= 0) return
      const cat = this.data.categories.find(c => c._id === e.currentTarget.dataset.id)
      this.setData({ showForm: true, editingCategory: cat, categoryForm: { name: cat.name } })
    },
    async saveCategory() {
      const { categoryForm, editingCategory } = this.data
      if (editingCategory) {
        await callFunction('categoryManage', { action: 'update', data: { _id: editingCategory._id, name: categoryForm.name } })
      } else {
        await callFunction('categoryManage', { action: 'add', data: { name: categoryForm.name } })
      }
      this.setData({ showForm: false })
      this.loadData()
    },
    async deleteCategory(e: any) {
      const res = await new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>(r => wx.showModal({ title: '确认删除', success: r }))
      if (!res.confirm) return
      await callFunction('categoryManage', { action: 'delete', data: { _id: e.currentTarget.dataset.id } })
      this.loadData()
    },
    onFieldChange(e: any) { this.setData({ ['categoryForm.name']: e.detail.value }) },
    hideForm() { this.setData({ showForm: false }) },

    /* Up/Down reorder */

    async moveUp(e: any) {
      const index = Number(e.currentTarget.dataset.index)
      if (index <= 0) return
      await this._swap(index, index - 1)
    },
    async moveDown(e: any) {
      const index = Number(e.currentTarget.dataset.index)
      const { categories } = this.data
      if (index >= categories.length - 1) return
      await this._swap(index, index + 1)
    },
    async _swap(from: number, to: number) {
      const { categories } = this.data
      const backup = [...categories]
      const categoryId = categories[from]._id

      const reordered = [...categories]
      const [item] = reordered.splice(from, 1)
      reordered.splice(to, 0, item)
      this.setData({ categories: reordered })

      try {
        const result = await callFunction('categoryManage', { action: 'reorder', data: { _id: categoryId, newIndex: to } })
        if (result && !result.error) {
          await this.loadData()
        } else {
          this.setData({ categories: backup })
          wx.showToast({ title: '排序失败，请重试', icon: 'none' })
        }
      } catch (_err) {
        this.setData({ categories: backup })
        wx.showToast({ title: '排序失败，请重试', icon: 'none' })
      }
    },

    /* Drag-to-reorder */

    async onLongPress(e: any) {
      const index = e.currentTarget.dataset.index
      const touch = e.touches?.[0] || e.changedTouches?.[0]
      if (!touch) return

      await this._measureRects()

      const rect = this._rowRects[index]
      if (!rect) return

      wx.vibrateShort({ type: 'medium' })
      this._dragStartY = touch.clientY

      this.setData({
        dragIndex: index,
        dragOverIndex: index,
        dragFloatY: touch.clientY - 40,
      })
    },

    onTouchMove(e: any) {
      if (this.data.dragIndex < 0) return
      const touch = e.touches?.[0] || e.changedTouches?.[0]
      if (!touch) return

      const dy = touch.clientY - this._dragStartY
      const rect = this._rowRects[this.data.dragIndex]
      if (!rect) return

      const floatCenterY = rect.center + dy

      let overIndex = this.data.dragIndex
      for (let i = 0; i < this._rowRects.length; i++) {
        if (i === this.data.dragIndex) continue
        const r = this._rowRects[i]
        if (floatCenterY > r.top && floatCenterY < r.bottom) {
          overIndex = i
          break
        }
      }

      this.setData({
        dragFloatY: touch.clientY - 40,
        dragOverIndex: overIndex,
      })
    },

    async onTouchEnd() {
      if (this.data.dragIndex < 0) return
      const { dragIndex, dragOverIndex, categories } = this.data
      const backup = [...categories]
      if (dragIndex >= 0 && dragOverIndex >= 0 && dragIndex !== dragOverIndex) {
        const categoryId = categories[dragIndex]._id
        try {
          await callFunction('categoryManage', { action: 'reorder', data: { _id: categoryId, newIndex: dragOverIndex } })
          await this.loadData()
        } catch (_err) {
          this.setData({ categories: backup })
          wx.showToast({ title: '排序失败，请重试', icon: 'none' })
        }
      }
      this.setData({ dragIndex: -1, dragOverIndex: -1 })
      this._rowRects = []
    },

    _measureRects(): Promise<void> {
      return new Promise(resolve => {
        const q = this.createSelectorQuery()
        q.selectAll('.cat-row').boundingClientRect()
        q.exec(rects => {
          const list: WechatMiniprogram.BoundingClientRectCallbackResult[] = (rects?.[0] || []) as any
          this._rowRects = list.map(r => ({
            top: r.top,
            bottom: r.bottom,
            center: (r.top + r.bottom) / 2,
          }))
          resolve()
        })
      })
    },
  },
})
