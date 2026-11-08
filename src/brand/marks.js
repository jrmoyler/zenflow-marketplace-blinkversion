// Canonical copy of jrmoyler/collective-ai-divisions build/logos.js (same file as collectiveai brand/marks.js).
// Do not edit here: change it in collective-ai-divisions, then copy it over.
// Vector marks for Collective AI and each division, drawn on a 64x64 grid in the
// June 2026 locked palettes. Each mark sits on a tactile "button" tile:
// t1/t2 = tile gradient (light, deep), tg = glow colour.
// Marks avoid gradients and ids so the same SVG can repeat on one page safely.

const S = (body) =>
  `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const MARKS = {
  parent: {
    t1: "#1B2A55", t2: "#050A18", tg: "#D4A843",
    svg: S(`<path fill="#D4A843" d="M32 9 L37.6 26.4 L55 32 L37.6 37.6 L32 55 L26.4 37.6 L9 32 L26.4 26.4 Z"/>
      <path fill="#F6E3A6" d="M32 20 L34 30 L44 32 L34 34 L32 44 L30 34 L20 32 L30 30 Z" opacity=".55"/>`)
  },

  // Yin-yang: violet half carries the work, the other half is the agent lattice.
  zenflow: {
    t1: "#2A1B5E", t2: "#06081A", tg: "#7C3AED",
    svg: S(`<circle cx="32" cy="32" r="22" stroke="#C4B5FD" stroke-width="2"/>
      <path fill="#7C3AED" d="M32 10 A22 22 0 0 1 32 54 A11 11 0 0 1 32 32 A11 11 0 0 0 32 10 Z"/>
      <g stroke="#60A5FA" stroke-width="1.1" opacity=".9"><path d="M21 17 L27 24 L22 27 L14 28 L15 38 L21 36 L22 27 M27 24 L32 21 M21 36 L32 32"/></g>
      <g fill="#BFDBFE"><circle cx="21" cy="17" r="1.7"/><circle cx="27" cy="24" r="1.7"/><circle cx="22" cy="27" r="1.9"/><circle cx="14" cy="28" r="1.5"/><circle cx="15" cy="38" r="1.5"/><circle cx="21" cy="36" r="1.7"/></g>
      <circle cx="32" cy="21" r="3.2" fill="#D4A843"/><circle cx="32" cy="43" r="3.2" fill="#06081A"/>`)
  },

  // The C closes around a growth line: emerald, cream, copper.
  "the-collective": {
    t1: "#0E8A66", t2: "#04261D", tg: "#10B981",
    svg: S(`<path d="M44 19.5 A17 17 0 1 0 44 44.5" stroke="#FEF3C7" stroke-width="6.5"/>
      <path d="M21.5 40 L28.5 33 L33.5 37 L45 25.5" stroke="#F59E5B" stroke-width="3.6"/>
      <path d="M39.5 24.5 H46 V31" stroke="#F59E5B" stroke-width="3.6"/>`)
  },

  // Shield with light rising over a horizon and a path leading toward it.
  "hybrid-living": {
    t1: "#38BDF8", t2: "#075985", tg: "#0EA5E9",
    svg: S(`<path fill="#0B1120" d="M32 9 L50 15 V30 C50 41.5 42 49.5 32 54 C22 49.5 14 41.5 14 30 V15 Z"/>
      <path fill="#FDE047" d="M23.5 33 A8.5 8.5 0 0 1 40.5 33 Z"/>
      <g stroke="#FDE047" stroke-width="2"><path d="M32 18.5 V21.5 M21.5 23 L23.6 25.1 M42.5 23 L40.4 25.1"/></g>
      <path d="M19 33 H45" stroke="#FB923C" stroke-width="2.4"/>
      <path d="M25 46 Q32 38 39 41" stroke="#38BDF8" stroke-width="2.2" stroke-dasharray="2.4 3.2"/>`)
  },

  // Studio orbit: four-segment ring around a play mark, with a spark.
  "nexus-labs": {
    t1: "#F05252", t2: "#7F1212", tg: "#DC2626",
    svg: S(`<circle cx="32" cy="32" r="18" stroke="#F1F5F9" stroke-width="2.4" stroke-dasharray="23.3 5" transform="rotate(-38 32 32)"/>
      <path fill="#F1F5F9" d="M27.5 23.5 L42 32 L27.5 40.5 Z"/>
      <path fill="#FDE68A" d="M48 10 L49.4 14.6 L54 16 L49.4 17.4 L48 22 L46.6 17.4 L42 16 L46.6 14.6 Z"/>`)
  },

  // Three ascending buildings cut by the axis line; concrete-white nodes where it crosses.
  "terra-axis": {
    t1: "#4A1618", t2: "#0A0A0A", tg: "#991B1B",
    svg: S(`<path d="M10 51.5 H54" stroke="#E8E8E8" stroke-width="2" opacity=".5"/>
      <path fill="#7F1D1D" stroke="#E8E8E8" stroke-width="1.6" d="M14 51.5 V38 H23 V51.5 Z"/>
      <path fill="#991B1B" stroke="#E8E8E8" stroke-width="1.6" d="M27.5 51.5 V27 H36.5 V51.5 Z"/>
      <path fill="#B42323" stroke="#E8E8E8" stroke-width="1.6" d="M41 51.5 V15.5 H50 V51.5 Z"/>
      <g stroke="#0A0A0A" stroke-width="1.2" opacity=".55"><path d="M17 43 H20 M30.5 32 H33.5 M30.5 38 H33.5 M44 21 H47 M44 27 H47 M44 33 H47"/></g>
      <path d="M9 50 L55 13" stroke="#E8E8E8" stroke-width="2.4"/>
      <g fill="#E8E8E8"><circle cx="18.5" cy="42.4" r="2.3"/><circle cx="32" cy="31.5" r="2.3"/><circle cx="45.5" cy="20.6" r="2.3"/></g>`)
  },

  // Hex loom: two threads woven under a code bracket.
  "binary-loom": {
    t1: "#2A3612", t2: "#050605", tg: "#A3E635",
    svg: S(`<path d="M32 9.5 L51.5 20.75 V43.25 L32 54.5 L12.5 43.25 V20.75 Z" stroke="#A3E635" stroke-width="2.4"/>
      <path d="M17 26 C26 20 38 44 47 38" stroke="#4D7C0F" stroke-width="3"/>
      <path d="M17 38 C26 44 38 20 47 26" stroke="#A3E635" stroke-width="1.6" opacity=".55"/>
      <g stroke="#ECFCCB" stroke-width="3"><path d="M26.5 26 L20.5 32 L26.5 38 M37.5 26 L43.5 32 L37.5 38"/><path d="M34.2 23.5 L29.8 40.5" stroke="#A3E635"/></g>`)
  },

  // Sentinel eye on ultraviolet with a red arc beneath.
  "obsidian-arc": {
    t1: "#4F46E5", t2: "#0A0A14", tg: "#EF4444",
    svg: S(`<path d="M11 31 Q32 11 53 31 Q32 51 11 31 Z" fill="#0A0A10" fill-opacity=".55" stroke="#E2E8F0" stroke-width="2.4"/>
      <circle cx="32" cy="31" r="8" stroke="#E2E8F0" stroke-width="2"/>
      <circle cx="32" cy="31" r="3.6" fill="#EF4444"/>
      <circle cx="34" cy="28.8" r="1.1" fill="#fff"/>
      <path d="M15 47 Q32 56 50 44" stroke="#EF4444" stroke-width="2.8"/>
      <path fill="#EF4444" d="M50 44 L44.5 43.6 L48.6 49.4 Z"/>`)
  },

  // A flexed arm built from a triangulated node lattice: the strength is the data.
  "kinetic-edge": {
    t1: "#17472A", t2: "#0A0F0A", tg: "#16A34A",
    svg: S(`<path fill="#16A34A" fill-opacity=".14" stroke="#F0FDF4" stroke-width="2" d="M6 42 L11 36 L15 30 L19.5 25.5 L24.5 23 L29.5 23.5 L33.5 27 L36 31.5 L37.5 36 L37.5 26 L36 20.5 L30 16.5 L31 8 L38 3.5 L48 3.5 L54 10 L53 19 L51.5 25 L52 36 L50.5 45 L46.5 50.5 L33 51.5 L19 51 L7 50.5 Z"/>
      <path fill="#22C55E" fill-opacity=".26" d="M19.5 25.5 L24.5 23 L33 51.5 Z M24.5 23 L29.5 23.5 L33 51.5 Z M29.5 23.5 L33.5 27 L33 51.5 Z"/>
      <g stroke="#B7E4C4" stroke-width="1.05" opacity=".8"><path d="M6 42 L19 51 M11 36 L19 51 M15 30 L19 51 M19.5 25.5 L19 51 M19.5 25.5 L33 51.5 M24.5 23 L33 51.5 M29.5 23.5 L33 51.5 M33.5 27 L33 51.5 M36 31.5 L33 51.5 M37.5 36 L33 51.5 M37.5 36 L46.5 50.5 M37.5 36 L50.5 45 M37.5 26 L50.5 45 M37.5 26 L52 36 M37.5 26 L51.5 25 M36 20.5 L51.5 25 M36 20.5 L53 19 M30 16.5 L53 19 M30 16.5 L54 10 M31 8 L54 10 M31 8 L48 3.5"/></g>
      <g fill="#F0FDF4"><circle cx="6" cy="42" r="1.55"/><circle cx="7" cy="50.5" r="1.55"/><circle cx="19" cy="51" r="1.55"/><circle cx="33" cy="51.5" r="1.55"/><circle cx="46.5" cy="50.5" r="1.55"/><circle cx="50.5" cy="45" r="1.55"/><circle cx="52" cy="36" r="1.55"/><circle cx="51.5" cy="25" r="1.55"/><circle cx="53" cy="19" r="1.55"/><circle cx="54" cy="10" r="1.55"/><circle cx="48" cy="3.5" r="1.55"/><circle cx="38" cy="3.5" r="1.55"/><circle cx="31" cy="8" r="1.55"/><circle cx="30" cy="16.5" r="1.55"/><circle cx="15" cy="30" r="1.55"/><circle cx="33.5" cy="27" r="1.55"/><circle cx="37.5" cy="26" r="1.55"/></g>
      <g fill="#22C55E"><circle cx="24.5" cy="23" r="3.3"/><circle cx="11" cy="36" r="2.2"/><circle cx="37.5" cy="36" r="2.2"/><circle cx="36" cy="20.5" r="2.2"/></g>`)
  },

  // Ionic column wound by a quantum helix.
  "quantum-ledger": {
    t1: "#4C2A9E", t2: "#08081A", tg: "#8B5CF6",
    svg: S(`<g stroke="#CBD5E1"><path d="M17 14.5 H47" stroke-width="3.4"/><path d="M21 19.5 H43" stroke-width="2.4"/>
      <path d="M25.5 23.5 V44 M30 23.5 V44 M34.5 23.5 V44 M39 23.5 V44" stroke-width="2.2"/>
      <path d="M21 48 H43" stroke-width="2.4"/><path d="M17 52.5 H47" stroke-width="3.4"/></g>
      <circle cx="17.5" cy="19" r="2.6" stroke="#CBD5E1" stroke-width="1.8"/><circle cx="46.5" cy="19" r="2.6" stroke="#CBD5E1" stroke-width="1.8"/>
      <path d="M20 43 C46 39 18 31 44 27" stroke="#A78BFA" stroke-width="2.6"/>
      <circle cx="20" cy="43" r="2" fill="#DDD6FE"/><circle cx="44" cy="27" r="2" fill="#DDD6FE"/>`)
  },

  // Gold shield carrying the watchful owl.
  "juris-guard": {
    t1: "#34405E", t2: "#121826", tg: "#C9A84C",
    svg: S(`<path d="M32 8.5 L50 14.5 V30 C50 41.5 42 49.5 32 54.5 C22 49.5 14 41.5 14 30 V14.5 Z" stroke="#C9A84C" stroke-width="2.3"/>
      <path d="M21 20.5 L26.5 25 M43 20.5 L37.5 25" stroke="#C9A84C" stroke-width="2.2"/>
      <circle cx="26.5" cy="29" r="5" stroke="#E7CF86" stroke-width="2.1"/><circle cx="37.5" cy="29" r="5" stroke="#E7CF86" stroke-width="2.1"/>
      <circle cx="26.5" cy="29" r="1.9" fill="#C9A84C"/><circle cx="37.5" cy="29" r="1.9" fill="#C9A84C"/>
      <path fill="#C9A84C" d="M32 33.5 L29.8 37 L32 40.5 L34.2 37 Z"/>
      <path d="M26 43 L32 46.5 L38 43" stroke="#8A9BB0" stroke-width="1.8"/>`)
  },

  // Double helix: two teal strands with Vital Orange rungs. Twelfth division, pending activation.
  "vital-helix": {
    t1: "#2DD4BF", t2: "#115E59", tg: "#14B8A6",
    svg: S(`<path d="M24 16.5 H40 M25.5 29 H38.5 M25.5 35 H38.5 M24 47.5 H40" stroke="#F97316" stroke-width="2.6"/>
      <path d="M22 13 C22 22 42 23 42 32 C42 41 22 42 22 51" stroke="#fff" stroke-width="3.6"/>
      <path d="M42 13 C42 22 22 23 22 32 C22 41 42 42 42 51" stroke="#CCFBF1" stroke-width="3.6" opacity=".8"/>`)
  },

  // Broadcast arcs on both sides of a rising arrow.
  "signal-velocity": {
    t1: "#FB7185", t2: "#881337", tg: "#F43F5E",
    svg: S(`<path d="M32 51 V20" stroke="#fff" stroke-width="3.8"/><path d="M23.5 28.5 L32 19.5 L40.5 28.5" stroke="#fff" stroke-width="3.8"/>
      <path d="M22.5 28 A9 9 0 0 0 22.5 42" stroke="#fff" stroke-width="2.6" opacity=".95"/><path d="M41.5 28 A9 9 0 0 1 41.5 42" stroke="#fff" stroke-width="2.6" opacity=".95"/>
      <path d="M16.5 23 A15 15 0 0 0 16.5 47" stroke="#FFE4E6" stroke-width="2.2" opacity=".55"/><path d="M47.5 23 A15 15 0 0 1 47.5 47" stroke="#FFE4E6" stroke-width="2.2" opacity=".55"/>`)
  }
};

// A mark on its button tile. `size` in px; extra classes allowed.
export function tile(key, size = 44, cls = "") {
  const m = MARKS[key];
  return `<span class="tile${cls ? " " + cls : ""}" style="--sz:${size}px;--t1:${m.t1};--t2:${m.t2};--tg:${m.tg}">${m.svg}</span>`;
}

// Standalone SVG file (favicon / downloadable): the tile baked into the art.
export function tileFile(key) {
  const m = MARKS[key];
  const inner = m.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
<defs><radialGradient id="g" cx="30%" cy="15%" r="110%"><stop offset="0" stop-color="${m.t1}"/><stop offset=".72" stop-color="${m.t2}"/></radialGradient>
<linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".46" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="64" height="64" rx="18" fill="url(#g)"/><rect x=".5" y=".5" width="63" height="63" rx="17.5" fill="url(#h)" stroke="#fff" stroke-opacity=".12"/>
<g transform="translate(9.6 9.6) scale(.7)">${inner}</g></svg>`;
}
