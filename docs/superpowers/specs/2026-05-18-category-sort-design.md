# 菜品分类排序管理

## 目标

新增独立页面管理菜品分类，支持长按拖拽排序。将排序能力从菜品管理页迁出，菜品管理页仅保留分类筛选。

## 新增页面

### `pages/merchant/categories/index`

- 垂直列表展示所有分类，每行：拖拽手柄 + 分类名称 + 编辑/删除按钮
- 长按行触发 movable-view 拖拽排序，松手调用 `categoryManage.reorder`
- 底部「新增分类」按钮
- Modal 弹窗处理新增/编辑分类名称
- 删除时弹出确认对话框

## 改动

| 文件 | 操作 |
|------|------|
| `pages/merchant/categories/index.{ts,wxml,wxss,json}` | 新增 |
| `app.json` | 注册新路由 |
| `pages/merchant/dishes/index.ts` | 移除拖拽相关代码 |
| `pages/merchant/dishes/index.wxml` | 移除 `bindlongpress`、拖拽手柄、浮层 |
| `pages/merchant/dashboard/index.wxml` | 新增「分类管理」导航入口 |

## 云函数

复用现有 `categoryManage`（list/add/update/delete/reorder），无需改动。

## 排序交互

长按 → 震动反馈 → 行浮起跟随手指 → 拖到目标位置松手 → `categoryManage.reorder`
