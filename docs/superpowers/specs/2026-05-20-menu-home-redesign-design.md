# 菜单页 & 首页视觉升级

## 目标

丰富菜单页品牌感，统一首页与菜单页视觉风格。深色基调 + 砖红点缀贯穿两页。

## 色彩规范

- 背景深棕: `#2c2416`
- 渐变深棕: `#3a2f28`
- 主色砖红: `#e6532e`
- 辅助暖金: `#b8a082`
- 辅助灰: `rgba(255,255,255,0.06)` 用于分割/卡片

## 首页（miniprogram/pages/index）

### 布局（从上到下）

1. **招牌图** — `shop.background` (/images/logo.png)，宽度 100%，高度约 280px，`mode="aspectFill"` 保持比例裁切
2. **店名 + Slogan** — 居左，深色底上白色字，padding 28rpx
3. **营业信息** — 图标 + 文字列表式：
   - 🕐 周一至周日 10:00-21:00
   - 📍 金桥西棠 · 11号楼 · 二单元 · 902
   - 项之间用半透分割线隔开
4. **「开始点餐」按钮** — 全宽圆角砖红按钮，带阴影
5. **footer** — 居中浅色字

### 行为不变

- 有 tableNo 参数时跳转菜单页
- 有 currentOrderId 时显示「查看我的订单」
- 点击店名 5 次进入商家后台
- 无头像信息时弹出资料完善弹窗

## 菜单页（miniprogram/pages/menu）

### 新增 Hero 区域

- 深色背景（`linear-gradient(135deg, #3a2f28, #2c2416)`）
- 店名 + slogan 居中，字号适中，padding 紧凑（约 24rpx 上下）
- 可选微弱的径向光晕装饰

### 现有区域（不改）

- 分类横栏
- 菜品列表卡片
- 菜品详情弹窗
- 底部购物车栏

## 数据来源

- `miniprogram/config/shop.ts` — name, slogan, background, hours, address, footer
- 首页和菜单页均直接 import 使用

## 不涉及

- 数据库改动
- 云函数改动
- 购物车逻辑改动
- 商家后台改动
