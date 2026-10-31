## 0.3.8-fork.14

- 合入上游 12 个提交：物理碰撞与四向接触、可选体感、鼠标释放、设置重排、录音转写和快捷键；保留 fork 点击音效与互撞默认关闭。
- 语音识别在实现忽略取消信号时仍按预算返回，预取消不启动转写，并清理计时器和监听；迟到拒绝被正常观察。
- 保留显式 Electron 数据目录优先级、默认 GPU 沙箱与宿主认证；默认目录不可写时沿上游规则选择 fallback。

## 0.3.8-fork.13

- 合入上游碰撞触觉反馈和物理设置开关；旧配置缺键继续有效，不支持振动的浏览器保持静默。
- 保留宿主认证、GPU 沙箱、数据目录和持久化保护。

## 0.3.8-fork.12

- 合入上游睡眠动作、聊天动作、语音投递、八语设置、子路径和按屏宽缩放；保留本地字体、GPU 沙箱、数据目录与持久化保护。
- 宿主认证使用服务端路由段，睡眠和唤醒沿用同一请求认证入口。

## 0.3.8-fork.11

- 合入上游待办、通知正文、拖图、设置下拉与本期用量；保留既有宿主认证、GPU 沙箱和 Electron 数据隔离。
- 待办读写要求宿主认证；读取失败、文件损坏或版本不支持时拒绝写入，保留用户文件。
- 独立模式复用同一 HTTP 安全入口的授权请求，修复已授权对话被重复拒绝的问题；待办、附件和语音读取仍需有效凭据。

## 0.3.8-fork.10

- Require Host browser/API authentication and Host/Origin admission before chat, orphan-memory management, voice catalog or synthesis requests; keep the private desktop bridge.
- 对话、残留记忆管理、语音音色列表及合成先通过宿主浏览器/API 认证与 Host/Origin 检查，保留私有桌面桥接入口。

## 0.3.8-fork.9

- Package the split installation and feature guides referenced by the installed README.
- 安装包包含 README 新链接的安装与功能文档。

- Integrate upstream chat and optional speech, drag/motion, asset range and log-flush changes; retain authenticated Session images, default GPU sandbox, isolated Electron profiles, system typography and readable bubbles.
- 合入上游聊天与可选语音、拖拽走位、资源分段及日志收尾；保留会话图片认证、默认 GPU 沙箱、独立 Electron 数据目录、系统字体和气泡可读性。

## 0.3.8-fork.8

- Require Host browser/API authentication and Host/Origin admission for Session-image reads.
- Retain fork.7's explicit Electron profile isolation and current DSH rc.3 compatibility.

## 0.3.8-fork.7

- Add an explicit absolute Electron user-data directory override for isolated helper, application and DPI-probe runs; retain existing defaults when unset and reject unusable overrides.
- 新增显式绝对路径的 Electron 数据目录覆盖，隔离 Helper、应用及 DPI 探测数据；未设置时保留默认目录，非法或不可用路径明确失败。

## 0.3.8-fork.6

- Integrate upstream modular Host, Client and Electron helper changes, image attachments, menu events and chat history controls.
- Preserve the Windows GPU sandbox default, system typography, readable wallet bubbles, package wrapper and portable build overrides.
- Update the settings browser fixtures for entity-based validation errors, both Save controls, file-pet asset roots and relative model-picker scrolling.

# 0.3.8-fork.5

- Merge upstream comment and lint maintenance while retaining local fonts, bubble readability and the patched Valibot build dependency.
- Declare eslint-plugin-jsdoc at the root build manifest so fixed Git installations run the same prepack checks as local builds.

# Fork changes

## 0.3.8-fork.4 (2026-10-25)

- Integrate upstream comment and JSDoc lint changes through dfc0396; preserve every existing executable source token, including the GPU sandbox opt-out and host typography. The desktop shared bundle includes its generator header.
- 合入上游注释及 JSDoc 检查更新至 dfc0396；逐项保留既有可执行源码，包括 GPU 沙箱显式退出和宿主字体。桌面共享产物附带生成器文件头。

- Pin build-time Valibot to 1.4.2 in both installation manifests; keep the existing bundler and GPU sandbox defaults. The selected DSH runtime owns its peer dependency versions.
- 两份安装清单均固定构建依赖 Valibot 1.4.2；保留现有构建器及 GPU 沙箱默认值。DSH 宿主依赖由实际运行时提供。

## 0.3.8-fork.3 (2026-10-25)

- Integrate 16 official commits through 4eb75e6: custom balance pages, provider timeouts, configuration serialization, invalid-history recovery, valid Electron caches, display topology and wake fixes, optional click sound and asset attribution. Preserve host fonts, readable bubbles and existing memories. Package the new sound asset in the root installation adapter.
- Keep the GPU sandbox enabled by default. The Windows virtual-display workaround requires an explicit DSH_PET_GPU_SANDBOX=0; no environment change is made by this release.
- 合入16项官方更新：多页余额、查询超时、配置串行化、坏历史和Electron缓存保护、显示器/唤醒修复、可选音效与素材署名；保留字体、气泡和记忆。根安装包包含新音效。GPU沙箱默认启用，虚拟显示器兼容选项仅由显式 DSH_PET_GPU_SANDBOX=0 启用，本次发布不改环境变量。

## 0.3.8-fork.2 (2026-10-24)

