# GPX/KML 路线文件

将徒步路线的 GPX 或 KML 文件放在此目录，然后运行：

```bash
npm run import:routes
```

脚本会自动：
- 解析轨迹数据（坐标、海拔、距离、爬升）
- 智能采样（控制轨迹点数量）
- 生成 `lib/data/routes.ts`
- 更新 `lib/data/routes-meta.json`（首次）

## 文件来源

- **两步路**: 路线详情 → 导出 → GPX/KML
- **六只脚**: 轨迹 → 导出 → GPX
- **Google Earth**: 画路线 → 另存为 → KML
- **手表/手环**: 导出运动记录 → GPX

## 工作流程

1. 下载路线文件到本目录
2. 运行 `npm run import:routes`
3. 编辑 `lib/data/routes-meta.json` 补充名称、描述、难度等
4. `git add . && git commit -m "add: 新增路线" && git push`
