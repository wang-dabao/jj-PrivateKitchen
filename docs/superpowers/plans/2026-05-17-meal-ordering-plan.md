# 堂食扫码点餐系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建堂食扫码点餐小程序，顾客扫码选桌点餐，商家端接单管理，基于微信云开发。

**Architecture:** 单小程序双角色（顾客/商家），7 个页面通过角色切换入口分流。6 个云函数中转数据库操作，顾客端不直连数据库。Skyline + glass-easel + TypeScript。

**Tech Stack:** 微信小程序 Skyline 渲染引擎、glass-easel 组件框架、TypeScript、微信云开发（云函数 + 云数据库 + 云存储）。

---

### Task 1: 项目基础配置

**Files:**
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/app.ts`
- Modify: `miniprogram/app.wxss`
- Create: `miniprogram/utils/cloud.ts`
- Create: `cloudfunctions/getMenu/index.js`
- Create: `cloudfunctions/getMenu/package.json`
- Create: `cloudfunctions/getMenu/config.json`

- [ ] **Step 1: 注册所有页面到 app.json**

```json
{
  "pages": [
    "pages/index/index",
    "pages/menu/index",
    "pages/cart/index",
    "pages/order/index",
    "pages/merchant/dashboard/index",
    "pages/merchant/orders/index",
    "pages/merchant/dishes/index"
  ],
  "window": {
    "navigationBarTextStyle": "black",
    "navigationStyle": "custom"
  },
  "style": "v2",
  "renderer": "skyline",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "disableABTest": true,
      "sdkVersionBegin": "3.0.0",
      "sdkVersionEnd": "15.255.255"
    }
  },
  "componentFramework": "glass-easel",
  "sitemapLocation": "sitemap.json",
  "lazyCodeLoading": "requiredComponents"
}
```

- [ ] **Step 2: 更新 app.ts，初始化云开发和全局数据**

```ts
// app.ts
App<IAppOption>({
  globalData: {
    tableNo: 0,
    isMerchant: false,
    cart: [] as CartItem[],
    envId: 'your-env-id',
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true,
      })
    }
  },
})

interface CartItem {
  dishId: string
  name: string
  price: number
  count: number
}
```

- [ ] **Step 3: 更新全局样式 app.wxss**

```css
page {
  --color-primary: #e6532e;
  --color-bg: #f5f5f5;
  --color-text: #333;
  --color-text-light: #999;
  --color-border: #eee;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 28rpx;
}
```

- [ ] **Step 4: 创建云工具初始化模块**

```ts
// miniprogram/utils/cloud.ts
const app = getApp<IAppOption>()

export function callFunction(name: string, data: Record<string, any> = {}): Promise<any> {
  return wx.cloud.callFunction({ name, data }).then(res => res.result)
}

export function getDb() {
  return wx.cloud.database()
}
```

- [ ] **Step 5: 创建第一个云函数 getMenu 作为模板**

```json
// cloudfunctions/getMenu/package.json
{
  "name": "getMenu",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```js
// cloudfunctions/getMenu/index.js
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
```

```json
// cloudfunctions/getMenu/config.json
{
  "permissions": {
    "openapi": []
  }
}
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: project setup — pages, cloud init, global styles, first cloud function"
```

---

### Task 2: 云函数 — categoryManage 和 dishManage

**Files:**
- Create: `cloudfunctions/categoryManage/index.js`
- Create: `cloudfunctions/categoryManage/package.json`
- Create: `cloudfunctions/categoryManage/config.json`
- Create: `cloudfunctions/dishManage/index.js`
- Create: `cloudfunctions/dishManage/package.json`
- Create: `cloudfunctions/dishManage/config.json`

- [ ] **Step 1: 编写 categoryManage 云函数**

```json
// cloudfunctions/categoryManage/package.json
{
  "name": "categoryManage",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```json
// cloudfunctions/categoryManage/config.json
{
  "permissions": { "openapi": [] }
}
```

```js
// cloudfunctions/categoryManage/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { action, data } = event
  const coll = db.collection('categories')

  switch (action) {
    case 'list':
      return (await coll.orderBy('sort', 'asc').get()).data
    case 'add':
      return (await coll.add({ data: { ...data, sort: data.sort || 0 } }))._id
    case 'update':
      await coll.doc(data._id).update({ data })
      return { ok: true }
    case 'delete':
      await coll.doc(data._id).remove()
      return { ok: true }
    default:
      return { error: 'unknown action' }
  }
}
```

- [ ] **Step 2: 编写 dishManage 云函数**

```json
// cloudfunctions/dishManage/package.json
{
  "name": "dishManage",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```json
// cloudfunctions/dishManage/config.json
{
  "permissions": { "openapi": [] }
}
```

```js
// cloudfunctions/dishManage/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { action, data } = event
  const coll = db.collection('dishes')

  switch (action) {
    case 'list':
      return (await coll.orderBy('sort', 'asc').get()).data
    case 'add':
      return (await coll.add({ data: { ...data, isAvailable: true, sort: data.sort || 0 } }))._id
    case 'update':
      await coll.doc(data._id).update({ data })
      return { ok: true }
    case 'toggleAvailable':
      const dish = (await coll.doc(data._id).get()).data
      await coll.doc(data._id).update({ data: { isAvailable: !dish.isAvailable } })
      return { ok: true }
    case 'delete':
      await coll.doc(data._id).remove()
      return { ok: true }
    default:
      return { error: 'unknown action' }
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: categoryManage and dishManage cloud functions"
```

---

### Task 3: 云函数 — submitOrder、getOrder、orderManage

**Files:**
- Create: `cloudfunctions/submitOrder/index.js`, `package.json`, `config.json`
- Create: `cloudfunctions/getOrder/index.js`, `package.json`, `config.json`
- Create: `cloudfunctions/orderManage/index.js`, `package.json`, `config.json`

- [ ] **Step 1: 编写 submitOrder 云函数**

```json
// cloudfunctions/submitOrder/package.json
{
  "name": "submitOrder",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```js
// cloudfunctions/submitOrder/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { tableNo, items, remark } = event
  if (!tableNo || !items || !items.length) {
    return { error: 'missing required fields' }
  }
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.count, 0)
  const order = {
    tableNo,
    items,
    totalPrice,
    remark: remark || '',
    status: 'pending',
    createdAt: db.serverDate(),
  }
  const result = await db.collection('orders').add({ data: order })
  return { orderId: result._id }
}
```

```json
// cloudfunctions/submitOrder/config.json
{ "permissions": { "openapi": [] } }
```

- [ ] **Step 2: 编写 getOrder 云函数**

```json
// cloudfunctions/getOrder/package.json
{
  "name": "getOrder",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```js
// cloudfunctions/getOrder/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { orderId } = event
  if (!orderId) return { error: 'missing orderId' }
  const result = await db.collection('orders').doc(orderId).get()
  return result.data
}
```

```json
// cloudfunctions/getOrder/config.json
{ "permissions": { "openapi": [] } }
```

- [ ] **Step 3: 编写 orderManage 云函数**

```json
// cloudfunctions/orderManage/package.json
{
  "name": "orderManage",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

```js
// cloudfunctions/orderManage/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { action, data } = event
  const coll = db.collection('orders')

  switch (action) {
    case 'list':
      // 按状态筛选，默认查非 completed 订单，按时间倒序
      const where = data?.status ? { status: data.status } : { status: _.neq('completed') }
      return (await coll.where(where).orderBy('createdAt', 'desc').get()).data
    case 'updateStatus':
      await coll.doc(data._id).update({ data: { status: data.status } })
      return { ok: true }
    default:
      return { error: 'unknown action' }
  }
}
```

```json
// cloudfunctions/orderManage/config.json
{ "permissions": { "openapi": [] } }
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: submitOrder, getOrder, orderManage cloud functions"
```

---

### Task 4: 顾客首页 — 扫码解析 + 桌号选择 + 商家入口

**Files:**
- Rewrite: `miniprogram/pages/index/index.ts`
- Rewrite: `miniprogram/pages/index/index.wxml`
- Rewrite: `miniprogram/pages/index/index.wxss`
- Modify: `miniprogram/pages/index/index.json`

- [ ] **Step 1: 重写 index.json**

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 重写 index.ts**

```ts
const app = getApp<IAppOption>()

