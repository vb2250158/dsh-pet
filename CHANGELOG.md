# Fork changes

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
