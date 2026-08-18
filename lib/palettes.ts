export type PaletteId = "cream-lavender" | "sage-clay" | "blush-plum" | "honey-rosewood";

export const PALETTE_STORAGE_KEY = "ad-journal-palette";

export const PALETTES: {
  id: PaletteId;
  name: string;
  emoji: string;
  swatch: [string, string, string];
}[] = [
  { id: "cream-lavender", name: "Cream & Lavender", emoji: "🤍", swatch: ["#faf6f0", "#8b7aa8", "#a8c4a2"] },
  { id: "sage-clay", name: "Sage & Clay", emoji: "🌿", swatch: ["#f0f3ec", "#c17a4f", "#93b48a"] },
  { id: "blush-plum", name: "Blush & Plum", emoji: "🌸", swatch: ["#faf1ee", "#7a4a63", "#d9a8ab"] },
  { id: "honey-rosewood", name: "Honey & Rosewood", emoji: "🍯", swatch: ["#f7ecd9", "#7a3b34", "#8a9b6e"] },
];

export const DEFAULT_PALETTE: PaletteId = "cream-lavender";

/** Inlined into <head> as a blocking script so the saved palette applies before first paint. */
export const noFlashPaletteScript = `
(function () {
  try {
    var p = localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});
    if (p) document.documentElement.setAttribute("data-palette", p);
  } catch (e) {}
})();
`;