Component({
  data: {
    tableNo: 0,
    showTablePicker: false,
    tableNumbers: Array.from({ length: 20 }, (_, i) => i + 1),
  },
  lifetimes: {
    attached() {
      // 解析扫码参数
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = (currentPage as any).options || {}
      const tableNo = parseInt(options.tableNo) || 0
      if (tableNo > 0) {
        app.globalData.tableNo = tableNo
        this.setData({ tableNo })
        wx.redirectTo({ url: '/pages/menu/index' })
      }
    },
  },
  methods: {
    onTableSelect(e: any) {
      const tableNo = parseInt(e.currentTarget.dataset.no)
      app.globalData.tableNo = tableNo
      this.setData({ tableNo, showTablePicker: false })
      wx.navigateTo({ url: '/pages/menu/index' })
    },
    openTablePicker() {
      this.setData({ showTablePicker: true })
    },
    closeTablePicker() {
      this.setData({ showTablePicker: false })
    },
    goMerchant() {
      wx.navigateTo({ url: '/pages/merchant/dashboard/index' })
    },
  },
})
```

- [ ] **Step 3: 重写 index.wxml**

```xml
<navigation-bar title="私厨点餐" back="{{false}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <view class="hero">
    <text class="hero-title">欢迎光临</text>
    <text class="hero-desc">扫码点餐，美味即刻下单</text>
  </view>
  <view class="actions">
    <button class="btn-primary" bindtap="openTablePicker">选择桌号开始点餐</button>
    <button class="btn-ghost" bindtap="goMerchant">商家入口</button>
  </view>
  <!-- 桌号选择弹窗 -->
  <view class="modal-mask" wx:if="{{showTablePicker}}" bindtap="closeTablePicker"></view>
  <view class="table-picker" wx:if="{{showTablePicker}}">
    <text class="picker-title">请选择桌号</text>
    <view class="table-grid">
      <view
        wx:for="{{tableNumbers}}"
        wx:key="*this"
        class="table-item"
        data-no="{{item}}"
        bindtap="onTableSelect"
      >{{item}}号桌</view>
    </view>
    <button class="btn-ghost" bindtap="closeTablePicker">取消</button>
  </view>
</view>
```

- [ ] **Step 4: 重写 index.wxss**

```css
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx;
}
.hero {
  text-align: center;
  margin-bottom: 80rpx;
}
.hero-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}
.hero-desc {
  display: block;
  color: var(--color-text-light);
  font-size: 28rpx;
}
.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  text-align: center;
  border: none;
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-light);
  border: 2rpx solid var(--color-border);
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  text-align: center;
}
.modal-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
}
.table-picker {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 30rpx calc(40rpx + env(safe-area-inset-bottom));
  z-index: 101;
}
.picker-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
}
.table-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 30rpx;
}
.table-item {
  width: calc(25% - 15rpx);
  padding: 24rpx 0;
  text-align: center;
  border: 2rpx solid var(--color-border);
  border-radius: 16rpx;
  font-size: 28rpx;
}
```

- [ ] **Step 5: 在微信开发者工具中验证页面**

在模拟器中打开首页，确认：
- 无桌号参数时显示首页选择界面
- 点击桌号弹出选择面板
- 选桌后跳转菜单页（菜单页尚未创建，会报路径错误，先确认跳转行为）
- 商家入口按钮可点击

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: customer index page with QR parsing, table selector, merchant entry"
```

---

### Task 5: 菜单页

