import Link from "next/link";
import { getHomeData } from "@/lib/home";
import { HeroSlider, type HeroSlide } from "./HeroSlider";
import { FeaturedWorkMarquee } from "./FeaturedWorkMarquee";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  wedding: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-4.5-3h3M12 4v2"
    />
  ),
  portrait: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
    />
  ),
  event: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
    />
  ),
  commercial: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3.75 8.25h16.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25Zm3-3h10.5v3H6.75v-3Z"
    />
  ),
  other: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6-4.6-1.9 4.6-1.9L12 3Z"
    />
  ),
};

export default async function HomePage() {
  const { studio, services, featured, testimonials } = await getHomeData();
  const heroImages = featured.map((g) => g.coverImage).filter((url): url is string => Boolean(url));
  const specialties =
    services.length > 0
      ? services.map((s) => s.name.charAt(0).toUpperCase() + s.name.slice(1)).join(" · ")
      : "Weddings · Portraits · Events";

  const heroSlides: HeroSlide[] = [
    {
      eyebrow: studio.name,
      headline: studio.tagline ?? "Cinematic films for the moments you'll want to relive.",
    },
    {
      eyebrow: specialties,
      headline: "Real moments, told with real craft.",
    },
    {
      eyebrow: "Now booking",
      headline: "Every story deserves a proper film.",
    },
  ];

  return (
    <div>
      <HeroSlider slides={heroSlides} images={heroImages} />

      {/* Services */}
      <section id="services" className="relative scroll-mt-20 overflow-hidden py-24">
        {/* Decorative film strip background — large, soft, tinted to match the warm cream palette */}
        <div
          className="pointer-events-none absolute -top-24 -left-32 w-[55%] opacity-[0.08]"
          style={{
            transform: "rotate(-12deg)",
            filter: "sepia(0.25) saturate(0.9)",
          }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/film.jpg" alt="" className="w-full h-auto" />
        </div>
        <div
          className="pointer-events-none absolute -bottom-32 -right-28 w-[42%] opacity-[0.07]"
          style={{
            transform: "rotate(18deg) scaleX(-1)",
            filter: "sepia(0.3) saturate(0.85)",
          }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/film.jpg" alt="" className="w-full h-auto" />
        </div>
        {/* Soft vignette wash for premium editorial depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 500px at 50% -10%, rgba(0,0,0,0.025), transparent 70%), radial-gradient(900px 400px at 50% 110%, rgba(0,0,0,0.02), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">Services</p>
            <h2 className="mt-3 text-3xl text-zinc-900 sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              What I shoot
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(services.length > 0
              ? services
              : ["wedding", "portrait", "event", "commercial"].map((name) => ({
                  name,
                  count: 0,
                  description:
                    {
                      wedding:
                        "Full-day coverage cut into a film that plays back like a memory, not a highlight reel.",
                      portrait: "Relaxed, directed sessions that still feel like you — solo, couples, or family.",
                      event:
                        "Corporate, private, and milestone events, covered without getting in the way.",
                      commercial:
                        "Brand and product films built around a clear story, not just pretty shots.",
                    }[name] ?? "",
                }))
            ).map((service) => (
              <Link
                key={service.name}
                href={`/portfolio/${service.name}`}
                className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 p-8 backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:border-zinc-900 hover:bg-white hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]"
              >
                {/* Subtle inner highlight at the top for a glassy premium edge */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
                  }}
                  aria-hidden="true"
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-zinc-900"
                  aria-hidden="true"
                >
                  {SERVICE_ICONS[service.name] ?? SERVICE_ICONS.other}
                </svg>
                <h3 className="mt-5 text-xl capitalize text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{service.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-400 transition group-hover:text-zinc-900">
                  See work →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured work */}
      <section id="featured-work" className="scroll-mt-20 bg-zinc-950 py-24">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Portfolio</p>
          <h2 className="mt-3 text-3xl text-white sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Recent work
          </h2>
        </div>

        <div className="mt-14">
          <FeaturedWorkMarquee items={featured} />
        </div>

        <div className="mt-10 text-center">
          <Link href="/portfolio" className="text-sm text-white/60 hover:text-white">
            View all work →
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">About</p>
            <h2 className="mt-3 text-3xl text-zinc-900 sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {studio.name}
            </h2>
            {studio.tagline && <p className="mt-4 text-lg text-zinc-600">{studio.tagline}</p>}
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-500">
              {studio.bio ??
                "Every project starts with a conversation, not a shot list. The goal is always the same: footage that feels honest, and a film you'll still want to watch in ten years."}
            </p>
            <Link
              href="#contact"
              className="mt-8 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Let&apos;s work together
            </Link>
          </div>
          <div className="order-1 aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900 lg:order-2">
            {studio.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={studio.logoUrl} alt={studio.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                <span
                  className="text-6xl text-white/20"
                  style={{ fontFamily: "var(--font-display)" }}
                  aria-hidden="true"
                >
                  {studio.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-t border-black/5 bg-white py-24">
          <div className="mx-auto max-w-4xl px-6 sm:px-10">
            <h2 className="text-center text-3xl text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
              Kind words
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-2xl bg-zinc-50 p-6">
                  <p className="text-sm leading-relaxed text-zinc-700">&ldquo;{t.body}&rdquo;</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {t.visitorName || "Anonymous"} {t.category ? `· ${t.category}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 bg-zinc-950 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center sm:px-10">
          <h2 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Ready to tell your story?
          </h2>
          <p className="mt-4 text-sm text-white/60">
            Tell me a bit about your day or project, and I&apos;ll get back to you within 48 hours.
          </p>
          {studio.email && (
            <a
              href={`mailto:${studio.email}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-zinc-900 transition hover:bg-white/90"
            >
              {studio.email}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
