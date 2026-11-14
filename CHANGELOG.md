# 0.4.8-fork.2

- 接收上游五项新增逻辑，保留语速正负号检查、宿主公开入口事件、响应体超时/网络/JSON 错误分类，以及被拒绝回合的工作状态清理。
- 浏览器和 Helper 说话气泡支持点击收起。每次新台词具有独立显示身份，同文新事件也撤销旧收起动作；Helper 在新台词、明确清理和卸载时取消自己的动画计时器。工作气泡仍跳会话，余额气泡仍翻页。
- 当前受测环境为 Core549 / 0.2.2-rc.1、Windows x64、Node24.15.0、pnpm11.28.5。正式版本仍为0.4.5-fork.12；新浏览器交互、动画与原生 Helper 外观等待恢复 GUI 验收。
- Integrate five incremental upstream changes through1388ffc. Preserve per-utterance dismissal ownership in Web and Helper runtimes. This source candidate remains pending actual GUI and combination acceptance.

# 0.4.8-fork.1

- 按逻辑接收上游七项环境接口、天气气泡、指定宠物余额、UAPI 查询、后台梦话和前台提醒更新，保留助手显示、请求记录预算、素材 URL、跨挂载锁和认证处理。
- 城市与天气优先通过 HTTPS UAPI 按出口 IP 查询，成功结果缓存十分钟并共用进行中的请求；失败继续使用原 IP 定位与 Open-Meteo。手动查询可强制刷新。没有发送真实位置或模型请求来验证该候选。
- 梦话遵循宠物的碎碎念与显示开关；周期限制在 Node 定时器上限内。新增前台提醒开关默认关闭，原有通知与语音总开关继续生效。
- 拒绝 UAPI 空白温度和湿度，空白体感按已知气温处理；保留此前 Open-Meteo 空白数值修复。源码检查和固定宿主测试分别记录，天气气泡、菜单与设置的实际 GUI 验收仍暂停。
- Integrate the seven reviewed upstream commits through e755e7b while preserving maintained ownership and persistence behavior. Validate against the current Core549 source Web environment. The new UI remains a source candidate pending actual GUI acceptance.

# 0.4.5-fork.12

- 按逻辑接收上游城市与天气、时间行环境事实及省份/一小时天气缓存三项更新。对话、碎碎念和梦话会查询出口 IP 的粗略城市，再查询 Open-Meteo 地名及天气，并把可用事实加入模型 system 时间行。
- IP 查询首选 ip-api.com 明文 HTTP，失败后使用 ipwho.is HTTPS；天气与地名通过 HTTPS 查询 Open-Meteo。IP 缓存六小时、坐标缓存七天、天气缓存一小时；查询失败省略不可用事实。IP 定位是网络粗估，天气按同名城市首条地名结果取得。
- 保留助手、人格与记忆、素材 URL 动画及跨挂载 CAS 租约修复。拒绝空白数值被转换为零并写入天气上下文；合成网络与时钟验证不代表真实定位结果或性能提升。
- Integrate three upstream environment-context changes while preserving maintained assistant, memory, URL animation and cross-mount lease behavior. Reject blank weather numbers instead of reporting zero. This source candidate requires separate installation and runtime acceptance.

# 0.4.5-fork.11

- 修复吃白饭活动跨页面挂载的锁竞争：卸载同步撤销本实例的锁接管标记，迟到的取锁、续锁与放锁回执不会覆盖或释放新实例的租约。
- 保留现有素材 URL 动画、宠物助手与记忆行为；模拟共享 sessionStorage 和独立实例验证迟到回执。源码版本与正式安装状态分别记录。
- Prevent late activity lock operations from overwriting or releasing a replacement mount’s lease.

# 0.4.5-fork.7

- 已认证的 `GET /assistant-entry` 返回当前运行模块的 `packageVersion`，即使未安装助手也可验收。入口响应和进程内显示服务共用版本常量，不读取磁盘文件冒充运行状态。
- 补充真实路由、无助手和无额外操作回归；导航、认证、显示租约及 Helper 行为保持原有语义。

