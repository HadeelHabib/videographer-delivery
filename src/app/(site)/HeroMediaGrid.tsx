const COLUMNS = 6;
const TILE_HEIGHT = 240; // px
const GAP = 14; // px
const MIN_TILES_PER_COLUMN = 6;

// Columns beyond this index are hidden at narrower breakpoints so the wall
// doesn't feel cramped on small screens.
const COLUMN_VISIBILITY = ["", "", "", "hidden sm:flex", "hidden md:flex", "hidden lg:flex"];

export function HeroMediaGrid({ images }: { images: string[] }) {
  if (images.length === 0) {
    return <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />;
  }

  const columns = Array.from({ length: COLUMNS }, (_, colIndex) => {
    const tiles: string[] = [];
    while (tiles.length < MIN_TILES_PER_COLUMN) tiles.push(...images);
    // Offset each column's starting image so neighboring columns aren't in lockstep.
    const offset = colIndex % images.length;
    const rotated = [...tiles.slice(offset), ...tiles.slice(0, offset)];
    const loopTiles = [...rotated, ...rotated]; // doubled for a seamless translateY(-50%) loop
    return {
      tiles: loopTiles,
      duration: 13 + colIndex * 2, // brisk continuous drift, slight per-column variance
      delay: -(colIndex * 2.5),
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-950" aria-hidden="true">
      <style>{`
        @keyframes hero-grid-scroll {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        .hero-grid-col {
          animation-name: hero-grid-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-grid-col { animation-play-state: paused; }
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1300px" }}>
        <div
          className="flex overflow-hidden"
          style={{
            gap: `${GAP}px`,
            width: "150%",
            height: "135%",
            transform: "rotateX(52deg) rotateZ(-14deg) scale(1.45)",
            transformOrigin: "center center",
          }}
        >
          {columns.map((col, i) => (
            <div
              key={i}
              className={`hero-grid-col ${COLUMN_VISIBILITY[i]} flex flex-1 flex-col`}
              style={{ gap: `${GAP}px`, animationDuration: `${col.duration}s`, animationDelay: `${col.delay}s` }}
            >
              {col.tiles.map((src, j) => (
                <div
                  key={j}
                  className="w-full shrink-0 overflow-hidden rounded-lg bg-zinc-800"
                  style={{ height: TILE_HEIGHT }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
    </div>
  );
}
