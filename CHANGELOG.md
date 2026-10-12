# Fork changes

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