**Files:**
- Create: `miniprogram/pages/menu/index.json`
- Create: `miniprogram/pages/menu/index.ts`
- Create: `miniprogram/pages/menu/index.wxml`
- Create: `miniprogram/pages/menu/index.wxss`

- [ ] **Step 1: 创建 index.json**

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 编写 index.ts**

```ts
import { callFunction } from '../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    categories: [] as any[],
    dishes: [] as any[],
    activeCategoryId: '',
    cart: [] as CartItem[],
    cartTotal: 0,
    cartCount: 0,
  },
  lifetimes: {
    attached() {
      this.loadMenu()
      this.syncCart()
    },
  },
  methods: {
    async loadMenu() {
      wx.showLoading({ title: '加载中' })
      try {
        const res = await callFunction('getMenu')
        this.setData({
          categories: res.categories,
          dishes: res.dishes,
          activeCategoryId: res.categories[0]?._id || '',
        })
      } catch (e) {
        wx.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    },
    switchCategory(e: any) {
      this.setData({ activeCategoryId: e.currentTarget.dataset.id })
    },
    addToCart(e: any) {
      const { id, name, price } = e.currentTarget.dataset
      const cart = app.globalData.cart
      const existing = cart.find(i => i.dishId === id)
      if (existing) {
        existing.count++
      } else {
        cart.push({ dishId: id, name, price, count: 1 })
      }
      app.globalData.cart = cart
      this.syncCart()
      wx.showToast({ title: '已加入', icon: 'success', duration: 800 })
    },
    syncCart() {
      const cart = app.globalData.cart
      const cartCount = cart.reduce((s, i) => s + i.count, 0)
      const cartTotal = cart.reduce((s, i) => s + i.price * i.count, 0)
      this.setData({ cart, cartCount, cartTotal })
    },
    goCart() {
      wx.navigateTo({ url: '/pages/cart/index' })
    },
    formatPrice(price: number) {
      return (price / 100).toFixed(2)
    },
  },
})
```

- [ ] **Step 3: 编写 index.wxml**

```xml
<navigation-bar title="菜单" back="{{true}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <!-- 分类导航 -->
  <scroll-view class="category-bar" scroll-x>
    <view
      wx:for="{{categories}}"
      wx:key="_id"
      class="category-tab {{activeCategoryId === item._id ? 'active' : ''}}"
      data-id="{{item._id}}"
      bindtap="switchCategory"
    >{{item.name}}</view>
  </scroll-view>
  <!-- 菜品列表 -->
  <scroll-view class="dish-list" scroll-y type="list">
    <view wx:for="{{dishes}}" wx:key="_id" wx:if="{{item.categoryId === activeCategoryId}}" class="dish-card">
      <image wx:if="{{item.image}}" class="dish-img" src="{{item.image}}" mode="aspectFill" />
      <view class="dish-info">
        <text class="dish-name">{{item.name}}</text>
        <text class="dish-desc" wx:if="{{item.description}}">{{item.description}}</text>
        <view class="dish-bottom">
          <text class="dish-price">¥{{item.price / 100}}</text>
          <view class="add-btn" data-id="{{item._id}}" data-name="{{item.name}}" data-price="{{item.price}}" bindtap="addToCart">+</view>
        </view>
      </view>
    </view>
  </scroll-view>
  <!-- 底部购物车栏 -->
  <view class="cart-bar" wx:if="{{cartCount > 0}}" bindtap="goCart">
    <view class="cart-info">
      <text class="cart-count">{{cartCount}}</text>
      <text class="cart-price">¥{{cartTotal / 100}}</text>
    </view>
    <text class="cart-action">去下单</text>
  </view>
</view>
```

- [ ] **Step 4: 编写 index.wxss**

```css
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.category-bar {
  white-space: nowrap;
  padding: 10rpx 30rpx;
  background: #fff;
  border-bottom: 2rpx solid var(--color-border);
  flex-shrink: 0;
}
.category-tab {
  display: inline-block;
  padding: 16rpx 28rpx;
  font-size: 28rpx;
  color: var(--color-text-light);
}
.category-tab.active {
  color: var(--color-primary);
  font-weight: bold;
}
.dish-list {
  flex: 1;
  padding: 20rpx;
}
.dish-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.dish-img {
  width: 180rpx;
  height: 180rpx;
  flex-shrink: 0;
}
.dish-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}
.dish-name {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.dish-desc {
  font-size: 24rpx;
  color: var(--color-text-light);
  flex: 1;
}
.dish-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dish-price {
  font-size: 30rpx;
  color: var(--color-primary);
  font-weight: bold;
}
.add-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 36rpx;
  text-align: center;
  line-height: 52rpx;
}
.cart-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #333;
  color: #fff;
}
.cart-count {
  background: var(--color-primary);
  border-radius: 50%;
  width: 44rpx;
  height: 44rpx;
  text-align: center;
  line-height: 44rpx;
  font-size: 24rpx;
  margin-right: 16rpx;
  display: inline-block;
}
.cart-price {
  font-size: 32rpx;
  font-weight: bold;
}
.cart-action {
  background: var(--color-primary);
  padding: 16rpx 40rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
}
```

- [ ] **Step 5: 在开发者工具中验证**

