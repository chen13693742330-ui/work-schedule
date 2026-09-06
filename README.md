# 工作安排 - 多人实时协作

永久免费 · 无需绑卡 · 支持多人实时协作

## 技术方案
- **GitHub Pages** 托管前端（免费）
- **Firebase Realtime Database** 实时数据同步（免费）

## 部署步骤

### 1. 启用 GitHub Pages
1. 打开仓库 Settings → Pages
2. Source 选 "Deploy from a branch"
3. Branch 选 `main`，文件夹选 `/docs`
4. 点 Save

### 2. 配置 Firebase
1. 打开 [Firebase 控制台](https://console.firebase.google.com)
2. 创建项目（免费，无需绑卡）
3. 左侧菜单 → Realtime Database → 创建数据库 → 选"测试模式"
4. 项目设置 → 您的应用 → 注册 Web 应用
5. 复制 `firebaseConfig`
6. 打开部署的页面，按提示粘贴配置即可

## 文件结构
```
docs/
└── index.html    # 完整应用（前端 + Firebase 实时同步）
```
