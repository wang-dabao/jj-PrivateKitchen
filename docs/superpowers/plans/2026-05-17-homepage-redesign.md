# 首页 UI 优化 & 品牌配置

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按照方案 B 清新简约风重写首页，新建静态配置常量，支持品牌 Logo 和店铺说明。

**Architecture:** 纯静态方案 — 配置文件存常量，页面 attached 时读取绑定数据。Logo 图放 images 目录，替换即生效。无云函数/数据库依赖。

**Tech Stack:** WeChat Mini Program (TypeScript + WXML + WXSS)

---

### Task 1: 新建店铺静态配置文件

**Files:**
- Create: `miniprogram/config/shop.ts`

- [ ] **Step 1: 写配置文件**

```typescript
// miniprogram/config/shop.ts

/** 店铺品牌配置 — 修改此处即可更新首页展示 */
const shop = {
  /** 店铺名称 */
  name: '姜姜私房菜',
  /** Logo 图片路径（/miniprogram 下的相对路径） */
  logo: '/images/logo.png',
  /** 一句话简介 */
  slogan: '家常味道 · 用心烹制每一餐',
  /** 店铺介绍（2-3 行） */
  description: '严选新鲜食材，现点现做。招牌红烧肉、秘制酱鸭备受好评，用家常味道传递温暖。',
  /** 营业时间 */
  hours: '周一至周日 11:00-21:00',
  /** 店铺地址 */
  address: '',
  /** 页脚文案 */
  footer: '姜姜私房菜',
}

export default shop
```

- [ ] **Step 2: 创建默认 Logo 占位图目录**

```bash
mkdir -p /Users/wangdabao/WeChatProjects/jj-PrivateKitchen/miniprogram/images
```

说明：Logo 图需手动放入 `miniprogram/images/logo.png`，推荐 200x200 以上的正方形 PNG。未放置时将显示 emoji 占位符 🍳。

- [ ] **Step 3: 提交**

```bash
git add miniprogram/config/shop.ts
git commit -m "feat: add static shop config for homepage branding"
```

---

### Task 2: 重写首页 WXML 布局

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`

- [ ] **Step 1: 替换为方案 B 布局**

```xml
<!-- miniprogram/pages/index/index.wxml -->
<navigation-bar title="{{shop.name}}" back="{{false}}" color="black" background="transparent"></navigation-bar>
<view class="page">
  <!-- Logo 区 -->
  <view class="logo-area">
    <image wx:if="{{shop.logo}}" class="logo-img" src="{{shop.logo}}" mode="aspectFill" />
    <view wx:else class="logo-placeholder">🍳</view>
  </view>

  <!-- 店铺信息 -->
  <text class="shop-name">{{shop.name}}</text>
  <text class="shop-slogan">{{shop.slogan}}</text>
  <text class="shop-desc" wx:if="{{shop.description}}">{{shop.description}}</text>

  <!-- 营业信息 -->
  <view class="info-row" wx:if="{{shop.hours || shop.address}}">
    <text wx:if="{{shop.hours}}" class="info-item">🕐 {{shop.hours}}</text>
    <text wx:if="{{shop.address}}" class="info-item">📍 {{shop.address}}</text>
  </view>

  <!-- 按钮区 -->
  <view class="actions">
    <button wx:if="{{currentOrderId}}" class="btn-order" bindtap="goMyOrder">查看我的订单</button>
    <button class="btn-primary" bindtap="openTablePicker">选择桌号开始点餐</button>
  </view>

  <!-- 页脚 -->
  <text class="footer" wx:if="{{shop.footer}}">{{shop.footer}}</text>

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

- [ ] **Step 2: 提交**

```bash
git add miniprogram/pages/index/index.wxml
git commit -m "feat: redesign homepage WXML with brand layout"
```

---

### Task 3: 重写首页 WXSS 样式

**Files:**
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: 替换为方案 B 样式**

