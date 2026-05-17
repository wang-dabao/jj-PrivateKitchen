# 首页 UI 优化 & 品牌配置

## 目标
丰富初始页面视觉，支持自定义品牌 Logo 和店铺说明，采用清新简约风格。

## 布局（方案 B）

```
[ 圆形 Logo ]         ← 可替换图片
姜姜私房菜             ← 静态配置
家常味道 · 用心烹制    ← 静态配置（1-2 行）
🕐 11:00-21:00  📍 xxx ← 营业信息（可选）

[ 选择桌号开始点餐 ]    ← 品牌色胶囊按钮 + 阴影
查看我的订单            ← 仅在有进行中订单时展示
```

## 配置方式
纯静态文件，无云函数/数据库依赖：
- `miniprogram/config/shop.ts` — 店铺名称、说明、营业时间、地址等常量
- `miniprogram/images/logo.png` — Logo 图片，替换图片即生效

## 涉及文件
- 新建 `miniprogram/config/shop.ts`
- 重写 `miniprogram/pages/index/index.wxml`
- 重写 `miniprogram/pages/index/index.wxss`
- 修改 `miniprogram/pages/index/index.ts`（添加 config 数据绑定）

## 保留功能
- 查看我的订单（currentOrderId 逻辑不变）
- 桌号选择弹窗
- 扫码参数跳转（tableNo）
- 隐藏商家入口（5 次点击）