- Integrate upstream 0.3.8 modifier-click navigation, string-safe JSONC comments, optional single-process app packaging, Electron download progress, tool-detail work status and the configurable system tray. Retain host fonts, readable bubbles, prior wallet behavior and user configuration and memories. The normal DSH plugin path still launches through its profile; the standalone app is optional.
- 合入上游 0.3.8 修饰键导航、JSONC 字符串安全、可选单进程应用打包、Electron 下载提示、工具详情及托盘开关；保留宿主字体、可读气泡、钱包行为、用户配置和记忆。常规 DSH 插件仍通过 profile 启动，独立应用为可选入口。

## 0.3.8-fork.1 (2026-10-23)

- Integrate upstream 0.3.8 modifier-click navigation, string-safe JSONC comments, optional single-process app packaging, Electron download progress, tool-detail work status and the configurable system tray. Retain host fonts, readable bubbles, prior wallet behavior and user configuration and memories. The normal DSH plugin path still launches through its profile; the standalone app is optional.
- 合入上游 0.3.8 修饰键导航、JSONC 字符串安全、可选单进程应用打包、Electron 下载提示、工具详情及托盘开关；保留宿主字体、可读气泡、钱包行为、用户配置和记忆。常规 DSH 插件仍通过 profile 启动，独立应用为可选入口。

## 0.3.7-fork.8 (2026-10-22)

- Integrate upstream points balances, disposable third-party balance provider registration, synthetic Cordis examples and host/client service documentation. Retain money-wallet behavior, host fonts, readable bubbles and existing pet configuration and memories. The old balance module is split into shape-specific handlers; published imports continue to resolve through the shared balance entry.
- 合入积分余额、可注销的第三方余额服务注册、合成 Cordis 示例及宿主/客户端服务说明；保留多币种钱包行为、宿主字体、可读气泡、已有配置和记忆。余额实现按形态拆分，公共入口保持一致。

## 0.3.7-fork.6 (2026-10-21)

- Merge upstream multi-currency balance handling and the HTTP/Cordis integration references on top of 0.3.7-fork.5. Account and official API wallets retain each currency, aggregate matching account wallets and include bonus-only currencies. Bubble amounts and animation thresholds use each wallet's own currency and baseline.
- Breaking response change: money balances now expose `data.wallets[]` instead of the former flat `currency`, `total`, `granted`, `toppedUp` and `fullBalance` fields. Consumers must read each wallet; no currency conversion is performed. OpenAPI and owned provider/display tests follow the new response.
- Preserve the maintenance fork's host font, readable bubbles, 12px whisper minimum, localized plugin metadata and opt-in standalone endpoint settings. Existing pet configuration and memories stay in place.
- 合入多币种余额及 HTTP/Cordis 接口说明；保留各币种充值与赠送余额，并按币种自己的基准计算动画档位，不作汇率换算。金额响应改为 `data.wallets[]`，原平铺金额字段的调用方需同步调整；OpenAPI 与相关测试一并更新。宿主字体、可读气泡、12px 下限及原有宠物配置、记忆保持不变。

## 0.3.7-fork.5 (2026-10-20)

- Merge upstream notification targeting, stale-lock rejection, playback progress, wallet selection and opt-in standalone chat configuration. Preserve fork typography, readable bubbles and existing pet memories.

## 0.3.7-fork.4 (2026-10-20)

- Integrate upstream font settings, geometry, tray, lock, playback-receipt and desktop-liveness fixes. Keep the host font as default, high-contrast bubbles and the 12px whisper minimum in browser and desktop modes.
- Align repository and child package versions. Include the complete animation and meme assets in Git-installed packages; existing pet configuration and memories remain in place.
- 合入上游字体配置、几何定位、托盘、锁定、播放回执和桌面存活修复；保留宿主字体、深色文字及 12px 碎碎念下限。

## 0.3.7-fork.2

- Incorporates the configured repository main commit `5c7bb05edcfc67cc433ecae354708d683654f792`, including the desktop topmost watchdog, shared tooltips and local time context.
- Adds a repository root manifest for fixed-commit Git installation while keeping upstream source under `dsh-pet/`. The child package owns the build, checks and assets.
- Preserves the existing DSH typography and readable bubbles from `0.3.7-fork.1`. No pet configuration or memory migration is required.

## 0.3.7-fork.1

- 气泡、对话框与积分卡片使用 DSH 默认字体，浏览器继承 `--dsw-font-family`。
- 气泡文字加深至 `#111`，白色背景不透明度提高至 98%，尾巴与背景一致。
- 碎碎念字号至少为 12px，浏览器与桌面模式一致。
- 从上游 `v0.3.6` 提取可安装的包目录，保留 MIT 许可与原作者署名。

## 0.3.7-fork.1 (English)

- Bubbles, chat dialogs and score cards follow DSH typography; the browser inherits `--dsw-font-family`.
- Bubble text uses `#111` over 98% opaque white, including the matching tail.
- Self-talk text stays at least 12px in browser and desktop modes.
- The installable package directory is extracted from upstream `v0.3.6`, preserving the MIT license and attribution.

## 0.3.7-fork.3 · 插件列表语言 / Plugin list language

插件列表中的名称和描述随 DSH 的中文、英文语言设置切换。

Plugin list names and descriptions follow the DSH Chinese or English language setting.
