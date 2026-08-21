export const THEME_VERSION = 1;

export const baseTokens = {
  colorScheme: "light",
  appBackground: "#ede9e2",
  paper: "#fbfaf6",
  paperElevated: "#fffefa",
  tray: "#e9e5dd",
  cell: "#fbfaf6",
  cellHover: "#fffefa",
  ink: "#181816",
  defaultInk: "#2c2925",
  muted: "#6f6b64",
  faint: "#9a958d",
  line: "#d8d3ca",
  lineStrong: "#c7c0b5",
  accent: "#b34d35",
  accentSoft: "rgba(179, 77, 53, 0.18)",
  focusRing: "#a94530",
  positive: "#4f6b55",
  negative: "#9b4032",
  selectionBackground: "rgba(179, 77, 53, 0.18)",
  selectionForeground: "#181816",
  surfaceHighlight: "rgba(255,255,255,.82)",
  surfaceHighlightSoft: "rgba(255,255,255,.42)",
  elevationShadow: "rgba(49,41,32,.18)",
  cellRadius: 5,
  cellGap: 1,
  cellHeight: 30,
  columnWidth: 126,
  rowHeaderWidth: 34,
  columnHeaderHeight: 25,
  uiFont: '"Public Sans Variable", sans-serif',
  monoFont: '"Lilex Variable", monospace',
  titleWeight: 620,
  titleTracking: "-0.035em",
  titleSize: 20,
  cellShadow: "inset 0 1px 0 rgba(255,255,255,.82), 0 1px 2px rgba(49,41,32,.16)",
  cellHoverShadow: "inset 0 1px 0 rgba(255,255,255,.82), 0 3px 7px rgba(49,41,32,.18)",
};

const darkDepth = {
  colorScheme: "dark",
  surfaceHighlight: "rgba(255,255,255,.06)",
  surfaceHighlightSoft: "rgba(255,255,255,.03)",
  elevationShadow: "rgba(0,0,0,.42)",
};

export const foundations = [
  { id: "paper-public", name: "Tactile Day", description: "Warm ivory and rust focus.", tokens: baseTokens },
  { id: "paper-slate", name: "Slate Paper", description: "Cool technical paper with blue focus.", tokens: { ...baseTokens, appBackground: "#e8ebeb", paper: "#f7f8f6", paperElevated: "#fcfdfb", tray: "#e2e6e5", cell: "#f7f8f6", ink: "#192022", muted: "#637074", line: "#cfd6d5", lineStrong: "#bac5c5", accent: "#476d82", focusRing: "#3e657a" } },
  { id: "one-dark", name: "Tactile Night", description: "Graphite paper with clear blue focus.", tokens: { ...baseTokens, ...darkDepth, appBackground: "#21252b", paper: "#282c34", paperElevated: "#2c313c", tray: "#21252b", cell: "#282c34", cellHover: "#2c313c", ink: "#abb2bf", defaultInk: "#abb2bf", muted: "#828997", faint: "#5c6370", line: "#3e4451", lineStrong: "#4b5263", accent: "#61afef", focusRing: "#528bff", positive: "#98c379", negative: "#e06c75" } },
];

export function normalizeTheme(theme) {
  if (!theme || typeof theme !== "object") throw new Error("This is not a Tactile theme.");
  const provided = theme.tokens && typeof theme.tokens === "object" ? theme.tokens : {};
  const tokens = { ...baseTokens, ...(provided.colorScheme === "dark" ? darkDepth : {}), ...provided };
  return {
    ...theme,
    id: String(theme.id || `theme_${crypto.randomUUID()}`),
    name: String(theme.name || "Imported theme"),
    description: String(theme.description || ""),
    version: Number(theme.version || THEME_VERSION),
    builtIn: false,
    tokens: {
      ...tokens,
      defaultInk: provided.defaultInk ?? provided.ink ?? tokens.defaultInk,
      selectionBackground: provided.selectionBackground ?? tokens.accentSoft,
      selectionForeground: provided.selectionForeground ?? tokens.ink,
    },
  };
}

export function themeVariables(theme) {
  const tokens = theme.tokens;
  return {
    colorScheme: tokens.colorScheme,
    "--preview-app": tokens.appBackground,
    "--preview-paper": tokens.paper,
    "--preview-raised": tokens.paperElevated,
    "--preview-tray": tokens.tray,
    "--preview-cell": tokens.cell,
    "--preview-ink": tokens.ink,
    "--preview-muted": tokens.muted,
    "--preview-faint": tokens.faint,
    "--preview-line": tokens.line,
    "--preview-line-strong": tokens.lineStrong,
    "--preview-accent": tokens.accent,
    "--preview-positive": tokens.positive,
    "--preview-negative": tokens.negative,
    "--preview-radius": `${tokens.cellRadius}px`,
    "--preview-gap": `${tokens.cellGap}px`,
    "--preview-height": `${tokens.cellHeight}px`,
    "--preview-column": `${tokens.columnWidth}px`,
    "--preview-ui": tokens.uiFont,
    "--preview-mono": tokens.monoFont,
  };
}

export function downloadTheme(theme) {
  const portable = normalizeTheme(theme);
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(portable, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `${portable.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "theme"}.tactile-theme.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}