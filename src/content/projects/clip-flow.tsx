import { Link } from "react-router-dom";
import { CodeBlock } from "../../components/CodeBlock";
import clipFlowClassic from "../../assets/images/clip-flow-classic.png";

export function ClipFlowContent() {
  return (
    <>
      <img
        src={clipFlowClassic}
        alt="ClipFlow 经典模式界面截图"
        className="my-6 w-full rounded-md border border-line"
        loading="lazy"
      />

      <h2>项目一句话</h2>
      <p>
        <code>ClipFlow</code> 把剪贴板历史从简单文本列表扩展为本地桌面工作台：识别文本、富文本、图片、代码、URL 和文件等内容，并通过搜索、收藏、OCR 与快捷键降低重复查找和粘贴成本。
      </p>
      <p>
        <strong>这个项目和 AI Agent 工程的关联</strong>：它是我客户端工程能力的集中展示——跨平台状态管理、原生能力集成（OCR / 全局快捷键 / 系统托盘）、本地数据安全（AES-256-GCM 加密）、双模式交互设计。这些工程 discipline 直接迁移到 Agent 系统设计：状态隔离对应 Agent 的 State 分层，原生能力集成对应 MCP 工具契约，本地数据安全对应 Agent 的权限边界。
      </p>

      <h2>为什么做这个项目</h2>
      <p>
        系统剪贴板通常只保留最近一次复制内容。开发、写作和资料整理过程中，代码片段、链接、图片与文件会频繁覆盖，重新定位原始内容会打断工作流。
      </p>
      <p>这个项目重点解决三个问题：</p>
      <ul>
        <li>不同剪贴板格式如何统一检测、归一化和持久化。</li>
        <li>桌面应用如何兼顾完整管理界面与快速调用的紧凑界面。</li>
        <li>OCR、全局快捷键、托盘和窗口行为等平台能力如何收敛到统一的 Flutter 应用层。</li>
      </ul>

      <h2>核心能力</h2>
      <table>
        <thead>
          <tr>
            <th>能力</th>
            <th>工程落点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>多格式识别</td>
            <td>Clipboard detector / processor 区分文本、富文本、代码、图片、颜色和文件等内容</td>
          </tr>
          <tr>
            <td>双模式界面</td>
            <td>Classic 与 Compact 页面通过 Riverpod 状态和动画切换</td>
          </tr>
          <tr>
            <td>搜索与整理</td>
            <td>支持全文搜索、类型筛选、收藏、去重和历史数量限制</td>
          </tr>
          <tr>
            <td>OCR</td>
            <td>通过原生 MethodChannel 接入 macOS Vision、Windows Media OCR 与 Linux Tesseract 适配层</td>
          </tr>
          <tr>
            <td>本地存储</td>
            <td>SQLite 持久化历史记录，并提供 AES-256-GCM 加解密服务</td>
          </tr>
          <tr>
            <td>桌面集成</td>
            <td>全局快捷键、系统托盘、开机启动、窗口监听与自动隐藏</td>
          </tr>
          <tr>
            <td>国际化</td>
            <td>中英文 ARB 资源与 Flutter 本地化生成流程</td>
          </tr>
        </tbody>
      </table>

      <h2>工程结构</h2>
      <CodeBlock
        title="architecture"
        code={`Flutter UI
  Classic / Compact / Settings
        ↓ Riverpod
Application Providers
        ↓
Clipboard / Search / OCR / Hotkey / Tray Services
        ↓
SQLite Storage / Platform Method Channels`}
      />
      <p>
        项目将通用模型、平台能力、存储和可观测性放在 <code>lib/core/</code>，把经典模式、紧凑模式与设置页拆到{" "}
        <code>lib/features/</code>，避免 UI 直接承担剪贴板监听和平台调用职责。
      </p>

      <h2>可验证证据</h2>
      <ul>
        <li>GitHub 将 Dart 标记为主语言，<code>pubspec.yaml</code> 要求 Dart <code>^3.9.0</code>。</li>
        <li>OCR 三平台适配（macOS Vision / Windows Media OCR / Linux Tesseract）、AES-256-GCM 本地加密与全局快捷键均有对应源码实现，可在仓库中直接查证。</li>
        <li>
          <code>test/</code> 中的单元测试覆盖剪贴板检测、轮询、处理、去重、快捷键、OCR 与性能行为。
        </li>
        <li>仓库包含 Classic、Compact、浅色模式与设置页的真实界面截图。</li>
        <li>项目使用 MIT License。</li>
      </ul>

      <h2>技术取舍</h2>
      <table>
        <thead>
          <tr>
            <th>选择</th>
            <th>取舍</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Flutter 桌面端</td>
            <td>复用 UI 与业务状态，但快捷键、OCR、托盘等能力仍需平台适配</td>
          </tr>
          <tr>
            <td>轮询与异步处理队列</td>
            <td>降低平台监听差异，代价是需要控制轮询开销和任务续排</td>
          </tr>
          <tr>
            <td>SQLite 本地存储</td>
            <td>数据不依赖云端，适合剪贴板隐私场景，但跨设备同步不在当前范围</td>
          </tr>
          <tr>
            <td>AES-256-GCM</td>
            <td>每次加密使用随机 IV；当前密钥通过 SharedPreferences 持久化，不等同于系统 Keychain 级密钥保护</td>
          </tr>
          <tr>
            <td>双界面模式</td>
            <td>同时覆盖完整管理和快速选择，但需要保持两套交互状态一致</td>
          </tr>
        </tbody>
      </table>

      <h2>项目边界</h2>
      <ul>
        <li>README 明确 macOS 已验证，Windows 与 Linux 仍待运行测试。</li>
        <li>Windows / Linux OCR 适配代码已经存在，不把“存在实现”表述为“完成跨平台验收”。</li>
        <li>GitHub 当前没有正式 Release，项目以源码构建和本地验证为主。</li>
        <li>当前定位是个人桌面效率工具，不包含云同步、团队共享或移动端。</li>
      </ul>

      <h2>相关页面</h2>
      <ul>
        <li>
          <Link to="/projects">项目总览</Link>
        </li>
        <li>
          <Link to="/about">关于</Link>
        </li>
      </ul>
    </>
  );
}
