# 工作安排 - 多人实时协作版

基于 Node.js + Express + Socket.io 的实时协作工作安排系统。

## 功能

- 待完成 / 已完成双栏看板
- 多人实时同步（WebSocket）
- 拖拽任务在状态间移动
- 任务搜索、优先级、截止日期
- JSON 导入 / 导出
- 在线协作者显示
- 数据自动持久化

## 本地运行

```bash
cd server
npm install
npm start
```

服务启动后访问 http://localhost:3000

局域网内其他设备访问 `http://你的IP:3000` 即可协作。

## 部署到云端

### 方案一：Railway（推荐，免费额度）

1. 注册 https://railway.app
2. New Project → Deploy from local folder 或连接 GitHub 仓库
3. 选择 `server` 目录
4. 添加环境变量 `PORT=3000`（或不设，Railway 会自动注入 PORT）
5. 部署完成后获取公网 URL，分享给团队

### 方案二：Render（免费层）

1. 注册 https://render.com
2. New → Web Service
3. 连接 GitHub 仓库，根目录设为 `server`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. 部署完成获取公网 URL

### 方案三：Fly.io

```bash
cd server
fly launch
fly deploy
```

### 方案四：Docker 部署

在 `server/` 目录创建 Dockerfile：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

然后：

```bash
docker build -t work-schedule .
docker run -p 3000:3000 -v $(pwd)/tasks.json:/app/tasks.json work-schedule
```

## 项目结构

```
server/
├── package.json       # 依赖配置
├── server.js          # 后端服务（Express + Socket.io）
├── tasks.json         # 数据持久化（运行后自动生成）
└── public/
    └── index.html     # 前端页面
```

## 技术栈

- Express 4 — HTTP 服务 & REST API
- Socket.io 4 — WebSocket 实时通信
- 原生 HTML/CSS/JS — 前端，无框架依赖
