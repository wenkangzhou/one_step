# 一步野 | One Step

极简徒步路线搜索与导航工具，想象成「两步路」的极简版本。

## 核心功能

- **路线搜索 & 推荐** - 基于高德地图搜索步行/骑行路线
- **地图导航** - 实时定位追踪、路线高亮、导航信息面板

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **国际化**: i18next (中/英)
- **地图**: 高德地图 JavaScript API 2.0
- **部署**: Vercel (静态导出)

## 快速开始

### 1. 安装依赖

```bash
yarn install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填入你的高德地图 Key：

```bash
NEXT_PUBLIC_AMAP_KEY=your_amap_key_here
NEXT_PUBLIC_AMAP_SECURITY_CONFIG=your_security_config_here
```

> 申请高德地图 Key: https://lbs.amap.com/

### 3. 开发模式

```bash
yarn dev
```

### 4. 构建

```bash
yarn build
```

构建输出在 `dist/` 目录。

## 部署到 Vercel

### 方式一：通过 GitHub 导入

1. 将代码推送到 GitHub 仓库
2. 登录 Vercel Dashboard
3. 点击 "Add New Project"
4. 选择你的 GitHub 仓库
5. 配置环境变量（在 Vercel 项目设置中）
6. 部署

### 方式二：手动部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

## 项目结构

```
one_step/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页 - 路线搜索
│   └── navigate/          # 导航页面
├── components/
│   ├── ui/               # shadcn/ui 组件
│   ├── map/              # 地图相关组件
│   ├── route/            # 路线相关组件
│   └── navigation/       # 导航组件
├── lib/
│   ├── i18n/             # 国际化配置
│   ├── store/            # Zustand store
│   └── utils.ts          # 工具函数
├── public/               # 静态资源
├── types/                # TypeScript 类型
└── package.json
```

## 功能特性

- ✅ 路线搜索（基于高德地图步行/骑行路线）
- ✅ 地图展示与交互
- ✅ 实时定位与导航
- ✅ 路线详情展示
- ✅ 中英文双语支持
- ✅ 亮色/暗色主题切换
- ✅ 移动端适配
- ✅ PWA 支持

## 使用说明

1. **搜索路线**: 在首页搜索框输入起点和终点，查看推荐路线
2. **查看详情**: 点击路线卡片查看详细信息
3. **开始导航**: 在路线详情页点击"开始导航"
4. **导航中**: 查看剩余距离和预计时间，地图会跟随当前位置

## 注意事项

1. 定位功能需要 HTTPS 环境
2. 高德地图 API 需要申请 Key 和安全密钥
3. 移动端需要允许位置权限

## License

MIT
