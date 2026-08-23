# 番号管理器（本地版）v1.1

一个基于 HTML/CSS/JS + Capacitor 的本地番号/女优管理工具。所有数据（包括图片）都存储在设备本地。支持随机抽取、数据导入导出、统计看板等特性。

## 功能

- 添加、编辑、删除番号
- 添加、编辑、删除女优
- 本地图片上传（封面、头像，压缩后存入 IndexedDB）
- 番号与女优自动关联
- **随机抽取**（随机番号 / 随机女优，带动画效果）
- **数据导入导出**（JSON 备份，支持合并/替换模式）
- **统计看板**（番号数、女优数、已评分数实时显示）
- **打卡**（统一条目「番号 (演员名)」搜索勾选：多选暂存→确认批量提交，支持自定义新条目、一键保存至本地库、作品自动关联女优；女优打卡总数合并直接打卡+其作品记录；女优详情页实时显示累计打卡次数）
- 搜索和筛选
- 详情页展示
- 操作 Toast 提示

## 文件结构

```
jav-manager-app/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式
├── js/
│   ├── db.js               # localStorage 数据操作
│   └── app.js              # 界面逻辑
├── capacitor.config.json   # Capacitor 配置
├── package.json            # npm 配置
└── README.md
```

## 快速开始

### 浏览器预览

不需要安装任何依赖，直接用浏览器打开 `index.html` 即可使用。

```bash
# 或者用本地服务器预览
npx serve .
```

### 打包成 Android App

#### 前置要求

- Node.js 18+
- Android Studio
- JDK 17+
- Android SDK

#### 步骤

```bash
# 1. 进入项目目录
cd jav-manager-app

# 2. 安装依赖
npm install

# 3. 添加 Android 平台
npx cap add android

# 4. 同步 Web 资源到 Android 工程
npx cap sync android

# 5. 用 Android Studio 打开并构建 APK
npx cap open android
```

然后在 Android Studio 中选择 **Build → Build Bundle(s) / APK(s) → Build APK(s)**。

### 打包成 iOS App

需要 macOS + Xcode。

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

## 使用说明

### 随机抽取

点击顶部工具栏的 🎲 按钮，选择"随机番号"或"随机女优"，点击"开始抽取"即可。抽取过程会有滚动动画，最终结果可以点击查看详情。

### 导入导出

点击顶部工具栏的 ⚙️ 按钮进入数据管理页面：

- **导出备份**：将所有番号、女优和图片数据导出为 JSON 文件
- **导入数据**：选择 JSON 文件恢复数据
  - 合并模式：保留现有数据，相同 ID 的条目会被覆盖
  - 替换模式：清空所有现有数据后导入
- **清空数据**：彻底删除所有本地数据（需二次确认）

### 数据存储

- 作品/女优/打卡等结构化数据保存在浏览器/WebView 的 `localStorage` 中
- 图片在内存中压缩（封面最长边 900px、JPEG）后存入 `IndexedDB`，`localStorage` 只保存轻量引用，避免容量溢出
- 导出备份时图片会转回 base64 内嵌进 JSON，导入时自动写回 IndexedDB
- 卸载 App 或清除数据后，本地数据会丢失，建议定期导出备份

## 关于自动抓取封面/头像

本项目为**纯前端应用**，由于浏览器的 **CORS（跨域）安全策略**限制，App 内无法直接请求大多数外部网站的内容。这是浏览器/WebView 的安全设计，不是本应用的技术缺陷。

如果你希望实现自动获取封面/头像，有以下几种技术方案：

### 方案 1：手动导入（推荐）

自己从网络下载封面/头像图片，在添加番号/女优时手动上传。

### 方案 2：配合后端代理

搭建一个简单的 Node.js/Python 代理服务，由后端代为请求外部网站，前端通过代理 API 获取数据。这需要你自己部署服务器。

### 方案 3：浏览器扩展（仅限桌面端）

开发一个浏览器扩展，在浏览器环境中抓取页面内容，然后导出 JSON 再通过本 App 导入。

### 方案 4：使用支持跨域的环境

部分 Android WebView 配置或特定环境下可能放宽 CORS 限制，可尝试在 `capacitor.config.json` 中调整 `server` 配置。

**重要提示**：自动抓取外部网站内容可能涉及：
- 违反目标网站的服务条款
- 版权侵权风险（封面、头像多为版权素材）
- 对方网站的反爬虫机制随时可能变化

请自行评估风险，本工具不提供也不鼓励未经授权的自动抓取功能。

## 技术栈

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Capacitor 6
- localStorage

## 注意事项

- 本项目仅作为本地个人资料管理工具示例
- 不包含任何在线播放或下载功能
- 请遵守当地法律法规，尊重版权
- 如需上架应用商店，请自行评估内容合规性

## License

MIT
