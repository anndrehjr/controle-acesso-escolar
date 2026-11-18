import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpenText, Home } from "lucide-react";

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DocumentacaoPage() {
  const arquivo = path.join(process.cwd(), "docs", "DOCUMENTACAO_FUNCIONAL.md");
  const conteudo = fs.readFileSync(arquivo, "utf8");
  const topicos = [...conteudo.matchAll(/^##\s+(.+)$/gm)].map((item) => item[1]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 overflow-hidden rounded-3xl border p-6 md:p-8" style={{ background: "radial-gradient(circle at 90% 0%,rgba(59,130,246,.20),transparent 38%),var(--bg-card)", borderColor: "rgba(59,130,246,.35)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--bg-sidebar-active)", color: "var(--brand-primary)" }}>
                <BookOpenText className="h-4 w-4" /> Manual atualizado
              </span>
              <h1 className="mt-4 text-3xl font-black md:text-4xl">Documentação do Sistema Pedagógico</h1>
              <p className="mt-2 max-w-3xl" style={{ color: "var(--text-secondary)" }}>Funções, permissões, regras pedagógicas e orientações de uso da versão atual do sistema.</p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold" style={{ background: "var(--bg-app)", borderColor: "var(--border-subtle)" }}>
              <Home className="h-4 w-4" /> Ir ao dashboard
            </Link>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="rounded-2xl border p-4 xl:sticky xl:top-14" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <p className="mb-3 text-xs font-black uppercase tracking-[.16em]" style={{ color: "var(--brand-primary)" }}>Tópicos</p>
            <nav className="max-h-[72vh] space-y-1 overflow-y-auto pr-1" aria-label="Tópicos da documentação">
              {topicos.map((topico) => <a key={topico} href={`#${slug(topico)}`} className="block rounded-lg px-3 py-2 text-sm transition hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>{topico}</a>)}
            </nav>
          </aside>

          <article className="min-w-0 rounded-3xl border p-5 md:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="mb-4 text-3xl font-black">{children}</h1>,
                h2: ({ children }) => <h2 id={slug(String(children))} className="mb-4 mt-10 scroll-mt-16 border-t pt-8 text-2xl font-black first:mt-0 first:border-0 first:pt-0" style={{ borderColor: "var(--border-subtle)" }}>{children}</h2>,
                h3: ({ children }) => <h3 className="mb-3 mt-7 text-xl font-bold">{children}</h3>,
                p: ({ children }) => <p className="my-3 leading-7" style={{ color: "var(--text-secondary)" }}>{children}</p>,
                ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6" style={{ color: "var(--text-secondary)" }}>{children}</ul>,
                ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6" style={{ color: "var(--text-secondary)" }}>{children}</ol>,
                strong: ({ children }) => <strong style={{ color: "var(--text-primary)" }}>{children}</strong>,
                code: ({ children }) => <code className="rounded-md px-1.5 py-0.5 text-sm" style={{ background: "var(--bg-app)", color: "var(--brand-primary)" }}>{children}</code>,
                table: ({ children }) => <div className="my-5 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}><table className="w-full min-w-[700px] text-sm">{children}</table></div>,
                thead: ({ children }) => <thead style={{ background: "var(--bg-app)" }}>{children}</thead>,
                th: ({ children }) => <th className="px-4 py-3 text-left font-bold">{children}</th>,
                td: ({ children }) => <td className="border-t px-4 py-3 align-top" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>{children}</td>,
                a: ({ href, children }) => <a href={href} className="font-semibold underline underline-offset-2" style={{ color: "var(--brand-primary)" }}>{children}</a>,
              }}
            >
              {conteudo}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </main>
  );
}
