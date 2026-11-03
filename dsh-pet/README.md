# dsh-pet 🐾

公开维护版 0.4.1-fork.4：<https://github.com/vb2250158/dsh-pet>。插件图标使用透明背景，保留人物与文字。合并上游设置与对话页、宠物头像、工作会话跳转、显示快捷键和语音改进，保留系统字体、透明渲染、Electron 数据隔离及待办标识保护。待办读写、对话记忆、残留记忆管理、会话图片读取、语音音色列表及合成要求宿主浏览器/API 认证及 Host/Origin 检查。待办文件读取失败、损坏或版本不支持时拒绝写入并保留原文件；修复文件后可重试。独立模式复用自身 HTTP 安全入口的授权结果，私有路由不接受匿名读取。

本版修复输入法组合态下的回车误发送、历史配图与动作名称回填、历史时间前缀和拖拽起手位移，新增动作频率设置。动作频率作为所有宠物的全局默认，种类文件可显式覆盖；保留 Windows 显示与还原时的层级恢复。

This release preserves the Windows stacking recovery and integrates IME-aware sending, historical image/action names, user-side history timestamps, stable drag geometry and action-frequency settings. Frequency values are global defaults with explicit per-kind overrides.

待办标识的重载及时间无关语义见根目录 [API.md 的待办事项](../API.md#十待办事项)。

一只住在 DeepSeek Harness 里的桌面宠物，一百余个透明动画，可多开、能上桌面。

安装与完整文档：**<https://github.com/PC2005-cloud/dsh-pet>**

许可：代码 MIT；素材禁止商用；二创在公开渠道须署名（同上链接）。

Windows 桌宠在窗口显示、还原、唤醒及显示器恢复时重新置顶，不抢走当前输入焦点；周期强制置顶保持关闭。该恢复处理不代表已经证明所有偶发遮挡或绘制停滞的成因。
