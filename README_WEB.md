# AW189 模拟器 — 网页版（虚拟桌面）

- 背景为 AW189 日落剪影，已压暗处理；
- 桌面图标：Cockpit / PFD / MFD / ECDU / MCDU / DTD；
- 开始菜单：模块、全部关闭；
- 任务栏：开始、已打开窗口、时钟；
- 浮动窗口：拖动、右下角缩放、最小化、最大化、关闭；
- 标题栏只做窗口管理，模块入口在桌面图标/开始菜单/任务栏；
- 图标为中性线框，无红绿点缀；最小化按钮是 ASCII `-`。

## 本地预览

```bash
python -m http.server 8080
```

打开 <http://127.0.0.1:8080/>。

## 说明

- 每个模块是独立 Ruffle 实例；关闭窗口释放。
- `player.html?app=pfd` 保留，需要原生弹窗时可直接打开。
- MCDU 会先走自检/取数，进入 `DB IDENT` 需要几秒。
- 桌面版 Tauri 使用原生窗口，与网页版共用 SWF/Ruffle 资源。

## 手机版

入口：`mobile.html`（PWA 的 `start_url` 也是它）。

- 单模块全屏 + 底部 6 个标签切换，不弹窗；
- 顶部：模块名、画质切换（默认低）、全屏按钮；
- 全屏时隐藏顶栏/底栏，只保留右上角“退出全屏”；
- PFD/MFD/DTD/Cockpit 竖屏时提示“横屏观看更佳”，全屏时会尝试锁定横屏；
- MCDU/ECDU 默认竖屏；
- `manifest.webmanifest` + `sw.js`，支持“添加到主屏幕”和基础离线缓存；
- 同一时间只保留一个 Ruffle 实例，切模块会销毁上一个，省内存；
- 移动端默认 `quality: low`，可点顶部按钮切 低/中/高；如果仍卡，优先用系统 Chrome/Edge 打开，不要在微信内置浏览器里跑。

手机访问（同一局域网）：

```bash
python -m http.server 8080 --bind 0.0.0.0
```

然后手机打开 `http://<电脑局域网IP>:8080/mobile.html`。

## 统一入口

根路径 `/`（`index.html`）按 UA / 触摸指针 / 屏幕短边自动分流：

- 手机、平板、窄窗口 → `mobile.html`
- 桌面 → `desktop.html`

手动覆盖：

```
/?ui=mobile
/?ui=desktop
```

PWA 的 `start_url` 也是 `/`，安装后自动进手机版。