- 进入菜单页，验证分类切换和菜品加载
- 点 + 加购，验证购物车数量和价格实时更新
- 验证底部购物车栏显示正确

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: menu page with category tabs, dish list, cart bar"
```

---

### Task 6: 购物车/下单页

**Files:**
- Create: `miniprogram/pages/cart/index.json`
- Create: `miniprogram/pages/cart/index.ts`
- Create: `miniprogram/pages/cart/index.wxml`
- Create: `miniprogram/pages/cart/index.wxss`

- [ ] **Step 1: 创建 index.json**

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 编写 index.ts**

```ts
import { callFunction } from '../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    cart: [] as CartItem[],
    totalPrice: 0,
    remark: '',
  },
  lifetimes: {
    attached() {
      this.syncCart()
    },
  },
  methods: {
    syncCart() {
      const cart = app.globalData.cart
      const totalPrice = cart.reduce((s, i) => s + i.price * i.count, 0)
      this.setData({ cart, totalPrice })
    },
    increase(e: any) {
      const item = app.globalData.cart.find(i => i.dishId === e.currentTarget.dataset.id)
      if (item) item.count++
      app.globalData.cart = app.globalData.cart.filter(i => i.count > 0)
      this.syncCart()
    },
    decrease(e: any) {
      const item = app.globalData.cart.find(i => i.dishId === e.currentTarget.dataset.id)
      if (item) {
        item.count--
        if (item.count <= 0) {
          app.globalData.cart = app.globalData.cart.filter(i => i.dishId !== item.dishId)
        }
      }
      this.syncCart()
    },
    async submitOrder() {
      const { cart, totalPrice } = this.data
      if (!cart.length) return wx.showToast({ title: '购物车为空', icon: 'none' })
      if (!app.globalData.tableNo) return wx.showToast({ title: '请先选择桌号', icon: 'none' })
      wx.showLoading({ title: '提交中' })
      try {
        const res = await callFunction('submitOrder', {
          tableNo: app.globalData.tableNo,
          items: (cart as CartItem[]).map(i => ({
            dishId: i.dishId,
            name: i.name,
            price: i.price,
            count: i.count,
          })),
          remark: this.data.remark,
        })
        app.globalData.cart = []
        wx.redirectTo({ url: `/pages/order/index?orderId=${res.orderId}` })
      } catch (e) {
        wx.showToast({ title: '提交失败', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    },
    onRemarkInput(e: any) {
      this.setData({ remark: e.detail.value })
    },
  },
})
```

- [ ] **Step 3: 编写 index.wxml**

```xml
<navigation-bar title="确认订单" back="{{true}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <view class="info-bar">
    <text>桌号：{{tableNo}}号桌</text>
  </view>
  <view class="cart-list">
    <view wx:for="{{cart}}" wx:key="dishId" class="cart-item">
      <text class="item-name">{{item.name}}</text>
      <view class="item-qty">
        <view class="qty-btn" data-id="{{item.dishId}}" bindtap="decrease">-</view>
        <text class="qty-num">{{item.count}}</text>
        <view class="qty-btn" data-id="{{item.dishId}}" bindtap="increase">+</view>
      </view>
      <text class="item-subtotal">¥{{item.price * item.count / 100}}</text>
    </view>
  </view>
  <view class="remark-section">
    <text class="section-title">备注</text>
    <textarea class="remark-input" value="{{remark}}" placeholder="如有特殊要求请留言" bindinput="onRemarkInput" maxlength="200" />
  </view>
  <view class="bottom-bar">
    <text class="total-label">合计：</text>
    <text class="total-price">¥{{totalPrice / 100}}</text>
    <button class="submit-btn" bindtap="submitOrder">提交订单</button>
  </view>
</view>
```

- [ ] **Step 4: 编写 index.wxss**

```css
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.info-bar {
  padding: 20rpx 30rpx;
  background: #fff;
  font-size: 28rpx;
  color: var(--color-text-light);
}
.cart-list {
  flex: 1;
  padding: 20rpx;
}
.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}
.item-name {
  flex: 1;
  font-size: 28rpx;
}
.item-qty {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-right: 30rpx;
}
.qty-btn {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid var(--color-border);
  text-align: center;
  line-height: 44rpx;
  font-size: 32rpx;
}
.qty-num {
  font-size: 28rpx;
  font-weight: bold;
}
.item-subtotal {
  font-size: 28rpx;
  color: var(--color-primary);
}
.remark-section {
  padding: 20rpx 30rpx;
  background: #fff;
}
.section-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  display: block;
}
.remark-input {
  width: 100%;
  height: 120rpx;
  background: var(--color-bg);
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
.bottom-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 2rpx solid var(--color-border);
}
.total-label { font-size: 28rpx; }
.total-price {
  flex: 1;
  font-size: 36rpx;
  color: var(--color-primary);
  font-weight: bold;
}
.submit-btn {
  background: var(--color-primary);
  color: #fff;
  border-radius: 32rpx;
  padding: 20rpx 48rpx;
  font-size: 28rpx;
  border: none;
}
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: cart page with quantity controls, remark, order submission"
```

---

### Task 7: 订单状态页

**Files:**
- Create: `miniprogram/pages/order/index.json`
- Create: `miniprogram/pages/order/index.ts`
- Create: `miniprogram/pages/order/index.wxml`
- Create: `miniprogram/pages/order/index.wxss`

- [ ] **Step 1: 创建 index.json**

```json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 编写 index.ts**

```ts
import { callFunction } from '../../utils/cloud'

const STATUS_MAP: Record<string, string> = {
  pending: '待接单',
  accepted: '已接单',
  served: '已上菜',
  completed: '已完成',
}

Component({
  data: {
    orderId: '',
    order: null as any,
    statusText: '',
    pollingTimer: 0,
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const options = (pages[pages.length - 1] as any).options || {}
      this.setData({ orderId: options.orderId || '' })
      this.fetchOrder()
      this.startPolling()
    },
    detached() {
      if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
    },
  },
  methods: {
    async fetchOrder() {
      try {
        const order = await callFunction('getOrder', { orderId: this.data.orderId })
        this.setData({
          order,
          statusText: STATUS_MAP[order.status] || order.status,
        })
        if (order.status === 'completed') {
          if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
        }
      } catch (e) { /* ignore poll errors */ }
    },
    startPolling() {
      const timer = setInterval(() => this.fetchOrder(), 5000)
      this.setData({ pollingTimer: timer as any })
    },
  },
})
```

- [ ] **Step 3: 编写 index.wxml**

