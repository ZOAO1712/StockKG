# stockkg-frontend

股票投资知识图谱学习系统前端。

## 本次持久化接入内容

- 登录 / 注册接口连接后端 `/api/auth/*`，用户数据由 MySQL 持久化保存。
- 总览、图谱探索连接 Neo4j 查询接口。
- 新增“后台管理”页面，连接 `/api/manage/notices`，公告数据由 MySQL 持久化保存。

## 启动

```bash
npm install
npm run dev
```

默认 Vite 代理会把 `/api` 请求转发到后端服务。
