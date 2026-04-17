# 金融知识图谱 Vue3 Demo

一个可直接运行的知识图谱前端演示项目，适合毕设原型展示。

## 技术栈

- Vue 3
- Vite
- Pinia
- Vue Router
- D3
- ECharts

## 已实现功能

- 总览页：节点/关系统计、类别分布图、核心节点评分图
- 图谱页：力导向知识图谱、节点点击详情、缩放拖拽
- 搜索筛选：支持按关键词和类别过滤图谱
- 状态管理：Pinia 管理选中节点、搜索条件、类别筛选
- 路由：总览面板 / 图谱探索 两个页面

## 运行方式

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址即可。

## 生产构建

```bash
npm run build
npm run preview
```

## 后续接入真实图谱数据

当前 mock 数据在：

```bash
src/mock/graphData.js
```

你后续只需要把这里替换成后端接口返回的数据即可。推荐数据结构：

```js
{
  nodes: [
    {
      id: 'stock_1',
      label: '贵州茅台',
      category: '股票',
      description: '节点描述',
      metrics: { 市盈率: '28.3' }
    }
  ],
  edges: [
    {
      source: 'stock_1',
      target: 'industry_1',
      label: '属于'
    }
  ]
}
```

## 适合你后续继续加的模块

- 对接 Neo4j / SpringBoot / Django 接口
- 节点双击展开邻居节点
- 图谱快照导出
- 登录页与后台管理页
- 图谱问答输入框