```css
/* miniprogram/pages/index/index.wxss */

.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 0;
  min-height: 100vh;
  box-sizing: border-box;
  background: #f9f9f7;
}

/* Logo */
.logo-area {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 32rpx;
}
.logo-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
}
.logo-placeholder {
  font-size: 72rpx;
  line-height: 1;
}

/* 店铺信息 */
.shop-name {
  font-size: 44rpx;
  font-weight: bold;
  color: #333;
  letter-spacing: 4rpx;
  margin-bottom: 12rpx;
}
.shop-slogan {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
}
.shop-desc {
  font-size: 24rpx;
  color: #aaa;
  text-align: center;
  max-width: 560rpx;
  line-height: 1.8;
  margin-bottom: 24rpx;
}

/* 营业信息 */
.info-row {
  display: flex;
  gap: 40rpx;
  margin-bottom: 80rpx;
}
.info-item {
  font-size: 22rpx;
  color: #bbb;
}

/* 按钮 */
.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: auto;
}
.actions button {
  font-size: 32rpx;
  text-align: center;
  padding: 28rpx;
  border: none;
}
.btn-primary {
  background: #e6532e;
  color: #fff;
  border-radius: 100rpx;
  box-shadow: 0 8rpx 24rpx rgba(230, 83, 46, 0.3);
  margin-bottom: 20rpx;
}
.btn-order {
  background: transparent;
  color: #e6532e;
  font-size: 28rpx;
  padding: 20rpx;
  margin-bottom: 8rpx;
}

/* 页脚 */
.footer {
  color: #ddd;
  font-size: 22rpx;
  padding: 48rpx 0 calc(48rpx + env(safe-area-inset-bottom));
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0, 0, 0, 0.5);
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
  margin-bottom: 30rpx;
}
.table-item {
  width: calc(25% - 15rpx);
  margin: 10rpx;
  padding: 24rpx 0;
  text-align: center;
  border: 2rpx solid #eee;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
}
.btn-ghost {
  background: transparent;
  color: #999;
  border: 2rpx solid #eee;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  text-align: center;
}
```

- [ ] **Step 2: 提交**

```bash
git add miniprogram/pages/index/index.wxss
git commit -m "feat: redesign homepage styles with clean minimalist look"
```

---

### Task 4: 更新首页 TS 逻辑集成配置

**Files:**
- Modify: `miniprogram/pages/index/index.ts`

- [ ] **Step 1: 更新 data 和 attached，导入 shop 配置**

```typescript
// miniprogram/pages/index/index.ts
import shop from '../../config/shop'

const app = getApp<IAppOption>()

Component({
  data: {
    shop,
    tableNo: 0,
    showTablePicker: false,
    tableNumbers: Array.from({ length: 1 }, (_, i) => i + 1),
    currentOrderId: '',
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = (currentPage as any).options || {}
      const tableNo = parseInt(options.tableNo) || 0
      if (tableNo > 0) {
        app.globalData.tableNo = tableNo
        this.setData({ tableNo })
        wx.redirectTo({ url: '/pages/menu/index' })
        return
      }
      const orderId = wx.getStorageSync('currentOrderId')
      if (orderId) this.setData({ currentOrderId: orderId })
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
    onHeroTap() {
      const count = (this as any)._heroTapCount || 0
      if (count >= 4) {
        (this as any)._heroTapCount = 0
        wx.navigateTo({ url: '/pages/merchant/dashboard/index' })
      } else {
        (this as any)._heroTapCount = count + 1
      }
    },
    goMyOrder() {
      wx.navigateTo({ url: `/pages/order/index?orderId=${this.data.currentOrderId}` })
    },
  },
})
```

注意：保留了 `onHeroTap` 方法（但 WXML 中无直接绑定入口 — 商家入口通过点击 Logo 区域 5 次触发）。需在 WXML 的 `.logo-area` 上添加 `bindtap="onHeroTap"`。

- [ ] **Step 2: 回到 WXML，在 logo-area 上加 onHeroTap 绑定**

在 `index.wxml` 中将 `<view class="logo-area">` 改为：
```xml
<view class="logo-area" bindtap="onHeroTap">
```

- [ ] **Step 3: 提交**

```bash
git add miniprogram/pages/index/index.ts miniprogram/pages/index/index.wxml
git commit -m "feat: connect homepage to shop config, wire hidden merchant tap"
```

---

### Task 5: 验证编译

- [ ] **Step 1: 检查文件完整性**

所有涉及文件：
- `miniprogram/config/shop.ts` — 新建，静态配置
- `miniprogram/pages/index/index.wxml` — 重写，方案 B 布局
- `miniprogram/pages/index/index.wxss` — 重写，方案 B 样式
- `miniprogram/pages/index/index.ts` — 修改，导入 shop.ts

请在微信开发者工具中编译验证，确认：
1. 首页正确展示 Logo、店名、描述、营业信息
2. 「选择桌号开始点餐」按钮可点击进入桌号选择弹窗
3. 选桌号后正常进入菜单页
4. 扫码传 tableNo 参数正常跳转
5. 有 currentOrderId 时显示「查看我的订单」
6. 点击 Logo 区域 5 次触发商家入口
7. 无编译错误、无 UI 错位
