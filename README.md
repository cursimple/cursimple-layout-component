# 布局 · 课简扩展组件

[English](README_en.md)

把 [课简](https://github.com/cursimple/cursimple-app) 的导航从侧边栏换成**底边栏**：

- **底边栏**：课表固定在第一个、「我的」固定在最后，中间最多放 3 个入口（默认备忘录、组件），可以拖动排序
- **随时换回**：在组件里选「侧边栏」，或在课简「设置 → 侧边栏」里点「换回侧边栏」；停用或删除组件也会自动回到侧边栏
- **什么都不丢**：不在底栏的页面都在「我的」里，快捷操作（主题、课表背景、调课、检查更新）也在那里

组件和课简本体是解耦的：可选的布局、入口和顺序规则都在本组件里，课简只提供通用的「布局」能力并负责绘制。以后的新布局也会放在这个组件里。

侧边栏本身的入口顺序和显示不需要本组件，在课简「设置 → 侧边栏」里就能调整。

## 安装

需要课简 **0.7.11** 或更新版本。在课简「插件 → 组件」里搜索「布局」安装；也可以从 [Releases](../../releases) 下载 `app-layout-v*.zip`，在组件页用「本地安装」导入。

安装后在侧边栏打开「布局」，选「底边栏」即可生效。

## 开发

```bash
npm test         # 规则和清单测试
npm run preview  # 浏览器预览（模拟课简，不会改动真实应用）
npm run pack     # 生成 dist/app-layout-v<版本>.zip 和市场用的 dist/manifest.json
```

预览地址支持参数：`?mode=bottomBar`（以底边栏开始）、`?theme=dark`、`?scale=1.3`、`?legacy=1`（模拟旧版课简）、`?fail=1`（模拟应用失败）；窄屏检查用 `/frame?w=320&…`。

推送 `v<版本>` 标签会自动测试、打包并发布 Release，标签必须和 `manifest.json` 的版本一致。

## 许可

MIT。图标来自 Google Material Icons Rounded（Apache-2.0，见 `plugin-packages/app-layout/ui/material-icons.LICENSE.txt`）。
