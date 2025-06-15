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
// These determine at what scroll progress the environment zone changes.
// Adjust these to make zones longer or shorter.
export const ZONE_THRESHOLDS = {
  sky: 0,           // always starts here
  horizon: 0.35,    // spine enters the sea-level area
  sea: 0.55,        // fully at sea level
  underwater: 0.72, // below the surface
} as const;

// Mobile breakpoint. This value is intentionally duplicated in lib/useMobile.ts —
// that file's isolation rule forbids it from importing config/, so there is no way
// to share this constant. If you change this number, also change the literal 768
// inside lib/useMobile.ts (F0.10). Nothing will warn you if the two drift apart.
export const MOBILE_BREAKPOINT_PX = 768;
