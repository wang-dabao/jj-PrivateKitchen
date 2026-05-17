# 堂食扫码点餐系统 — 设计文档

## 概览

**场景**：堂食顾客扫码点餐，每桌一个码，码中带桌号参数。顾客扫码浏览菜单、下单，商家端接单并流转状态。仅下单不支付。

**技术栈**：微信小程序（Skyline + glass-easel + TypeScript）+ 云开发（云函数 + 云数据库）。

---

## 页面结构（7 页）

### 顾客端（4 页）

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页/扫码入口 | `pages/index/index` | 解析扫码参数中的桌号，无桌号时弹出桌号选择；提供「商家入口」按钮 |
| 菜单页 | `pages/menu/index` | 分类 tab + 菜品列表，可加购、查看购物车 |
| 购物车/下单 | `pages/cart/index` | 确认菜品和数量、填写备注、提交订单 |
| 订单状态 | `pages/order/index` | 实时查看订单状态（pending/accepted/served） |

### 商家端（3 页）

| 页面 | 路径 | 说明 |
|------|------|------|
| 商家面板 | `pages/merchant/dashboard` | 新订单实时列表、今日接单统计 |
| 订单管理 | `pages/merchant/orders` | 全部订单列表，状态流转操作（接单/上菜/完成） |
| 菜品管理 | `pages/merchant/dishes` | 分类增删改 + 菜品增删改及上下架 |

### 角色切换

首页「商家入口」按钮 → 输入管理密码 → 进入商家面板。

管理密码硬编码在云函数中校验（可通过商家面板修改，存于 settings 集合）。

---

## 数据模型（云数据库，4 个集合）

### `categories` — 菜品分类

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动 |
| `name` | string | 分类名（热菜/凉菜/主食/饮品…） |
| `sort` | number | 排序 |

### `dishes` — 菜品

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动 |
| `name` | string | 菜名 |
| `categoryId` | string | 关联 categories.\_id |
| `price` | number | 价格（分） |
| `image` | string | 图片云存储 fileID，允许为空 |
| `description` | string | 简介 |
| `isAvailable` | boolean | 上架状态 |
| `sort` | number | 排序 |

### `orders` — 订单

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动 |
| `tableNo` | number | 桌号 |
| `items` | array | `[{dishId, name, price, count}]` |
| `totalPrice` | number | 总价（分） |
| `status` | string | `pending` / `accepted` / `served` / `completed` |
| `remark` | string | 备注 |
| `createdAt` | Date | 下单时间 |

### `settings` — 商家配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动 |
| `key` | string | 配置键（如 `adminPassword`） |
| `value` | string | 配置值 |

### 权限策略

数据库仅对云函数开放读写。顾客端不直连数据库，全部通过云函数中转。

---

## 云函数（6 个）

| 云函数 | 调用方 | 功能 |
|--------|--------|------|
| `getMenu` | 顾客 | 读取分类列表 + 各分类下上架菜品，一次返回 |
| `submitOrder` | 顾客 | 校验桌号 + 菜品有效性，写入 orders（status: pending） |
| `getOrder` | 顾客 | 按 orderId 查询订单状态 |
| `dishManage` | 商家 | 菜品增删改、上下架 |
| `categoryManage` | 商家 | 分类增删改 |
| `orderManage` | 商家 | 订单列表查询、状态流转（accept/serve/complete） |

---

## 核心流程

### 顾客扫码点餐

```
扫码（URL 参数 tableNo=5）
  → 首页解析桌号，存入 globalData
  → 进入菜单页，加载分类 + 菜品
  → 加购，底部购物车实时显示数量和金额
  → 进入购物车页，确认菜品、填写备注
  → 提交订单，写入云数据库，状态 pending
  → 跳转订单状态页，定时轮询状态
```

### 商家接单

```
输入密码进入商家面板
  → 实时轮询 pending 订单，新订单置顶高亮
  → 接单（status → accepted）
  → 制作完成上菜（status → served）
  → 顾客离店（status → completed）
```

### 商家菜品管理

```
分类管理 → 新增/编辑/删除分类
菜品管理 → 按分类查看 → 新增/编辑/删除/上下架菜品
```

---

## 状态机

```
订单状态流转（单向）：
  pending → accepted → served → completed

可取消：仅 pending 状态可取消
```

---
