import { PageHead, SectionTitle } from "../components/PageHead";

const timeline = [
  {
    span: "2015—2017",
    practice: "iOS 开发起步",
    takeaway: "风景网旅游 App iOS 端开发与测试，建立从需求到上线的完整交付习惯",
  },
  {
    span: "2017—2024",
    practice: "证券 To B 客户端与核心 SDK",
    takeaway:
      "负责证券行业移动客户端研发与交付，维护多客户共享的核心模块，支撑多家券商项目并行维护；其中两年常驻客户现场，做客户端问题的现场定位",
  },
  {
    span: "2024—2026",
    practice: "HarmonyOS 证券项目 & iOS",
    takeaway:
      "独立负责鸿蒙端交易模块，完成从行情展示到下单反馈的完整闭环（ArkTS 状态编排）；参与公共能力层、路由体系与事件总线",
  },
  {
    span: "2026—至今",
    practice: "AI Agent / RAG / MCP",
    takeaway:
      "独立设计 Agentic RAG、知识操作层与能力分发基座，覆盖权限治理、引用验证、审计追踪与定时任务运行",
  },
];

const stack = [
  { group: "AI / Agent", items: "LangGraph、LangChain、RAG、MCP、ChromaDB、FastAPI" },
  { group: "客户端", items: "Objective-C / iOS、ArkTS / ArkUI、Flutter" },
  { group: "工程化", items: "Python / uv、CI/CD、自动化脚本、模块化治理、知识库工程" },
];

export function About() {
  return (
    <>
      <PageHead
        title="关于我"
        metaDescription="10 年证券客户端工程经验，把长期处理过的状态、权限、安全、错误恢复与发布约束，迁移到可验证的 Agent 系统中。"
      />

      <div className="mx-auto max-w-shell px-6">
        {/* 项目清单不在此页重复，统一在 /projects */}
        <div className="prose max-w-[46em]">
          <p>我是 Jaron Lu，10 年证券客户端工程经验，目前专注 AI Agent 与 LLM 应用工程。</p>
          <p>
            交易链路不能出错，行情推送不能丢，权限边界不能越。这些约束塑造了我的工程直觉：系统可信度不来自功能多，而来自边界清、验证严、可追溯。
          </p>
          <p>
            AI Agent 恰恰是最需要这种工程纪律的领域。模型能回答不等于回答可信，工具能调用不等于调用安全，Agent
            能自主不等于结果可审计。大多数 Demo
            停在“能跑”，但生产系统需要回答：谁能看什么？输出基于什么证据？出错了怎么追溯？
          </p>
          <p>
            我把金融场景的工程约束迁移到 Agent 系统设计中，专注权限、验证和可审计性这些“不性感但决定系统能不能上线”的问题。
          </p>
        </div>

        <section className="mt-16">
          <SectionTitle title="经历" />
          <dl className="mt-2 border-t border-line">
            {timeline.map((t) => (
              <div
                key={t.span}
                className="grid grid-cols-1 gap-y-1 border-b border-line py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-x-8"
              >
                <dt className="text-[0.875rem] leading-relaxed text-muted sm:pt-0.5">{t.span}</dt>
                <dd>
                  <p className="text-[1rem] leading-relaxed font-medium text-ink">{t.practice}</p>
                  <p className="mt-1 max-w-[46em] text-[0.9375rem] leading-[1.75] text-muted">
                    {t.takeaway}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16">
          <SectionTitle title="技术栈" />
          <dl className="mt-2 border-t border-line">
            {stack.map((s) => (
              <div
                key={s.group}
                className="grid grid-cols-1 gap-y-0.5 border-b border-line py-3.5 sm:grid-cols-[8.5rem_1fr] sm:gap-x-8"
              >
                <dt className="text-[0.875rem] leading-relaxed text-muted sm:pt-0.5">{s.group}</dt>
                <dd className="max-w-[46em] text-[0.9375rem] leading-[1.75] text-ink-soft">{s.items}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16">
          <SectionTitle title="怎么学" />
          <div className="prose mt-3 max-w-[46em]">
          <p>
            转向 Agent 之后，我把学习也当成工程：概念、边界、实现分开验证，不把某个框架的写法当成 Agent
            的本质。
          </p>
          <ul>
            <li>
              <strong>ag2_agents</strong>
              ：一份心智模型文档先回答六个问题——谁决定下一步、模型看到了什么、工具如何被校验和执行、
              结果如何回到上下文、运行因何停止、行为如何验证；再用 4 个可运行的 AG2 示例对照差异，
              示例只代表“一种实现”，不是标准答案。
            </li>
            <li>
              <strong>ai-engineering-hub</strong>
              ：文档按上游源码校准，<code>learning/</code> 只推进一个知识点，教学记录不算验收证据。
            </li>
            <li>
              <strong>doubao-cron</strong>
              ：每天跑的任务同样受规则约束，结论必须带可点击的溯源链接，产物按日期归档。
            </li>
          </ul>
          </div>
        </section>
      </div>
    </>
  );
}
