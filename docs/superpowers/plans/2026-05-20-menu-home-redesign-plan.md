# 菜单页 & 首页视觉升级 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一首页与菜单页深色视觉风格，首页展示招牌大图，菜单页新增品牌 Hero。

**Architecture:** 纯前端视觉改动，不涉及云函数和数据库。首页 WXML/WXSS 重写，菜单页新增 Hero 区块。数据来源 `config/shop.ts`。

**Tech Stack:** 微信小程序原生 WXML/WXSS/TypeScript

---

### Task 1: 首页 WXML 重构

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`

- [ ] **Step 1: 替换首页模板为新布局**

将 `miniprogram/pages/index/index.wxml` 内容替换为：

```xml
<navigation-bar title="" back="{{false}}" color="white" background="transparent"></navigation-bar>
<view class="page">
  <image wx:if="{{shop.background}}" class="hero-img" src="{{shop.background}}" mode="aspectFill" />
  <view class="hero-placeholder" wx:else></view>

  <view class="body">
    <view class="brand">
      <text class="shop-name" bindtap="onHeroTap">{{shop.name}}</text>
      <text class="shop-slogan">{{shop.slogan}}</text>
    </view>

    <view class="info-list">
      <view class="info-row" wx:if="{{shop.hours}}">
        <text class="info-icon">🕐</text>
        <text class="info-text">{{shop.hours}}</text>
      </view>
      <view class="info-divider"></view>
      <view class="info-row" wx:if="{{shop.address}}">
        <text class="info-icon">📍</text>
        <text class="info-text">{{shop.address}}</text>
      </view>
    </view>

    <view class="actions">
      <button wx:if="{{currentOrderId}}" class="btn-order" bindtap="goMyOrder">查看我的订单</button>
      <button class="btn-primary" bindtap="goMenu">开始点餐</button>
    </view>

    <text class="footer" wx:if="{{shop.footer}}">{{shop.footer}}</text>
  </view>
</view>

<view class="modal-mask" wx:if="{{showProfile}}"></view>
<view class="profile-modal" wx:if="{{showProfile}}">
  <text class="profile-title">完善信息</text>
  <text class="profile-desc">让商家知道你是谁～</text>
  <button class="avatar-btn" open-type="chooseAvatar" bindchooseavatar="onChooseAvatar">
    <image wx:if="{{profileAvatarUrl}}" class="avatar-preview" src="{{profileAvatarUrl}}" mode="aspectFill" />
    <view wx:else class="avatar-placeholder">📷</view>
    <text class="avatar-hint">点击设置头像</text>
  </button>
  <input class="nickname-input" type="nickname" value="{{profileNickName}}" placeholder="请输入你的昵称" bindinput="onNickNameInput" maxlength="20" />
  <button class="btn-primary" bindtap="saveProfile">保存并开始点餐</button>
</view>
```

- [ ] **Step 2: 提交**

```bash
git add miniprogram/pages/index/index.wxml
git commit -m "style: 首页布局重构为深色大图风格"
```

---

### Task 2: 首页 WXSS 重写

**Files:**
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] **Step 1: 替换首页样式**

将 `miniprogram/pages/index/index.wxss` 内容替换为：

```css
.page {
  min-height: 100vh;
  background: #2c2416;
}

/* 招牌大图 */
.hero-img {
  width: 100%;
  height: 560rpx;
  display: block;
}
.hero-placeholder {
  width: 100%;
  height: 560rpx;
  background: linear-gradient(135deg, #5a4a3a, #4a3a2a, #3a2f28);
}

/* 内容区 */
.body {
  padding: 56rpx 40rpx 0;
}

/* 品牌 */
.brand {
  margin-bottom: 40rpx;
}
.shop-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 8rpx;
}
.shop-slogan {
  display: block;
  font-size: 26rpx;
  color: #b8a082;
  letter-spacing: 4rpx;
  margin-top: 12rpx;
}

/* 营业信息列表 */
.info-list {
  margin-bottom: 60rpx;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 0;
}
.info-icon {
  font-size: 36rpx;
}
.info-text {
  font-size: 26rpx;
  color: #b8a082;
}
.info-divider {
  height: 1rpx;
  background: rgba(255, 255, 255, 0.06);
}

