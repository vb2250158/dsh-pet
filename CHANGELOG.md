# 0.4.3-fork.5

- 为固定 Git 安装提供 Host/Web 和现有 Helper 共享 JavaScript 的最小 prepare/prepack；允许已审查来源构建后自动生成声明的插件入口，避免触发整套独立产品发布链。
- 完整独立应用构建与发布检查保留为显式命令，不在插件安装期间运行。
- 运行源码和首屏统计口径未改变；正式安装及跨机同步分别验收。

# 0.4.3-fork.4

- 停止或卸载吃白饭活动后，迟到的取锁回执只释放原租约，不再移动宠物或启动续期；连续重开只保留最后一场，上一场收尾不能释放新场的锁。
- 卸载撤销排队的重开，收场取消动画等待；普通停止后仍可重新开演。补充延迟回执、连续切换、卸载和重新进入回归。
- Late activity lock receipts release their own lease after stop or unload. Replacements wait for prior cleanup, only the latest request starts, and disposal cancels queued starts and animation waits.

# 0.4.3-fork.3

- 合入原上游至 `31ed1b3`：新增吃白饭玩法、修正透明滤镜的文档流占位、按条件使用 XWayland，并改为使用插件自有 Electron 运行目录。保留宿主认证、独立用户数据、Windows 层级恢复及现有模型和对话逻辑。
- 放锁时停止续期定时器；卸载后的迟到配置回执不再重新注册菜单或启动演出。两项问题均有失败负控及修复后回归。
- 本轮验证目标为 Windows x64、Node 24.15.0 和固定 Core `3ff2154e` / `0.2.2-alpha.3`，在隔离源码副本构建与测试；正式安装、浏览器与桌宠实际显示由维护窗口另行验收。

# 0.4.3-fork.2

- 固定 Git 源码包构建时使用的 Cordis 开发依赖与 npm 锁文件，避免安装器自动选取不兼容的 4.1.0；运行时依然由宿主提供 peer 依赖。
- 在隔离副本使用 Node 24.22.1 完成构建、类型检查、lint、格式、运行时和 OpenAPI 检查；正式 DSH 安装及桌面验收仍待验证。

# 0.4.3-fork.1

- 合入上游至 1684a81 的七项修复：透明灰框、网页转身续链、禁用工作状态联动、窗口内位置偏移、Helper 空白输出识别、桌面循环续播和第三方菜单重名分层。
- 保留 Windows 层级恢复、宿主认证、独立 Electron 数据目录和显式沙箱降级开关；播放状态的 once 与单次播放参数保持同义。
- 验证目标为当前 Windows 源码 Web 与在用 Pet helper；其它平台等待具体反馈，不扩展兼容矩阵。

## 0.4.1-fork.4

- 合入上游 `31aa345` 的六项更新：输入法回车、历史动作与配图名称、用户侧历史时间前缀、拖拽位移和动作频率设置及全局继承；保留 fork 的认证、沙箱、数据路径、字体、图标与 Windows 层级恢复。
- 补充模型请求历史回归，确认动作与配图名称只投影一次、旧用户附件不重发、持久记忆不被改写；修正配置文档的动作频率继承说明。
- Integrates six upstream changes through `31aa345`, preserving fork admission, sandbox defaults, data paths, typography, artwork and Windows stacking recovery. Adds captured-request history regressions and documents global animation weights with per-kind overrides.

## 0.4.1-fork.3

- Windows 桌宠在显示、还原、唤醒和显示器恢复时重新置顶，不激活或聚焦窗口；不启用周期强制置顶。
- Restore Windows desktop-pet stacking on show, restore, wake and display recovery without changing foreground focus. Periodic forced repinning remains disabled.

## 0.4.1-fork.2

- 插件图标移除白色背景，保留人物与文字，使用 256×256 透明 PNG。
- 更正安装包 README 的过期“私有维护版”说明，补充公开 fork 与上游链接，保留原有代码许可及素材使用要求。
- Remove the plugin icon background and identify the public maintenance fork in the packaged README. Code licensing and upstream asset restrictions remain unchanged.

## 0.4.1-fork.1

- 合入上游 `3229ab2` 前的 31 个提交：独立模式设置与对话页、宠物头像、工作会话跳转、显示快捷键、语音音量与气泡同步、碎碎念排队及应用资源修复。
- 保留宿主认证、会话图片与语音权限、字体与可读气泡、默认关闭点击音效与互撞、显式 Electron 数据隔离和待办随机标识；头像写入与会话跳转在分发前同样检查宿主认证。
- 上游设置页刷新 cookie 与本地请求准入状态并存。完整 `--no-sandbox` 重试仅在显式设置 `DSH_PET_ALLOW_NO_SANDBOX=1` 后启用；默认保留沙箱，`DSH_PET_GPU_SANDBOX=1` 继续禁止降级。
- Integrates 31 upstream commits through `3229ab2`, retaining fork typography, storage, identity and Host admission. Avatar writes and Session focus require admission before dispatch. Full sandbox fallback requires explicit `DSH_PET_ALLOW_NO_SANDBOX=1`; GPU-only settings do not grant that permission.

## 0.3.8-fork.15

- 待办标识改用随机 UUID，避免重建存储实例或系统时间回拨后生成重复标识、导致文件无法重新读取；保留已有标识和文件格式。
- 回归覆盖固定时间下跨实例创建、时钟回拨后重建、并发创建以及独立重载。

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
