/**
 * 共享层出口：浏览器半侧 bundle 与桌面 shared-core 共用同一份纯逻辑。
 * 不负责配置的读取、合并与校验：成品配置由宿主半侧的 readAllConfig 给出，本层只把它拍平。
 * 宿主半侧不得 import 本目录（DSH 单文件加载约束会拆 chunk），其实现自包含、改动须与本层同步。
 * menu / chat / score-popup / tooltip 导出 DOM 样式与挂载：数据与判据仍是纯函数，渲染两端共用同一份。
 * @module dsh-pet/src/shared/index
 */
export * from './types';
export * from './constants';
export * from './pickers';
export * from './displays';
export * from './motion';
export * from './balance';
export * from './whisper';
export * from './config';
export * from './fonts';
export * from './notify';
export * from './menu'; // 统一右键菜单（本目录唯一的 DOM 例外：树=纯函数，渲染=两端共用同一份）
export * from './chat'; // 对话弹窗（menu 之后第二个 DOM 例外：数据=纯函数，弹窗=两端共用同一份）
export * from './physics'; // 拖拽抛掷物理（弹簧跟手 + 甩抛 + 重力反弹）
export * from './score'; // 点击积分（速度/大小 → 分数，纯逻辑）
export * from './score-popup'; // 点击积分弹窗 + 粒子爆发（menu/chat 之后第三个 DOM 例外：渲染=两端共用同一份）
export * from './work-status'; // 工作状态联动（DSH 会话事件 → 档位动画/气泡：档位常量 + reducer + 文案，浏览器消费）
export * from './state'; // 轮询统一状态 S 的客户端侧纯逻辑（拉取 / 拍平 / 比对；两端共用）
export * from './tooltip'; // 悬浮提示（替代原生 title 属性：class + 样式 + 翻转判据，两端共用同一份）

export * from './typography';
