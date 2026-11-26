import { Link } from "react-router-dom";
import { PageHead, SectionTitle } from "../components/PageHead";
import { noteCategories, notes } from "../data/notes";

const groups = (Object.keys(noteCategories) as Array<keyof typeof noteCategories>).sort(
  (a, b) => noteCategories[a].order - noteCategories[b].order
);

export function Notes() {
  return (
    <>
      <PageHead
        title="工程笔记"
        metaDescription="围绕 Agent Runtime、RAG、MCP 与 Loop Engineering 的工程笔记，记录直接支撑项目设计的约束、取舍与验证方法。"
      >
        每篇笔记标注置信度：HIGH 表示结论已对照官方文档或项目代码核对，MEDIUM
        表示基于实践经验、尚未完整验证。
      </PageHead>

      <section className="mx-auto max-w-shell px-6">
        {groups.map((cat) => {
          const catNotes = notes.filter((n) => n.category === cat);
          if (catNotes.length === 0) return null;
          return (
            <div key={cat} className="mb-12">
              <SectionTitle title={noteCategories[cat].label} meta={`${catNotes.length} 篇`} />
              <ul className="mt-2 border-t border-line">
                {catNotes.map((n) => (
                  <li key={n.slug} className="border-b border-line">
                    <Link
                      to={`/notes/${n.slug}`}
                      className="row-link grid grid-cols-1 gap-y-0.5 py-4 sm:grid-cols-[minmax(0,1fr)_max-content] sm:items-baseline sm:gap-x-12"
                    >
                      <span className="min-w-0">
                        <span className="row-title block font-display text-[1.125rem] leading-snug font-semibold text-ink">
                          {n.title}
                        </span>
                        <span className="mt-0.5 block max-w-[42em] text-[0.875rem] leading-relaxed text-muted">
                          {n.description}
                        </span>
                      </span>
                      <span
                        className={`text-[0.8125rem] whitespace-nowrap sm:text-right ${
                          n.confidence === "HIGH" ? "text-muted" : "text-accent"
                        }`}
                      >
                        置信度 {n.confidence}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}