# 0.4.5-fork.6

- 按逻辑纳入上游 `9f5f464`：Web 与 Helper 共用语音开始/结束到气泡挂起/释放的转换，播完后再收起，忽略上一句迟到的结束事件。
- 按逻辑纳入上游 `29a5af5`：切屏后角落模式仍按新主屏和配置边距定位；用户拖过的自定义位置继续保留桌面坐标。
- 用实际 Helper 事件与窗口脚本补充回归；保留语音卸载、请求预算、原子记忆写入、助手显示租约及 Windows 沙箱策略。源码、组合安装与实际界面验收分别记录。

# 0.4.5-fork.5

- 按逻辑同步上游语音单槽互斥、通知后台播报、四类语音开关与吃白饭 shell.overlay 入口，保留 fork 的请求预算、记忆与助手显示租约。
- 由 Cordis effect 拥有页面可见性监听与语音播放；卸载删除监听、取消合成并暂停播放，重挂后拒绝旧请求的迟到结果。Helper 使用窗口退出生命周期释放同一共享逻辑。
- 保留吃白饭卸载后配置回执与演出租约保护；新增菜单模块沿用相同取消检查。
- 现有语音字段无需迁移；新版叶子由 Host 按聊天、投喂、待办、通知各自开关决定是否播报。源码回归、当前 RC1 固定 Git 安装与实际界面验收分别记录。

# 0.4.5-fork.4

- 为官方 DSH peers 显式加入 `0.2.2-rc.1`，保留已有版本范围；根包和子包同步，避免与语音助手组合安装时只剩未发布的稳定版本交集。
- 显示租约报告实际包版本。依赖声明验证与官方隔离安装、实际组合运行分别记录；不更改全局 pnpm 或跳过 peer 检查。

# 0.4.5-fork.3

- 增加可选 `petAssistantPresenter` 显示租约；语音助手和桌宠共用原生会话，桌宠只显示气泡/动画，不另起模型或 TTS。
- 网页与 Windows 桌宠“开始聊天”进入同一助手 GUI；未加载助手时保留原独立聊天。气泡与动画分别配置，卸载仅清理自己最后写入的气泡。
- 状态与助手导航接口要求 DSH Host 认证；桌面私有桥继续使用同一个路由处理器。登录参数只留在原站点。
- 本地类型、构建、路由及租约回归通过；正式安装和视觉/声学验收尚未完成。

# 0.4.5-fork.2

- 对话模型的每次实际请求在分发前写入现有记忆文件，包含召回后的系统提示词、历史、本轮输入与最终指令；保留原始用户消息，不保存凭据、请求头或取消信号。
- 首选模型失败与回落分别留存；请求保存失败时停止生成，不尝试其他模型。记忆改为临时文件写入后替换，写入失败保留旧历史。
- 旧消息格式无需迁移。删除一轮同步删除该轮关联请求，清空包括仅有失败请求的记录；其余轮的请求保留当时的完整上下文。
- 每宠物请求记录默认限制16 MiB，设置页和正常配置接口可调整；超限只阻止该宠物本轮调用，不静默删除已有记录，也不影响其他宠物和宿主。
- 源码回归、Git 发行准备与实际宿主安装分别验收，不新增兼容矩阵。

# 0.4.5-fork.1

- 按提交和逻辑合入原上游至 `60bb2eb`：第三方对话记忆、侧栏八语、内置活动动画名称点播、角色参考图、Helper 飞行状态合并与完整语音播放后气泡收尾。
- 保留固定 Git 的最小 Host/Web 准备、当前 Alpha3 声明、显示与沙箱策略、取消及迟到锁回执保护；根包补发角色参考图。
- 手动 HEVC workflow 的 runner 维护一并同步，不在本轮运行其他平台或独立产品打包。正式安装和显示验收继续由唯一维护窗口完成。

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