```xml
<navigation-bar title="订单状态" back="{{false}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <block wx:if="{{order}}">
    <view class="status-card">
      <text class="status-label">{{statusText}}</text>
      <view class="progress">
        <view class="progress-step {{order.status === 'pending' ? 'active' : ''}}">1</view>
        <view class="progress-line {{order.status !== 'pending' ? 'active' : ''}}"></view>
        <view class="progress-step {{order.status === 'accepted' ? 'active' : ''}}">2</view>
        <view class="progress-line {{order.status === 'served' || order.status === 'completed' ? 'active' : ''}}"></view>
        <view class="progress-step {{order.status === 'served' ? 'active' : ''}}">3</view>
      </view>
      <view class="progress-labels">
        <text>待接单</text>
        <text>已接单</text>
        <text>已上菜</text>
      </view>
    </view>
    <view class="order-detail">
      <text class="detail-title">订单详情</text>
      <view wx:for="{{order.items}}" wx:key="dishId" class="order-item">
        <text>{{item.name}}</text>
        <text>x{{item.count}}</text>
        <text>¥{{item.price * item.count / 100}}</text>
      </view>
      <view class="order-total">
        <text>合计：¥{{order.totalPrice / 100}}</text>
      </view>
      <text class="order-remark" wx:if="{{order.remark}}">备注：{{order.remark}}</text>
    </view>
  </block>
</view>
```

- [ ] **Step 4: 编写 index.wxss**

```css
.page {
  padding: 30rpx;
}
.status-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  text-align: center;
}
.status-label {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-primary);
  display: block;
  margin-bottom: 40rpx;
}
.progress, .progress-labels {
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-step {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--color-border);
  color: #999;
  font-size: 24rpx;
  text-align: center;
  line-height: 48rpx;
}
.progress-step.active {
  background: var(--color-primary);
  color: #fff;
}
.progress-line {
  width: 80rpx;
  height: 4rpx;
  background: var(--color-border);
}
.progress-line.active {
  background: var(--color-primary);
}
.progress-labels {
  margin-top: 16rpx;
}
.progress-labels text {
  flex: 1;
  font-size: 22rpx;
  color: var(--color-text-light);
}
.order-detail {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}
.detail-title {
  font-size: 30rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}
.order-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 28rpx;
}
.order-total {
  text-align: right;
  font-size: 32rpx;
  font-weight: bold;
  padding-top: 20rpx;
  border-top: 2rpx solid var(--color-border);
  margin-top: 10rpx;
}
.order-remark {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  color: var(--color-text-light);
}
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: order status page with progress tracker and 5s polling"
```

---

### Task 8: 商家登录页

**Files:**
- Create: `miniprogram/pages/merchant/dashboard/index.json`
- Create: `miniprogram/pages/merchant/dashboard/index.ts`
- Create: `miniprogram/pages/merchant/dashboard/index.wxml`
- Create: `miniprogram/pages/merchant/dashboard/index.wxss`

- [ ] **Step 1: 创建商家面板页（含密码验证）**

```json
// pages/merchant/dashboard/index.json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

```ts
// pages/merchant/dashboard/index.ts
import { callFunction } from '../../../utils/cloud'

const app = getApp<IAppOption>()

Component({
  data: {
    isLoggedIn: false,
    password: '',
    orders: [] as any[],
    pollingTimer: 0,
  },
  lifetimes: {
    attached() {
      if (app.globalData.isMerchant) {
        this.setData({ isLoggedIn: true })
        this.loadOrders()
        this.startPolling()
      }
    },
    detached() {
      if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
    },
  },
  methods: {
    onPasswordInput(e: any) {
      this.setData({ password: e.detail.value })
    },
    login() {
      // 简单密码校验：默认 'admin123'
      if (this.data.password === 'admin123') {
        app.globalData.isMerchant = true
        this.setData({ isLoggedIn: true })
        this.loadOrders()
        this.startPolling()
      } else {
        wx.showToast({ title: '密码错误', icon: 'none' })
      }
    },
    async loadOrders() {
      const orders = await callFunction('orderManage', { action: 'list', data: { status: 'pending' } })
      this.setData({ orders })
    },
    startPolling() {
      const timer = setInterval(() => this.loadOrders(), 10000)
      this.setData({ pollingTimer: timer as any })
    },
    async acceptOrder(e: any) {
      const id = e.currentTarget.dataset.id
      await callFunction('orderManage', { action: 'updateStatus', data: { _id: id, status: 'accepted' } })
      this.loadOrders()
    },
    goOrders() {
      wx.navigateTo({ url: '/pages/merchant/orders/index' })
    },
    goDishes() {
      wx.navigateTo({ url: '/pages/merchant/dishes/index' })
    },
    getStatusLabel(status: string) {
      const map: Record<string, string> = { pending: '待接单', accepted: '已接单', served: '已上菜', completed: '已完成' }
      return map[status] || status
    },
  },
})
```

```xml
<!-- pages/merchant/dashboard/index.wxml -->
<navigation-bar title="商家面板" back="{{isLoggedIn ? false : true}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <!-- 密码输入 -->
  <view class="login-box" wx:if="{{!isLoggedIn}}">
    <text class="login-title">商家登录</text>
    <input class="pwd-input" type="password" placeholder="请输入管理密码" value="{{password}}" bindinput="onPasswordInput" />
    <button class="btn-primary" bindtap="login">进入管理面板</button>
  </view>
  <!-- 面板内容 -->
  <block wx:else>
    <view class="tab-bar">
      <text class="tab active">新订单</text>
      <text class="tab" bindtap="goOrders">全部订单</text>
      <text class="tab" bindtap="goDishes">菜品管理</text>
    </view>
    <view class="order-list">
      <view wx:if="{{orders.length === 0}}" class="empty">暂无新订单</view>
      <view wx:for="{{orders}}" wx:key="_id" class="order-card">
        <view class="order-header">
          <text class="order-table">{{item.tableNo}}号桌</text>
          <text class="order-status pending">{{getStatusLabel(item.status)}}</text>
        </view>
        <view wx:for="{{item.items}}" wx:for-item="i" wx:key="dishId" class="order-item">
          <text>{{i.name}} x{{i.count}}</text>
        </view>
        <view class="order-footer">
          <text class="order-total">¥{{item.totalPrice / 100}}</text>
          <button class="accept-btn" data-id="{{item._id}}" bindtap="acceptOrder">接单</button>
        </view>
      </view>
    </view>
  </block>
