import { getStudioProfile } from "@/lib/studio";

export type LegalSection = { heading: string; body: React.ReactNode };

export async function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: (studioName: string) => React.ReactNode;
  sections: (studio: { name: string; email: string | null }) => LegalSection[];
}) {
  const studio = await getStudioProfile();
  const updated = "17 October 2026";

  return (
    <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <h1 className="text-3xl text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h1>
      <p className="mt-2 text-xs text-zinc-400">Last updated {updated}</p>
      <p className="mt-6 text-sm leading-relaxed text-zinc-600">{intro(studio.name)}</p>

      <div className="mt-10 flex flex-col gap-8">
        {sections(studio).map((s) => (
          <section key={s.heading}>
            <h2 className="text-base font-semibold text-zinc-900">{s.heading}</h2>
            <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-zinc-600">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