/* 按钮 */
.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 32rpx;
}
.actions button {
  font-size: 32rpx;
  text-align: center;
  padding: 28rpx;
  border: none;
}
.btn-primary {
  background: linear-gradient(135deg, #e6532e 0%, #d4421e 100%);
  color: #fff;
  border-radius: 100rpx;
  box-shadow: 0 12rpx 32rpx rgba(230, 83, 46, 0.3);
  margin-bottom: 24rpx;
  font-weight: 500;
  letter-spacing: 4rpx;
}
.btn-order {
  background: rgba(255, 255, 255, 0.06);
  color: #b8a082;
  font-size: 28rpx;
  padding: 20rpx;
  margin-bottom: 8rpx;
  border-radius: 100rpx;
}

/* 页脚 */
.footer {
  display: block;
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
  font-size: 22rpx;
  letter-spacing: 2rpx;
  padding: 48rpx 0 calc(48rpx + env(safe-area-inset-bottom));
}

/* 资料弹窗保持不变 */
.modal-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
}
.profile-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 560rpx;
  background: #fff;
  border-radius: 28rpx;
  padding: 48rpx 40rpx 40rpx;
  z-index: 101;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #2c2416;
  margin-bottom: 8rpx;
}
.profile-desc {
  font-size: 24rpx;
  color: #b8a082;
  margin-bottom: 32rpx;
}
.avatar-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #f8f4ed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-bottom: 24rpx;
  border: none;
}
.avatar-btn::after { border: none; }
.avatar-preview {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
}
.avatar-placeholder {
  font-size: 48rpx;
  margin-bottom: 4rpx;
}
.avatar-hint {
  font-size: 20rpx;
  color: #b8a082;
}
.nickname-input {
  width: 100%;
  height: 80rpx;
  background: #f8f4ed;
  border-radius: 16rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  text-align: center;
  color: #2c2416;
  margin-bottom: 32rpx;
}
.profile-modal .btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #e6532e 0%, #d4421e 100%);
  color: #fff;
  border-radius: 100rpx;
  box-shadow: 0 10rpx 28rpx rgba(230, 83, 46, 0.25);
}
```

- [ ] **Step 2: 提交**

```bash
git add miniprogram/pages/index/index.wxss
git commit -m "style: 首页样式改为深色主题"
```

---

### Task 3: 菜单页新增 Hero 区域

**Files:**
- Modify: `miniprogram/pages/menu/index.wxml`
- Modify: `miniprogram/pages/menu/index.ts`
- Modify: `miniprogram/pages/menu/index.wxss`

- [ ] **Step 1: 菜单页 TS 引入 shop 配置**

在 `miniprogram/pages/menu/index.ts` 顶部 import 区添加：

```typescript
import shop from '../../config/shop'
```

并在 Component 的 data 中添加 shop：

找到 `data: {` 区块，在开头加入：

```typescript
  data: {
    shop,
```

- [ ] **Step 2: 菜单页 WXML 在导航栏下方、分类栏上方插入 Hero**

在 `miniprogram/pages/menu/index.wxml` 中，`<view class="page">` 内部最前面插入 Hero 区块。最终文件变为：

```xml
<wxs module="priceUtil" src="./price.wxs" />
<navigation-bar title="菜单" back="{{true}}" color="white" background="transparent"></navigation-bar>
<view class="page">
  <view class="menu-hero">
    <view class="menu-hero-inner">
      <text class="menu-hero-name">{{shop.name}}</text>
      <text class="menu-hero-slogan">{{shop.slogan}}</text>
    </view>
  </view>
  <scroll-view class="category-bar" scroll-x>
    <view
      wx:for="{{categories}}"
      wx:key="_id"
      class="category-tab {{activeCategoryId === item._id ? 'active' : ''}}"
      data-id="{{item._id}}"
      bindtap="switchCategory"
    >{{item.name}}</view>
  </scroll-view>
  <scroll-view class="dish-list {{cartCount > 0 ? 'has-cart' : ''}}" scroll-y>
    <view wx:for="{{dishes}}" wx:key="_id" wx:if="{{item.categoryId === activeCategoryId}}" class="dish-card" data-id="{{item._id}}" bindtap="onTapDish">
      <image wx:if="{{item.thumbImage}}" class="dish-img" src="{{item.thumbImage}}" mode="aspectFill" />
      <view class="dish-info">
        <text class="dish-name">{{item.name}}</text>
        <text class="dish-desc" wx:if="{{item.description}}">{{item.description}}</text>
        <view class="dish-bottom">
          <text class="dish-price">¥{{priceUtil.format(item.price)}}</text>
          <view class="add-btn" data-id="{{item._id}}" data-name="{{item.name}}" data-price="{{item.price}}" catch:tap="addToCart">+</view>
        </view>
      </view>
    </view>
  </scroll-view>
  <view class="detail-mask" wx:if="{{showDetail}}" bindtap="onCloseDetail"></view>
  <view class="detail-popup" wx:if="{{showDetail}}">
    <view class="detail-inner">
    <swiper wx:if="{{detailDish.images.length > 0}}" class="detail-swiper" indicator-dots="{{detailDish.images.length > 1}}" indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#fff" bindchange="onSwiperChange" bindtap="onPreviewImage">
      <swiper-item wx:for="{{detailDish.images}}" wx:key="*this">
        <image class="detail-img" src="{{item}}" mode="aspectFill" />
      </swiper-item>
    </swiper>
    <view class="detail-img-hint" wx:if="{{detailDish.images.length > 0}}">点击图片查看大图</view>
    <view class="detail-body">
      <text class="detail-name">{{detailDish.name}}</text>
      <text class="detail-price">¥{{priceUtil.format(detailDish.price)}}</text>
      <text class="detail-desc" wx:if="{{detailDish.description}}">{{detailDish.description}}</text>
      <view class="detail-btns">
        <button class="detail-close" bindtap="onCloseDetail">返回</button>
        <button class="detail-add" bindtap="addFromDetail">加入购物车</button>
      </view>
    </view>
    </view>
  </view>
  <view class="cart-bar" wx:if="{{cartCount > 0}}" bindtap="goCart">
    <view class="cart-info">
      <text class="cart-count">{{cartCount}}</text>
      <text class="cart-price">¥{{priceUtil.format(cartTotal)}}</text>
    </view>
    <text class="cart-action">去下单</text>
  </view>
</view>
```

- [ ] **Step 3: 菜单页 WXSS 添加 Hero 样式**

在 `miniprogram/pages/menu/index.wxss` 顶部、`.page` 之前插入：

```css
.menu-hero {
  background: linear-gradient(135deg, #3a2f28 0%, #2c2416 100%);
  position: relative;
  overflow: hidden;
}
.menu-hero::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(230, 83, 46, 0.08) 0%, transparent 70%);
  pointer-events: none;
}
.menu-hero-inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 48rpx 40rpx;
}
.menu-hero-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 8rpx;
}
.menu-hero-slogan {
  display: block;
  font-size: 24rpx;
  color: #b8a082;
  margin-top: 8rpx;
  letter-spacing: 4rpx;
}
```

- [ ] **Step 4: 更新导航栏颜色**

菜单页导航栏 `color` 从 `"black"` 改为 `"white"`（已在 Step 2 的 WXML 中体现）。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/pages/menu/index.wxml miniprogram/pages/menu/index.ts miniprogram/pages/menu/index.wxss
git commit -m "style: 菜单页新增 Hero 品牌区域"
```

---

### Task 4: 验证与收尾

- [ ] **Step 1: 检查文件完整性**

```bash
git status
```

确认只有预期文件被修改：
- `miniprogram/pages/index/index.wxml`
- `miniprogram/pages/index/index.wxss`
- `miniprogram/pages/menu/index.wxml`
- `miniprogram/pages/menu/index.ts`
- `miniprogram/pages/menu/index.wxss`

- [ ] **Step 2: 确认 TypeScript 无编译错误**

```bash
cd /Users/wangdabao/WeChatProjects/jj-PrivateKitchen && npx tsc --noEmit 2>&1 | head -20 || true
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "chore: 视觉升级收尾验证"
```
