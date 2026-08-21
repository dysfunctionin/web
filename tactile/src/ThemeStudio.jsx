import { useRef, useState } from "react";
import { IconDownload, IconFileUpload, IconPalette, IconRefresh } from "@tabler/icons-react";
import { downloadTheme, foundations, normalizeTheme, themeVariables } from "./themes.js";

const colors = [
  ["appBackground", "App background"], ["paper", "Paper"], ["paperElevated", "Raised paper"],
  ["tray", "Tile tray"], ["cell", "Tile face"], ["cellHover", "Hover face"],
  ["ink", "Ink"], ["defaultInk", "Default tile ink"], ["muted", "Muted ink"],
  ["faint", "Faint ink"], ["line", "Fine rule"], ["lineStrong", "Strong rule"],
  ["accent", "Focus accent"], ["focusRing", "Keyboard focus"], ["positive", "Positive data"], ["negative", "Negative data"],
];

const dimensions = [
  ["cellHeight", "Tile height", 24, 44], ["columnWidth", "Tile width", 84, 220],
  ["cellRadius", "Tile radius", 0, 14], ["cellGap", "Tile gap", 0, 5],
  ["titleSize", "Title size", 17, 22], ["titleWeight", "Title weight", 400, 780],
];

function initialTheme() {
  try {
    const saved = localStorage.getItem("tactile.website.theme-draft");
    if (saved) return normalizeTheme(JSON.parse(saved));
  } catch {
    localStorage.removeItem("tactile.website.theme-draft");
  }
  return normalizeTheme({ ...foundations[0], id: "theme_website", name: "My Tactile theme" });
}

function WorkspacePreview({ theme }) {
  return (
    <div className="workspace-preview" style={themeVariables(theme)}>
      <div className="preview-titlebar"><img src="/tactile-mark.svg" alt="" /><span>Home</span><i>Saved locally</i></div>
      <div className="preview-formula"><code>A1</code><span>fx</span><p>Welcome to Tactile</p></div>
      <div className="preview-sheet">
        <span className="corner" />{["A", "B", "C", "D"].map((item) => <span className="column" key={item}>{item}</span>)}
        {[1, 2, 3, 4].flatMap((row) => [
          <span className="row" key={`r${row}`}>{row}</span>,
          ...[1, 2, 3, 4].map((column) => <span className={`tile ${row === 1 && column === 1 ? "selected" : ""}`} key={`${row}-${column}`}>{row === 1 && column === 1 ? "Ideas" : row === 2 && column === 2 ? "42" : row === 3 && column === 3 ? "Notes ]" : ""}</span>),
        ])}
      </div>
      <div className="preview-status"><span>Home / Sheet</span><span>100%</span></div>
    </div>
  );
}

export function ThemeStudio() {
  const [theme, setTheme] = useState(initialTheme);
  const [message, setMessage] = useState("Drafts are saved in this browser.");
  const inputRef = useRef(null);

  const replaceTheme = (next) => {
    const normalized = normalizeTheme(next);
    setTheme(normalized);
    localStorage.setItem("tactile.website.theme-draft", JSON.stringify(normalized));
  };
  const update = (patch) => replaceTheme({ ...theme, ...patch });
  const updateToken = (token, value) => replaceTheme({ ...theme, tokens: { ...theme.tokens, [token]: value } });
  const applyFoundation = (id) => {
    const foundation = foundations.find((item) => item.id === id);
    replaceTheme({ ...foundation, id: theme.id, name: theme.name, builtIn: false, tokens: { ...foundation.tokens } });
  };
  const importTheme = async (file) => {
    try {
      replaceTheme(JSON.parse(await file.text()));
      setMessage(`Imported ${file.name}`);
    } catch (error) {
      setMessage(error instanceof SyntaxError ? "That file is not valid JSON." : error.message);
    }
  };

  return (
    <main className="studio-page">
      <header className="page-intro"><span className="eyebrow">Theme studio</span><h1>Make the workspace feel like yours.</h1><p>Build a theme that imports directly into Tactile. The preview is a lightweight model, not the running app.</p></header>
      <div className="studio-layout">
        <section className="theme-controls" aria-label="Theme controls">
          <div className="control-heading"><IconPalette /><div><strong>Theme details</strong><small>{message}</small></div></div>
          <label className="text-control"><span>Name</span><input value={theme.name} onChange={(event) => update({ name: event.target.value })} /></label>
          <label className="text-control"><span>Description</span><input value={theme.description} onChange={(event) => update({ description: event.target.value })} /></label>
          <label className="text-control"><span>Foundation</span><select onChange={(event) => applyFoundation(event.target.value)} defaultValue="paper-public">{foundations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="text-control"><span>Appearance</span><select value={theme.tokens.colorScheme} onChange={(event) => updateToken("colorScheme", event.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <fieldset><legend>Paper and ink</legend><div className="color-grid">{colors.map(([token, label]) => <label key={token}><input type="color" value={theme.tokens[token]} onChange={(event) => updateToken(token, event.target.value)} /><span>{label}</span><code>{theme.tokens[token]}</code></label>)}</div></fieldset>
          <fieldset><legend>Density and shape</legend><div className="range-grid">{dimensions.map(([token, label, min, max]) => <label key={token}><span>{label}</span><input type="range" min={min} max={max} value={theme.tokens[token]} onChange={(event) => updateToken(token, Number(event.target.value))} /><output>{theme.tokens[token]}</output></label>)}</div></fieldset>
          <div className="theme-actions">
            <button onClick={() => inputRef.current?.click()}><IconFileUpload size={16} /> Import</button>
            <button onClick={() => { localStorage.removeItem("tactile.website.theme-draft"); replaceTheme({ ...foundations[0], id: "theme_website", name: "My Tactile theme" }); }}><IconRefresh size={16} /> Reset</button>
            <button className="primary" onClick={() => downloadTheme(theme)}><IconDownload size={16} /> Export theme</button>
            <input ref={inputRef} type="file" accept=".json,.tactile-theme.json,application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importTheme(file); }} />
          </div>
        </section>
        <section className="preview-panel"><div className="preview-heading"><span>Live preview</span><code>{theme.tokens.colorScheme}</code></div><WorkspacePreview theme={theme} /></section>
      </div>
    </main>
  );
}