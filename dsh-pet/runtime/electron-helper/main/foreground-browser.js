'use strict';
const { spawn } = require('node:child_process');

/**
 * 追踪「最后激活的浏览器」：给「打开站点」一个可复用的浏览器身份，而不是一律丢给系统默认浏览器。
 *
 * 为什么需要它：菜单首项以前固定走 `shell.openExternal`，也就是系统默认浏览器。多浏览器用户
 * 日常在 Chrome 里登录着 DSH，点一下桌宠却在 Edge 里新开一份未登录的会话——同一个站点两条
 * cookie、两套登录态。按「用户刚才在用的那个浏览器」打开，才符合直觉。
 *
 * 为什么常驻轮询而不是点击时查一次：右键菜单弹出后前台窗口是本进程的原生菜单，等
 * `pet:open-site` 到达 IPC 时再问 `GetForegroundWindow()` 只会得到自己。所以必须在菜单弹出
 * 之前就把浏览器身份记下来——只能靠后台采样。
 *
 * 代价与边界：只在 Windows 启用（其他平台没有等价的一次性查询，直接回退默认浏览器）；
 * 采样进程异常退出后不自动重启，避免崩溃循环，下一次「打开站点」自然回退默认浏览器。
 * @module dsh-pet/runtime/electron-helper/main/foreground-browser
 */

/** 认作浏览器的进程名（不含 .exe，小写）。只收桌面浏览器，不含 electron 应用自身的进程。 */
const BROWSER_PROCESS_NAMES = new Set([
  'chrome',
  'msedge',
  'firefox',
  'brave',
  'vivaldi',
  'opera',
  'chromium',
  'thorium',
  'yandex',
  'librewolf',
  'waterfox',
  'arc',
  '360se',
  '360chrome',
  '360chromex',
  'qqbrowser',
  'sogouexplorer',
  'maxthon',
  'liebao',
  '2345explorer',
]);

/**
 * 采样脚本：只在前台进程变化时输出一行 `<pid>\t<processName>\t<exePath>`。
 * 用 EncodedCommand 传入，避免经 cmd 转义时丢掉脚本里的引号和反斜杠。
 * Add-Type 只编译一次，之后循环里只做取窗口 + 查进程两件事。
 */
const FOREGROUND_POLL_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class DshPetForeground {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
'@
$last = ''
$lastWindow = [IntPtr]::Zero
while ($true) {
  $handle = [DshPetForeground]::GetForegroundWindow()
  $processId = 0
  if ($handle -ne [IntPtr]::Zero) {
    [void][DshPetForeground]::GetWindowThreadProcessId($handle, [ref]$processId)
  }
  $line = ''
  if ($processId -gt 0 -and $handle -ne $lastWindow) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($null -ne $process -and $process.Path) {
      $line = '' + $processId + "\`t" + $process.ProcessName + "\`t" + $process.Path
    }
  }
  $lastWindow = $handle
  if ($line -ne $last) {
    if ($line -ne '') { [Console]::Out.WriteLine($line) }
    [Console]::Out.Flush()
    $last = $line
  }
  Start-Sleep -Milliseconds COMPOSE_POLL_MS
}
`;

/**
 * 创建前台浏览器追踪器。
 *
 * @param deps - 可注入的平台、进程与日志能力（测试用）。
 * @param deps.platform - 运行平台，非 win32 时 start() 不做事。
 * @param deps.pollMs - 采样间隔毫秒，默认 800。
 * @param deps.logger - 可选日志对象（warn）。
 * @returns 追踪器：start/stop/lastBrowserExe/isRunning。
 */
function createForegroundBrowser({ platform = process.platform, pollMs = 800, logger } = {}) {
  /** @type {import('node:child_process').ChildProcess | undefined} */
  let child;
  let browserExe;
  let stopping = false;

  const warn = (message) => {
    if (logger && typeof logger.warn === 'function') logger.warn(message);
  };

  const handleLine = (line) => {
    const fields = line.split('\t');
    if (fields.length < 3) return;
    const name = String(fields[1] || '')
      .trim()
      .toLowerCase();
    const exePath = String(fields[2] || '').trim();
    if (!exePath || !BROWSER_PROCESS_NAMES.has(name)) return;
    // 同一次前台切换会连续收到同一行的情况很少，但仍按值去重，避免重复写状态。
    if (browserExe === exePath) return;
    browserExe = exePath;
  };

  const start = () => {
    if (child || platform !== 'win32') return;
    stopping = false;
    const script = FOREGROUND_POLL_SCRIPT.replace('COMPOSE_POLL_MS', String(Math.max(200, Math.floor(pollMs))));
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    try {
      child = spawn(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
        { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] },
      );
    } catch (error) {
      warn('[dsh-pet-desktop-helper] foreground browser tracker failed to start: ' + String(error && error.message));
      child = undefined;
      return;
    }
    const running = child;
    running.on('error', () => {
      if (child !== running) return;
      warn('[dsh-pet-desktop-helper] foreground browser tracker unavailable');
      child = undefined;
      browserExe = undefined;
    });
    running.on('exit', () => {
      if (child !== running) return;
      // 不重启：采样进程挂了就回退默认浏览器，别在后台养一个崩溃循环。
      child = undefined;
      browserExe = undefined;
      if (!stopping) warn('[dsh-pet-desktop-helper] foreground browser tracker exited');
    });
    let pending = '';
    running.stdout.setEncoding('utf8');
    running.stdout.on('data', (chunk) => {
      if (child !== running) return;
      pending += chunk;
      const lines = pending.split(/\r?\n/u);
      pending = lines.pop() ?? '';
      for (const line of lines) handleLine(line);
    });
  };

  const stop = () => {
    stopping = true;
    const running = child;
    child = undefined;
    browserExe = undefined;
    if (!running) return;
    try {
      running.kill();
    } catch {
      /* 已经退出：无事可做 */
    }
  };

  return {
    start,
    stop,
    /** @returns {string | undefined} 最近一次前台浏览器可执行文件路径 */
    lastBrowserExe: () => browserExe,
    isRunning: () => child !== undefined,
    /** 仅供测试：直接喂一行采样输出 */
    ingest: handleLine,
  };
}

module.exports = { createForegroundBrowser, BROWSER_PROCESS_NAMES };
