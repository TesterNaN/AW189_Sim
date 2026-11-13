# AW189 模拟器（Web）

纯静态的 AW189 模拟器网页版，同一入口自动切换桌面/手机形态。

## 访问

部署 GitHub Pages 后：

```
https://testerNaN.github.io/AW189_Sim/
```

- 桌面：虚拟桌面 + 浮动窗口
- 手机：单模块全屏 + 底部标签
- 手动覆盖：`/?ui=desktop`、`/?ui=mobile`

## 模块

Cockpit / PFD / MFD / ECDU / MCDU / DTD

## 本地预览

```bash
python -m http.server 8080
```

## GitHub Pages

Settings → Pages → Deploy from a branch → `main` / `(root)`。

`.nojekyll` 已包含；首次加载约 17MB（wasm + 一个 SWF），之后走缓存。

## 说明

- 手机端默认低画质，顶部可切 低/中/高；
- 全屏时隐藏顶/底栏，只留“退出全屏”；
- PWA：`manifest.webmanifest` + `sw.js`，HTTPS 下可添加到主屏幕。
