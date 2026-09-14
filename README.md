# 番号管理器（本地版）v1.1

一个基于 HTML/CSS/JS + Capacitor 的本地番号/女优管理工具。所有数据（包括图片）都存储在设备本地。支持随机抽取、数据导入导出、统计看板等特性。

## 功能

- 添加、编辑、删除番号
- 添加、编辑、删除女优
- 本地图片上传（封面、头像，压缩后存入 IndexedDB）
- 番号与女优自动关联
- **随机抽取**（随机番号 / 随机女优，含抽取记录）
- **数据导入导出**（JSON 备份，导入为合并模式：保留现有数据、同 ID 覆盖）
- **作品导出 TXT**（作品页工具栏，按时间降序导出，每行「番号-女优名」）
- **打卡记录搜索**（统计页顶部，按番号/女优搜索打卡历史，分组显示次数与日期）
- **打卡热力图**（统计页年度打卡分布热力图，显示全年每日打卡频率，支持点击查看日期/次数）
- **大数据量性能优化**（列表分批渲染 + IndexedDB 封面/头像视口懒加载，仅靠近屏幕的图片才解码，大幅降低大量数据时的卡顿与内存占用）
- **打卡时间显示**（今日打卡记录每条显示 HH:mm，24h 制精确到分钟）
- **设置二级菜单**（设置页改为菜单列表，随机抽取/统计分析/名称替换/数据备份各自进入独立二级页）
- **WebDAV 云备份**（数据备份二级页内，将备份上传至 WebDAV 服务器并从云端恢复；支持**测试连接**，备份统一存放于云端 `avmanager/` 目录）
- **打卡**（统一条目「番号 (演员名)」搜索勾选：多选暂存→确认批量提交、支持自定义新条目、作品自动关联女优；女优打卡总数合并直接打卡+其作品记录；女优详情页实时显示累计打卡次数）
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
│   ├── utils.js            # 公共纯函数（无 DOM / 无数据层依赖）
│   ├── db.js               # 数据层：localStorage + IndexedDB 图片库
│   └── app.js              # 界面逻辑
├── capacitor.config.json   # Capacitor 配置
├── package.json            # npm 配置
└── README.md
```

> `capacitor.config.json` 中 `webDir` 为 `.`，打包时会把工程根目录同步进 App。
> 若希望严格隔离（只打包 Web 资源、排除 `package.json`、`node_modules` 等），把前端文件移入独立目录（如 `www/`）并同步修改 `webDir`、`npm start` 与下文的引用路径即可。

## 快速开始

### 浏览器预览

不需要安装任何依赖，直接用浏览器打开 `index.html` 即可使用。

```bash
# 或者用本地服务器预览
npx serve .
# 等同于
npm start
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

> 发布前请把 `capacitor.config.json` 里的 `appId`（当前为占位符 `com.example.javmanager`）改成你自己的包名，否则无法上架应用商店。

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

首页点击「随机抽取」快捷卡片，或在「设置 → 随机抽取」中进入。选择「随机女优」或「随机作品」，点击「开始抽取」即可，抽取记录可在同一弹窗中查看。

### 导入导出

进入「设置 → 数据备份」：

- **导出备份**：将所有数据（作品、女优、打卡、抽取记录、替换规则、站点导航）导出为 JSON 文件
- **导入文件**：选择 JSON 备份文件恢复数据，采用**合并模式**（保留现有数据，相同 ID 的条目会被覆盖）
- **WebDAV 云备份**：填写服务器地址/用户名/密码并保存后，可测试连接、上传备份、从云端恢复

### 数据存储

- 作品/女优/打卡等结构化数据保存在浏览器/WebView 的 `localStorage` 中
- 图片在内存中压缩（封面最长边 900px、JPEG）后存入 `IndexedDB`，`localStorage` 只保存轻量引用，避免容量溢出
- 导出备份时图片会转回 base64 内嵌进 JSON，导入时自动写回 IndexedDB
- 卸载 App 或清除数据后，本地数据会丢失，建议定期导出备份

## 开发约定

- **脚本加载顺序**：`js/utils.js` → `js/db.js` → `js/app.js`。`utils.js` 存放无副作用的公共纯函数（`escapeHtml`、`normalizeVideoCode`、`normalizeNameList`、`m_original_split`、生日解析等），`db.js` 与 `app.js` 均依赖它，**不要在其他文件重复定义**（三个文件共享全局作用域，重名会静默覆盖）
- **数据层读写**：`DB.getVideos()/getActresses()/getNameMappings()` 返回**浅拷贝**，可安全排序/过滤而不污染内部缓存；批量增删请用 `DB.deleteVideos()/deleteActresses()`，避免逐条落盘
- **缓存版本号**：`index.html` 中 `css/style.css?v=` 与三个 `js/*.js?v=` 用于防止 WebView 缓存旧代码，**每次修改前端代码后需同步递增**
- **语法自检**：`npm run check`（对三个 JS 文件执行 `node --check`）

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
- localStorage + IndexedDB

## 注意事项

- 本项目仅作为本地个人资料管理工具示例
- 不包含任何在线播放或下载功能
- 请遵守当地法律法规，尊重版权
- 如需上架应用商店，请自行评估内容合规性

## License

MIT
