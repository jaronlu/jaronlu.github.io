import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { Reveal } from "../components/Reveal";
import { noteCategories, notes } from "../data/notes";

const groups = ["agent", "knowledge", "engineering"] as const;

export function Notes() {
  return (
    <>
      <PageHead kicker="FIELD NOTES" title="工程笔记">
        围绕 Agent Runtime、RAG、MCP 和 Loop Engineering，记录直接支撑项目设计的约束、取舍与验证方法。
      </PageHead>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1180px] px-6 py-10">
          <Reveal>
            <p className="mb-8 max-w-[62ch] text-[0.82rem] leading-relaxed text-muted">
              每篇笔记标注 CONFIDENCE 等级：<b className="text-ink">HIGH</b>{" "}
              表示结论已对照官方文档或项目代码核对；<b className="text-ink">MEDIUM</b>{" "}
              表示基于实践经验、尚未完整验证。
            </p>
          </Reveal>

          {groups.map((cat) => {
            const catNotes = notes.filter((n) => n.category === cat);
            if (catNotes.length === 0) return null;
            return (
              <div key={cat} className="mb-10">
                <Reveal>
                  <h2 className="mb-3 font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-accent uppercase">
                    {noteCategories[cat].label}
                  </h2>
                </Reveal>
                <Reveal>
                  <div className="border-t border-line">
                    {catNotes.map((n) => (
                      <Link
                        key={n.slug}
                        to={`/notes/${n.slug}`}
                        className="hover-row group grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-0.5 border-b border-line py-4 text-ink no-underline sm:grid-cols-[3rem_1fr_auto] sm:gap-x-7"
                      >
                        <span className="font-mono text-[0.72rem] font-semibold text-faint">
                          N{n.index}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-[1.15rem] font-semibold text-ink">
                            {n.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[0.76rem] text-muted">
                            {n.description}
                          </span>
                        </span>
                        <span
                          className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold tracking-[0.08em] sm:inline-flex ${
                            n.confidence === "HIGH"
                              ? "border-line text-muted"
                              : "border-line text-accent"
                          }`}
                        >
                          {n.confidence}
                        </span>
                        <span className="justify-self-end text-center text-[0.95rem] text-accent transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
