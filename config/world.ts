// Height each section occupies, in pixels. Cards are vertically centred in this space.
// Default: one full viewport height per section.
// To make the page taller and more spacious, increase this.
export const SECTION_HEIGHT_PX = 900;

// Height before the first section anchor. Set to 800 to create a proper hero
// landing zone in the first viewport. The HeroSection component occupies this space.
export const HEADER_HEIGHT_PX = 800;

// Extra space after the last section anchor (for the footer zone and social links).
export const FOOTER_HEIGHT_PX = 300;

// Horizontal distance from viewport centre to each spine anchor point.
// Cards start 20px beyond the anchor (see B.1), so a card occupies from
// ±(CARD_OFFSET_PX + 20) to ±(CARD_OFFSET_PX + 20 + CARD_WIDTH_PX) from centre —
// 500px per side at the defaults. Below ~1100px-wide viewports cards approach the
// screen edge; lower this value if small laptops are a target.
export const CARD_OFFSET_PX = 200;

// Controls how smoothly the spine curves between anchors.
// This is the vertical distance of the bezier control handles.
// Higher = gentler S-curves. Lower = sharper turns.
export const SPINE_CONTROL_DISTANCE_PX = 220;

// Width of each content card in pixels.
export const CARD_WIDTH_PX = 280;

// Scroll T thresholds for zone changes.
// v2 beats (sky = ~¾ of the journey): orbit + atmosphere to 0.5, golden-hour
// approach to 0.72, the crossing itself to 0.80, then the deep. Keep in step
// with lib/descent.ts (CROSS_T, zoneWeights) when retuning.
export const ZONE_THRESHOLDS = {
  sky: 0,           // always starts here
  horizon: 0.50,    // golden-hour descent, sea visible below
  sea: 0.72,        // breaking the surface
  underwater: 0.80, // below it
} as const;

// Mobile breakpoint — THE single source (B10): lib/useMobile.ts builds its
// matchMedia query from this constant. The CSS twin lives in
// styles/globals.css as `@media (max-width: 767px)` (CSS cannot read TS);
// if this number changes, change those media queries in the same edit.
export const MOBILE_BREAKPOINT_PX = 768;

// ─── The mobile world (A1) ──────────────────────────────────────────────────
// On phones the journey is a designed world of ~7.8 small viewports, not a
// stack of cards. Units are svh (stable while browser chrome collapses);
// the CSS in globals.css turns these numbers into real heights via custom
// properties set on the world container in app/page.tsx.

/** Hero landing zone height, in svh. */
export const MOBILE_HERO_SVH = 100;

/** Height of each section slot, in svh — room for the world to move between
 *  transmissions. */
export const MOBILE_SECTION_SVH = 140;

/** Seafloor/footer zone height, in svh. */
export const MOBILE_FOOTER_SVH = 120;

/** Horizontal position of the mobile wake gutter (A3), in vw. Cards indent
 *  off it: their slots start at calc(gutter + 22px) — see .card-slot in
 *  globals.css and MobileSpine's connector geometry. */
export const MOBILE_GUTTER_VW = 11;
