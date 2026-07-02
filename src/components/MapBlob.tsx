/**
 * Decorative aggregated-risk illustration used on the home preview.
 * Purely visual (the real map lives on /mapa). Copied from the design.
 */
export function MapBlob({ height = 150, caption }: { height?: number; caption?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-map-border bg-map-bg"
      style={{ height }}
    >
      <svg
        viewBox="0 0 300 260"
        className="absolute inset-0 h-full w-full opacity-50"
        aria-hidden="true"
      >
        <path
          d="M46,84 C50,66 66,52 88,50 C104,49 112,40 130,38 C150,36 160,44 182,42 C210,40 236,48 258,66 C272,78 276,98 268,118 C282,132 286,152 274,168 C262,184 240,190 220,196 C200,202 190,214 168,214 C144,214 128,206 104,208 C82,210 62,200 52,180 C44,164 48,146 40,130 C34,116 40,100 46,84 Z"
          fill="#C4D3BE"
        />
      </svg>
      <div
        className="absolute rounded-full"
        style={{
          left: "44%",
          top: "38%",
          width: 70,
          height: 70,
          background: "radial-gradient(circle,rgba(206,106,78,0.55),transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: "24%",
          top: "56%",
          width: 56,
          height: 56,
          background: "radial-gradient(circle,rgba(224,162,76,0.5),transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: "62%",
          top: "26%",
          width: 44,
          height: 44,
          background: "radial-gradient(circle,rgba(134,176,138,0.55),transparent 70%)",
        }}
      />
      {caption ? (
        <div className="absolute bottom-3 left-3.5 rounded-full bg-white/80 px-[9px] py-1 text-[11.5px] font-semibold text-[#4A574F]">
          {caption}
        </div>
      ) : null}
    </div>
  );
}