</view>
```

```css
/* pages/merchant/dashboard/index.wxss */
.page { padding: 30rpx; }
.login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}
.login-title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 60rpx;
}
.pwd-input {
  width: 100%;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  margin-bottom: 40rpx;
}
.btn-primary {
  width: 100%;
  background: var(--color-primary);
  color: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  text-align: center;
  border: none;
}
.tab-bar {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 30rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 26rpx;
  color: var(--color-text-light);
  border-radius: 12rpx;
}
.tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: bold;
}
.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.order-table {
  font-size: 32rpx;
  font-weight: bold;
}
.order-status.pending { color: var(--color-primary); font-size: 26rpx; }
.order-item {
  padding: 8rpx 0;
  font-size: 28rpx;
}
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 2rpx solid var(--color-border);
  margin-top: 10rpx;
}
.order-total { font-size: 32rpx; font-weight: bold; }
.accept-btn {
  background: var(--color-primary);
  color: #fff;
  border-radius: 32rpx;
  padding: 16rpx 40rpx;
  font-size: 26rpx;
  border: none;
}
.empty {
  text-align: center;
  color: var(--color-text-light);
  padding: 100rpx 0;
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: merchant dashboard with login, pending orders list, accept action"
```

---

### Task 9: 商家订单管理页

**Files:**
- Create: `miniprogram/pages/merchant/orders/index.json`
- Create: `miniprogram/pages/merchant/orders/index.ts`
- Create: `miniprogram/pages/merchant/orders/index.wxml`
- Create: `miniprogram/pages/merchant/orders/index.wxss`

- [ ] **Step 1: 创建全部订单管理页**

```json
// pages/merchant/orders/index.json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

```ts
// pages/merchant/orders/index.ts
import { callFunction } from '../../../utils/cloud'

const STATUS_TABS = [
  { key: 'pending', label: '待接单' },
  { key: 'accepted', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: '待接单', accepted: '已接单', served: '已上菜', completed: '已完成',
}

Component({
  data: {
    tabs: STATUS_TABS,
    activeTab: 'pending',
    orders: [] as any[],
  },
  lifetimes: {
    attached() { this.loadOrders() },
  },
  methods: {
    async loadOrders() {
      const { activeTab } = this.data
      const filter: any = { status: activeTab }
      if (activeTab === 'accepted') {
        // 进行中包含 accepted 和 served
        delete filter.status
      }
      const orders = await callFunction('orderManage', {
        action: 'list',
        data: activeTab === 'accepted' ? {} : { status: activeTab },
      })
      // 进行中过滤掉 pending 和 completed
      const filtered = activeTab === 'accepted'
        ? orders.filter((o: any) => o.status === 'accepted' || o.status === 'served')
        : orders
      this.setData({ orders: filtered })
    },
    switchTab(e: any) {
      this.setData({ activeTab: e.currentTarget.dataset.key })
      this.loadOrders()
    },
    async changeStatus(e: any) {
      const { id, status } = e.currentTarget.dataset
      await callFunction('orderManage', { action: 'updateStatus', data: { _id: id, status } })
      this.loadOrders()
    },
    getLabel(s: string) { return STATUS_LABEL[s] || s },
  },
})
```

```xml
<!-- pages/merchant/orders/index.wxml -->
<navigation-bar title="订单管理" back="{{true}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <view class="tab-bar">
    <view
      wx:for="{{tabs}}"
      wx:key="key"
      class="tab {{activeTab === item.key ? 'active' : ''}}"
      data-key="{{item.key}}"
      bindtap="switchTab"
    >{{item.label}}</view>
  </view>
  <view class="order-list">
    <view wx:for="{{orders}}" wx:key="_id" class="order-card">
      <view class="order-header">
        <text class="order-table">{{item.tableNo}}号桌</text>
        <text class="order-status">{{getLabel(item.status)}}</text>
      </view>
      <view wx:for="{{item.items}}" wx:for-item="i" wx:key="dishId" class="order-item">
        <text>{{i.name}} x{{i.count}}</text>
      </view>
      <view class="order-footer">
        <text class="order-total">¥{{item.totalPrice / 100}}</text>
        <view class="actions">
          <button
            wx:if="{{item.status === 'pending'}}"
            class="act-btn primary"
            data-id="{{item._id}}"
            data-status="accepted"
            bindtap="changeStatus"
          >接单</button>
          <button
            wx:if="{{item.status === 'accepted'}}"
            class="act-btn"
            data-id="{{item._id}}"
            data-status="served"
            bindtap="changeStatus"
          >上菜</button>
          <button
            wx:if="{{item.status === 'served'}}"
            class="act-btn"
            data-id="{{item._id}}"
            data-status="completed"
            bindtap="changeStatus"
          >完成</button>
        </view>
      </view>
    </view>
    <view wx:if="{{orders.length === 0}}" class="empty">暂无订单</view>
  </view>
</view>
```

```css
/* pages/merchant/orders/index.wxss */
.page { padding: 30rpx; }
.tab-bar {
  display: flex;
  margin-bottom: 30rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 28rpx;
  background: #fff;
  border-bottom: 4rpx solid transparent;
}
.tab.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: bold;
}
.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.order-table { font-size: 32rpx; font-weight: bold; }
.order-status { font-size: 26rpx; color: var(--color-primary); }
.order-item { padding: 8rpx 0; font-size: 28rpx; }
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 2rpx solid var(--color-border);
  margin-top: 10rpx;
}
.order-total { font-size: 32rpx; font-weight: bold; }
.actions { display: flex; gap: 16rpx; }
.act-btn {
  padding: 14rpx 32rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  border: 2rpx solid var(--color-border);
  background: #fff;
}
.act-btn.primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.empty {
  text-align: center;
  color: var(--color-text-light);
  padding: 100rpx 0;
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: merchant order management with status tabs and flow actions"
```

---

### Task 10: 商家菜品管理页

**Files:**
- Create: `miniprogram/pages/merchant/dishes/index.json`
- Create: `miniprogram/pages/merchant/dishes/index.ts`
- Create: `miniprogram/pages/merchant/dishes/index.wxml`
- Create: `miniprogram/pages/merchant/dishes/index.wxss`

- [ ] **Step 1: 创建菜品管理页**

```json
// pages/merchant/dishes/index.json
{
  "usingComponents": {
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  },
  "navigationStyle": "custom"
}
```

```ts
// pages/merchant/dishes/index.ts
import { callFunction } from '../../../utils/cloud'

Component({
  data: {
    categories: [] as any[],
    dishes: [] as any[],
    activeCategoryId: '',
    showDishForm: false,
    showCategoryForm: false,
    editingDish: null as any,
    editingCategory: null as any,
    dishForm: { name: '', price: '', description: '', image: '', categoryId: '' },
    categoryForm: { name: '' },
  },
  lifetimes: {
    attached() { this.loadData() },
  },
  methods: {
    async loadData() {
      const categories = await callFunction('categoryManage', { action: 'list' })
      const dishes = await callFunction('dishManage', { action: 'list' })
      this.setData({
        categories,
        dishes,
        activeCategoryId: categories[0]?._id || '',
      })
    },
    switchCategory(e: any) {
      this.setData({ activeCategoryId: e.currentTarget.dataset.id })
    },
    // 菜品操作
    addDish() {
      this.setData({
        showDishForm: true,
        editingDish: null,
        dishForm: { name: '', price: '', description: '', image: '', categoryId: this.data.activeCategoryId },
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
          image: dish.image || '',
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
        image: dishForm.image,
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
      const res = await new Promise(r => wx.showModal({ title: '确认删除', success: r }))
      if (!res.confirm) return
      await callFunction('dishManage', { action: 'delete', data: { _id: e.currentTarget.dataset.id } })
      this.loadData()
    },
    onDishFieldChange(e: any) {
      const { field } = e.currentTarget.dataset
      this.setData({ [`dishForm.${field}`]: e.detail.value })
    },
    // 分类操作
    showAddCategory() {
      this.setData({ showCategoryForm: true, editingCategory: null, categoryForm: { name: '' } })
    },
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
      const res = await new Promise(r => wx.showModal({ title: '确认删除', success: r }))
      if (!res.confirm) return
      await callFunction('categoryManage', { action: 'delete', data: { _id: e.currentTarget.dataset.id } })
      this.loadData()
    },
    onCategoryFieldChange(e: any) {
      this.setData({ ['categoryForm.name']: e.detail.value })
    },
  },
})
```

```xml
<!-- pages/merchant/dishes/index.wxml -->
<navigation-bar title="菜品管理" back="{{true}}" color="black" background="#FFF"></navigation-bar>
<view class="page">
  <!-- 分类行 -->
  <scroll-view class="category-bar" scroll-x>
    <view
      wx:for="{{categories}}"
      wx:key="_id"
      class="cat-tab {{activeCategoryId === item._id ? 'active' : ''}}"
      data-id="{{item._id}}"
      bindtap="switchCategory"
    >{{item.name}}</view>
    <view class="cat-tab add" bindtap="showAddCategory">+分类</view>
  </scroll-view>
  <!-- 菜品列表 -->
  <scroll-view class="dish-list" scroll-y>
    <view wx:for="{{dishes}}" wx:key="_id" wx:if="{{item.categoryId === activeCategoryId}}" class="dish-row">
      <text class="dish-name">{{item.name}}</text>
      <text class="dish-price">¥{{item.price / 100}}</text>
      <text class="dish-status {{item.isAvailable ? '' : 'off'}}">{{item.isAvailable ? '上架' : '下架'}}</text>
      <view class="row-actions">
        <text data-id="{{item._id}}" bindtap="editDish">编辑</text>
        <text data-id="{{item._id}}" bindtap="toggleDish">{{item.isAvailable ? '下架' : '上架'}}</text>
        <text data-id="{{item._id}}" bindtap="deleteDish">删除</text>
      </view>
    </view>
    <view class="add-dish-btn" bindtap="addDish">+ 添加菜品</view>
  </scroll-view>
  <!-- 分类编辑弹窗 -->
  <view class="modal" wx:if="{{showCategoryForm}}">
    <view class="modal-content">
      <text class="modal-title">{{editingCategory ? '编辑分类' : '新增分类'}}</text>
      <input class="modal-input" placeholder="分类名称" value="{{categoryForm.name}}" bindinput="onCategoryFieldChange" />
      <view class="modal-btns">
        <button class="modal-btn cancel" bindtap="hideCategoryForm">取消</button>
        <button class="modal-btn confirm" bindtap="saveCategory">保存</button>
      </view>
    </view>
  </view>
  <!-- 菜品编辑弹窗 -->
  <view class="modal" wx:if="{{showDishForm}}">
    <view class="modal-content">
      <text class="modal-title">{{editingDish ? '编辑菜品' : '新增菜品'}}</text>
      <input class="modal-input" placeholder="菜名" data-field="name" value="{{dishForm.name}}" bindinput="onDishFieldChange" />
      <input class="modal-input" placeholder="价格（元）" type="digit" data-field="price" value="{{dishForm.price}}" bindinput="onDishFieldChange" />
      <input class="modal-input" placeholder="简介" data-field="description" value="{{dishForm.description}}" bindinput="onDishFieldChange" />
      <view class="modal-btns">
        <button class="modal-btn cancel" bindtap="hideDishForm">取消</button>
        <button class="modal-btn confirm" bindtap="saveDish">保存</button>
      </view>
    </view>
  </view>
  <view class="modal-mask" wx:if="{{showCategoryForm || showDishForm}}" bindtap="hideModals"></view>
</view>
```

```css
/* pages/merchant/dishes/index.wxss */
.page { height: 100vh; display: flex; flex-direction: column; }
.category-bar {
  white-space: nowrap;
  padding: 10rpx 20rpx;
  background: #fff;
  flex-shrink: 0;
}
.cat-tab {
  display: inline-block;
  padding: 16rpx 28rpx;
  font-size: 26rpx;
  color: var(--color-text-light);
}
.cat-tab.active { color: var(--color-primary); font-weight: bold; }
.cat-tab.add { color: var(--color-primary); }
.dish-list { flex: 1; padding: 20rpx; }
.dish-row {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  gap: 16rpx;
}
.dish-name { flex: 1; font-size: 28rpx; }
.dish-price { font-size: 28rpx; }
.dish-status { font-size: 22rpx; color: #4caf50; }
.dish-status.off { color: var(--color-text-light); }
.row-actions { display: flex; gap: 16rpx; }
.row-actions text { font-size: 22rpx; color: var(--color-primary); }
.add-dish-btn {
  text-align: center;
  padding: 30rpx;
  color: var(--color-primary);
  font-size: 28rpx;
  border: 2rpx dashed var(--color-primary);
  border-radius: 12rpx;
}
.modal-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
}
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: 600rpx;
}
.modal-content {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}
.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
}
.modal-input {
  width: 100%;
  padding: 20rpx;
  background: var(--color-bg);
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}
.modal-btns {
  display: flex;
  gap: 20rpx;
}
.modal-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  border: none;
}
.modal-btn.cancel { background: var(--color-bg); }
.modal-btn.confirm { background: var(--color-primary); color: #fff; }
```

- [ ] **Step 2: 补充 hideModals 和 hideDishForm、hideCategoryForm 方法**

在 dishes/index.ts 的 methods 中补充：

```ts
hideDishForm() {
  this.setData({ showDishForm: false })
},
hideCategoryForm() {
  this.setData({ showCategoryForm: false })
},
hideModals() {
  this.setData({ showDishForm: false, showCategoryForm: false })
},
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: merchant dish management with category CRUD and dish CRUD"
```

---

### Task 11: 集成连通 — 页面跳转与数据流

**Files:**
- Modify: `miniprogram/pages/index/index.ts`
- Modify: `miniprogram/pages/menu/index.ts`
- Modify: `miniprogram/pages/cart/index.ts`
- Modify: `miniprogram/pages/merchant/dashboard/index.ts`

- [ ] **Step 1: 删除旧 logs 页面引用**

从 `miniprogram/app.json` 的 pages 数组中移除 `"pages/logs/logs"`。

- [ ] **Step 2: 统一导航流**

确认跳转链：
- 首页扫码带桌号 → `redirectTo menu`（已实现）
- 首页选桌号 → `navigateTo menu`（已实现）
- 菜单页点购物车 → `navigateTo cart`
- 购物车提交成功 → `redirectTo order?orderId=xxx`
- 订单完成 → 返回首页 `redirectTo index`（在 order 页 polling 到 completed 时处理）
- 商家入口 → `navigateTo merchant/dashboard`
- 商家面板标签 → `navigateTo merchant/orders`、`navigateTo merchant/dishes`

- [ ] **Step 3: 修复 cart 页缺少 tableNo 数据**

在 `pages/cart/index.ts` 的 data 中添加：

```ts
data: {
  cart: [] as CartItem[],
  totalPrice: 0,
  remark: '',
  tableNo: app.globalData.tableNo,
},
```

- [ ] **Step 4: 确认云函数环境 ID**

在 `miniprogram/app.ts` 中将 `envId: 'your-env-id'` 替换为实际的云环境 ID。

- [ ] **Step 5: 在开发者工具中走通全流程**

1. 打开首页，选择桌号 → 进入菜单
2. 点加号添加菜品 → 底部显示数量和价格
3. 点击「去下单」→ 进入购物车，调整数量，填写备注
4. 提交订单 → 跳转订单状态页，显示进度条
5. 返回首页 → 点击「商家入口」→ 输入密码 admin123
6. 在商家面板看到新订单 → 点击「接单」
7. 切换到「全部订单」→ 点击「上菜」→ 点击「完成」
8. 切回顾客端订单页，确认状态已更新到「已完成」

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: integrate page navigation flow and fix wiring issues"
```

---

### Task 12: 数据库初始化与部署

- [ ] **Step 1: 在微信开发者工具中开通云开发**

1. 点击工具栏「云开发」按钮
2. 创建环境（名称随意，如 `dev`）
3. 复制环境 ID，替换 `app.ts` 中的 `your-env-id`
4. 在云开发控制台创建 4 个集合：`categories`、`dishes`、`orders`、`settings`
5. 权限设置：所有集合设为「仅创建者可读写」（云函数会绕过此限制）

- [ ] **Step 2: 添加初始化数据**

在云开发控制台数据库中手动添加：

```json
// categories 集合
{ "name": "热菜", "sort": 1 }
{ "name": "凉菜", "sort": 2 }
{ "name": "主食", "sort": 3 }
{ "name": "饮品", "sort": 4 }

// dishes 集合（示例）
{ "name": "宫保鸡丁", "categoryId": "<category-id>", "price": 3200, "isAvailable": true, "sort": 1 }
{ "name": "麻婆豆腐", "categoryId": "<category-id>", "price": 2200, "isAvailable": true, "sort": 2 }
```

- [ ] **Step 3: 上传所有云函数**

在开发者工具中，依次右键每个云函数目录 →「上传并部署：云端安装依赖」。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: database setup and cloud function deployment"
```

---
