import { Fragment, useEffect, useRef, useState } from "react";
import {
  IconArrowUpRight,
  IconBrandApple,
  IconBrandGithub,
  IconBrandWindows,
  IconDeviceDesktop,
  IconDownload,
  IconLayoutGrid,
  IconPalette,
  IconPuzzle,
  IconTerminal2,
  IconTextCaption,
} from "@tabler/icons-react";
import { packagesFor, preferredPlatform, RELEASES_PAGE, RELEASES_URL, selectChannels } from "./releases.js";
import { Marketplace } from "./Marketplace.jsx";
import { ThemeStudio } from "./ThemeStudio.jsx";

const tabs = [
  { id: "home", label: "Home" },
  { id: "themes", label: "Themes" },
  { id: "marketplace", label: "Marketplace" },
];

const platforms = [
  { id: "windows", label: "Windows", icon: IconBrandWindows },
  { id: "macos", label: "macOS", icon: IconBrandApple },
  { id: "linux", label: "Linux", icon: IconTerminal2 },
];

const swatches = ["#e8c9b8", "#e7dcae", "#c3dcc4", "#bcd6e2", "#cdc5e4", "#e4bcc0"];

const heroColumns = ["A", "B", "C", "D", "E", "F"];

const heroGrid = [
  ["", "Rent", { t: "1,450.00", k: "num" }, "", { t: "Draft: rewrite onboarding", k: "note" }, ""],
  ["", "Groceries", { t: "212.80", k: "num" }, "", "", ""],
  ["", "Transit", { t: "122.50", k: "num" }, "", { t: "q3.pdf", k: "file" }, ""],
  ["", "Total", { t: "=SUM(B1:B3)", k: "fx" }, "", "", ""],
  ["", "", "", { t: "Work", k: "nested" }, "", ""],
  ["", "", "", "", "", ""],
];

// Deep nesting story: Home -> Work -> Campaign -> reading list
const nestLevels = [
  // depth 0: Home (the main grid shown in heroGrid)
  null,
  // depth 1: a sheet opened from Home's nested tile
  {
    title: "Work",
    parents: ["Home"],
    nested: { label: "Campaign", opens: 2 },
    cells: [
      { t: "Budget sheet", k: "" },
      { t: "2,400", k: "num" },
      { t: "Draft notes", k: "note" },
      { t: "", k: "" },
      { t: "brief.pdf", k: "file" },
    ],
  },
  // depth 2: a sheet opened from the previous sheet's nested tile
  {
    title: "Campaign",
    parents: ["Home", "Work"],
    nested: { label: "Reading list", opens: 3 },
    cells: [
      { t: "Hook", k: "note" },
      { t: "Holiday", k: "" },
      { t: "Spring", k: "" },
      { t: "", k: "" },
      { t: "veto.md", k: "file" },
    ],
  },
  // depth 3: a text document
  {
    title: "Reading list",
    parents: ["Home", "Work", "Campaign"],
    nested: null,
    rows: [
      "The Design of Everyday Things",
      "Seeing Like a State",
      "Thinking in Systems",
      "How Buildings Learn",
    ],
  },
];

function normalizeCell(cell) {
  return typeof cell === "string" ? { t: cell, k: "" } : cell;
}

function tabFromLocation() {
  const tab = new URLSearchParams(window.location.search).get("view");
  return tabs.some(({ id }) => id === tab) ? tab : "home";
}

function ProductMark({ alpha = false }) {
  return <img src={alpha ? "/tactile-mark-alpha.svg" : "/tactile-mark.svg"} alt="" />;
}

function AppWindow() {
  const [sel, setSel] = useState({ r: 0, c: 0 });
  const [colors, setColors] = useState({});
  const [fmt, setFmt] = useState({ b: false, i: false, u: false });

  const [depth, setDepth] = useState(0);
  const [cursor, setCursor] = useState({ on: false, x: 0, y: 0, pressing: false });
  const [paused, setPaused] = useState(false);

  const winRef = useRef(null);
  const pausedRef = useRef(false);
  const tileRefs = useRef({});

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const nestedTileRef = (r, c) => (el) => { tileRefs.current[`${r},${c}`] = el; };

  // Position of the "Work" nested tile in the Home grid, relative to the window.
  const nestedTileCenter = () => {
    const win = winRef.current;
    const tile = tileRefs.current["4,3"];
    if (!win || !tile) return null;
    const w = win.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    return { x: t.left - w.left + t.width / 2, y: t.top - w.top + t.height / 2 };
  };

  // Position of the "Parent" button in the nested overlay, relative to the window.
  const parentCenter = () => {
    const win = winRef.current;
    const parent = winRef.current.querySelector(".nest-back");
    if (!win || !parent) return null;
    const w = win.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    return { x: p.left - w.left + p.width / 2, y: p.top - w.top + p.height / 2 };
  };

  // Position of the nested tile inside the opened sheet, relative to the window.
  const nextNestedCenter = () => {
    const win = winRef.current;
    const next = winRef.current.querySelector(".nest-grid .tile.nested");
    if (!win || !next) return null;
    const w = win.getBoundingClientRect();
    const n = next.getBoundingClientRect();
    return { x: n.left - w.left + n.width / 2, y: n.top - w.top + n.height / 2 };
  };

  // Human-like cursor movement: move to a target over a duration.
  const moveCursor = (target, onArrive) => {
    if (!target || pausedRef.current) { onArrive && onArrive(); return; }
    setCursor((c) => ({ ...c, on: true, x: target.x, y: target.y }));
    if (onArrive) window.setTimeout(() => { if (!pausedRef.current) onArrive(); }, 900); // matches CSS transition duration
  };

  // Press target with a small "click" down/up gesture, then run the action.
  const pressCursor = (target, action) => {
    if (!target || pausedRef.current) { action && action(); return; }
    setCursor((c) => ({ ...c, on: true, x: target.x, y: target.y, pressing: true }));
    window.setTimeout(() => {
      if (pausedRef.current) return;
      setCursor((c) => ({ ...c, pressing: false }));
      action && action();
    }, 260);
  };

  // Automated loop: Home -> Work -> Campaign -> Reading list -> back out.
  useEffect(() => {
    if (paused) return;
    const timers = [];
    const after = (ms, fn) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const clearAll = () => timers.forEach(clearTimeout);

    const play = () => {
      moveCursor(nestedTileCenter(), () => pressCursor(nestedTileCenter(), () => {
        setDepth(1);
        after(720, () => {
          moveCursor(nextNestedCenter(), () => pressCursor(nextNestedCenter(), () => {
            setDepth(2);
            after(720, () => {
              moveCursor(nextNestedCenter(), () => pressCursor(nextNestedCenter(), () => {
                setDepth(3);
                after(1700, () => {
                  moveCursor(parentCenter(), () => pressCursor(parentCenter(), () => {
                    setDepth(2);
                    after(520, () => {
                      moveCursor(parentCenter(), () => pressCursor(parentCenter(), () => {
                        setDepth(1);
                        after(520, () => {
                          moveCursor(parentCenter(), () => pressCursor(parentCenter(), () => {
                            setDepth(0);
                            after(700, () => { setCursor((c) => ({ ...c, on: false })); after(900, play); });
                          }));
                        });
                      }));
                    });
                  }));
                });
              }));
            });
          }));
        });
      }));
    };

    after(700, play);

    return () => { clearAll(); };
  }, [paused]);

  // If the user interacts with the hero area, send the fake cursor off in a human way.
  useEffect(() => {
    const el = winRef.current;
    if (!el) return;
    const onPointer = () => {
      setPaused(true);
      const win = el;
      const w = win.getBoundingClientRect();
      const off = { x: w.width * 0.9, y: w.height + 40 };
      setCursor((c) => ({ ...c, x: off.x, y: off.y, on: true, pressing: false }));
      window.setTimeout(() => setCursor((c) => ({ ...c, on: false })), 800);
    };
    el.addEventListener("pointermove", onPointer);
    el.addEventListener("pointerdown", onPointer);
    return () => {
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  const cell = normalizeCell(heroGrid[sel.r][sel.c]);
  const ref = heroColumns[sel.c] + (sel.r + 1);

  const tileStyle = (r, c) => {
    const base = {};
    const key = `${r},${c}`;
    if (colors[key]) base.background = colors[key];
    if (sel.r === r && sel.c === c) {
      if (fmt.b) base.fontWeight = 700;
      if (fmt.i) base.fontStyle = "italic";
      if (fmt.u) base.textDecoration = "underline";
    }
    return base;
  };

  const pickSwatch = (hex) => {
    const key = `${sel.r},${sel.c}`;
    setColors((prev) => (prev[key] === hex ? { ...prev, [key]: undefined } : { ...prev, [key]: hex }));
  };

  const level = depth > 0 ? nestLevels[depth] : null;

  return (
    <div className="app-window" ref={winRef} onPointerDown={() => setPaused(true)}>
      <div className="aw-titlebar"><i /><i /><i /><span>Home - Tactile</span></div>
      <div className="aw-body">
        <aside className="aw-side" aria-hidden="true">
          <p className="aw-kicker">Workspace</p>
          <p className="aw-workspace">Files</p>
          <div className="aw-search">Find a file or object</div>
          <div className="aw-filter"><span className="on">All</span><span>Tiles</span><span>Text</span><span>Files</span></div>
          <p className="aw-kicker">All objects</p>
          <div className="aw-item on">Home</div>
          <div className="aw-item">Budget</div>
          <div className="aw-item">Work</div>
        </aside>
        <div className="aw-main">
          <div className="aw-toolbar">
            <span className={`tb ${fmt.b ? "on" : ""}`} onClick={() => setFmt((f) => ({ ...f, b: !f.b }))}>B</span>
            <span className={`tb i ${fmt.i ? "on" : ""}`} onClick={() => setFmt((f) => ({ ...f, i: !f.i }))}>I</span>
            <span className={`tb u ${fmt.u ? "on" : ""}`} onClick={() => setFmt((f) => ({ ...f, u: !f.u }))}>U</span>
            <i />
            <span className="tb wide">11.5</span>
            <i />
            {swatches.map((color) => (
              <span
                className={`dot ${colors[`${sel.r},${sel.c}`] === color ? "active" : ""}`}
                key={color}
                style={{ background: color }}
                onClick={() => pickSwatch(color)}
              />
            ))}
            <i />
            <span className="tb">%</span><span className="tb">$</span>
          </div>
          <div className="aw-formula">
            <span className="cellref">{ref}</span>
            <span className="fx">fx</span>
            <code>{cell.t || "\u00A0"}</code>
          </div>
          <div className="aw-grid">
            <span className="aw-h" />
            {heroColumns.map((col) => <span className="aw-h" key={col}>{col}</span>)}
            {heroGrid.map((row, r) => (
              <Fragment key={r}>
                <span className="aw-h">{r + 1}</span>
                {row.map((raw, c) => {
                  const cell = normalizeCell(raw);
                  const isActive = sel.r === r && sel.c === c;
                  const isNested = cell.k === "nested";
                  return (
                    <button
                      key={c}
                      ref={isNested ? nestedTileRef(r, c) : undefined}
                      className={`tile ${cell.k} ${isActive ? "sel" : ""}`}
                      style={tileStyle(r, c)}
                      onClick={isNested ? () => setDepth(1) : () => setSel({ r, c })}
                      aria-label={cell.t || `${heroColumns[c]}${r + 1}`}
                    >
                      {isNested ? <IconLayoutGrid size={11} /> : null}
                      {cell.t}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div className="aw-status"><span>ACTIVE {ref}</span><span>256 × 64</span></div>
        </div>
      </div>

      {level ? (
        <div className="nest-overlay" key={depth}>
          <div className="nest-panel-content">
            <header className="nest-head">
              <button className="nest-back" onClick={() => setDepth(depth - 1)}><span>Parent</span></button>
              <span className="nest-crumb">
                {level.parents.map((name, i) => <span key={i}><span>{name}</span><span className="sep">/</span></span>)}
                <strong>{level.title}</strong>
              </span>
              <span className="nest-expand">Expand</span>
            </header>
            {level.nested ? (
              <div className="nest-grid nest-5">
                {level.cells.map((item, i) => (
                  <button
                    key={i}
                    className={`tile ${item.k} ${i === 0 ? "nested" : ""}`}
                    onClick={() => level.nested && setDepth(level.nested.opens)}
                    aria-label={item.t || "empty"}
                  >
                    {i === 0 ? (level.nested.opens === 3 ? <IconTextCaption size={11} /> : <IconLayoutGrid size={11} />) : null}
                    {i === 0 ? level.nested.label : item.t}
                  </button>
                ))}
              </div>
            ) : (
              <div className="nest-doc">
                <h3>{level.title}</h3>
                <ul>{level.rows.map((row, i) => <li key={i}>{row}</li>)}</ul>
              </div>
            )}
            <footer className="nest-status"><span>ACTIVE A1</span><span>256 × 64</span></footer>
          </div>
        </div>
      ) : null}

      {cursor.on ? (
        <div className={`auto-cursor ${cursor.pressing ? "pressing" : ""}`} style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)`, opacity: cursor.on ? 1 : 0 }} aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M6 3.5c-.8 0-1.3.7-1.1 1.4l4 15.2c.2.9 1.3 1.1 1.9.4l3.4-3.9 4.4 3.9 2-2.3-4.3-3.9 3.4-2.5c.7-.5.5-1.5-.3-1.7L6 3.5z" fill="var(--ink)" stroke="var(--surface)" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
    </div>
  );
}

function MiniSheet({ children }) {
  return <div className="mini-sheet" aria-hidden="true">{children}</div>;
}

function DownloadPanel() {
  const [channel, setChannel] = useState("alpha");
  const [platform, setPlatform] = useState(preferredPlatform);
  const [releases, setReleases] = useState({ alpha: null, stable: null });
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(RELEASES_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("GitHub release request failed");
        return response.json();
      })
      .then((data) => {
        setReleases(selectChannels(data));
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const release = releases[channel];
  const downloads = packagesFor(release, platform);

  return (
    <section className="download-panel" id="download" aria-labelledby="download-title">
      {/* <span className="eyebrow">Get the app</span>*/}
      <h2 id="download-title">Choose your Tactile</h2>
      <div className="download-card">
        <div className="download-controls">
          <div className="platform-control" role="group" aria-label="Operating system">
            {platforms.map(({ id, label, icon: Icon }) => (
              <button key={id} className={platform === id ? "active" : ""} onClick={() => setPlatform(id)}>
                <Icon size={16} stroke={1.6} /> {label}
              </button>
            ))}
          </div>
          <div className="channel-control" role="group" aria-label="Release channel">
            <button className={channel === "stable" ? "active" : ""} onClick={() => setChannel("stable")}>Stable</button>
            <button className={channel === "alpha" ? "active" : ""} onClick={() => setChannel("alpha")}>Alpha</button>
          </div>
        </div>
        <div className="download-result" aria-live="polite">
          {status === "loading" ? <p className="result-note">Checking GitHub for current builds&#8230;</p> : null}
          {status === "error" ? <p className="result-note">Release details are temporarily unavailable. <a href={RELEASES_PAGE}>Open GitHub Releases</a>.</p> : null}
          {status === "ready" && !release ? (
            <div className="empty-release"><strong>No {channel} release yet</strong><span>The first {channel} build will appear here automatically.</span></div>
          ) : null}
          {release ? (
            <>
              <div className="release-meta">
                <img src={channel === "alpha" ? "/tactile-mark-alpha.svg" : "/tactile-mark.svg"} alt="" />
                <div>
                  <strong>{release.name || release.tag_name}</strong>
                  <small>{channel === "alpha" ? "Pre-release build" : "Latest stable build"}, versioned on GitHub</small>
                </div>
              </div>
              <div className="download-actions">
                {downloads.map((item) => <a className="button primary" href={item.url} key={item.label}><IconDownload size={16} /> Download {item.label}</a>)}
                {!downloads.length ? <a className="button" href={release.html_url}>View release assets</a> : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <h1>Think in <span className="hero-tile">tiles</span></h1>
          <p className="lede">Lay notes, numbers, files, and whole sheets onto endless grids. Click anything to open it right there, nest as deep as the idea goes.</p>
          <div className="hero-actions">
            <a className="button primary" href="#download"><IconDownload size={17} /> Download</a>
            <a className="button" href="/app/">Try on web <IconArrowUpRight size={17} /></a>
          </div>
        </div>
        <AppWindow />
      </section>

      <section className="usecases" aria-label="What goes on a sheet">
        <header className="section-head">
          <div>
            {/* <span className="eyebrow">What goes on a sheet</span>*/}
            <h2>Numbers, notes, and files together</h2>
          </div>
          {/* <p>Every tile is its own object. Move it, nest it, open it.</p>*/}
        </header>
        <div className="usecase-grid">
          <article>
            <MiniSheet>
              <span className="tile">128</span><span className="tile num">58</span><span className="tile fx">=SUM(A1:B1)</span>
              <span className="tile">12</span><span className="tile num">9</span><span className="tile num soft">205</span>
            </MiniSheet>
            <strong>Works like a spreadsheet</strong>
            <p>Values, formulas, totals. They update as your data changes.</p>
          </article>
          <article>
            <MiniSheet>
              <span className="tile note">Call Dana Tuesday</span><span className="tile note">Ship notes for v1.2</span>
              <span className="tile note">Ideas, in context</span><span className="tile sel" />
            </MiniSheet>
            <strong>Notes where you work</strong>
            <p>Text lives beside your data, not trapped in cells.</p>
          </article>
          <article>
            <MiniSheet>
              <span className="tile file">q3.pdf</span><span className="tile file img">cover.png</span>
              <span className="tile file audio">voice.mp3</span><span className="tile" />
            </MiniSheet>
            <strong>Attach real files</strong>
            <p>PDFs, images, audio. They open in place in their original formats.</p>
          </article>
        </div>
      </section>

      <section className="principles" aria-label="Why Tactile feels different">
        <header className="section-head">
          <div>
            {/* <span className="eyebrow">Why it feels different</span>*/}
            <h2>Built to be kept</h2>
          </div>
        </header>
        <div className="principle-grid">
          <article><IconDeviceDesktop /><strong>Local-first</strong><p>Plain files on your disk. Works offline, nothing to upload.</p></article>
          <article><IconPuzzle /><strong>Extend with plugins</strong><p>Get verified objects from the marketplace, or build your own and share them.</p></article>
          <article><IconPalette /><strong>Make it yours</strong><p>Reshape paper, ink, density, and focus colors with exportable themes.</p></article>
        </div>
      </section>

      <DownloadPanel />
    </main>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState(tabFromLocation);

  useEffect(() => {
    const handlePopState = () => setActiveTab(tabFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const selectTab = (tab) => {
    const url = new URL(window.location.href);
    if (tab === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", tab);
    window.history.pushState({}, "", url);
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => selectTab("home")} aria-label="Tactile home"><ProductMark /><strong>Tactile</strong></button>
          <nav aria-label="Primary navigation">
            {tabs.map((tab) => <button className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => selectTab(tab.id)}>{tab.label}</button>)}
          </nav>
          <a className="github-link" href="https://github.com/dysfunctionin/tactile" aria-label="Tactile on GitHub"><IconBrandGithub size={19} /></a>
        </div>
      </header>
      {activeTab === "home" ? <HomePage /> : null}
      {activeTab === "themes" ? <ThemeStudio /> : null}
      {activeTab === "marketplace" ? <Marketplace /> : null}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-id"><ProductMark /><strong>Tactile</strong></div>
              <p>A spatial workspace for notes, numbers, and files.</p>
            </div>
            <nav className="footer-col" aria-label="Footer navigation">
              <span className="footer-label">Site</span>
              <button type="button" onClick={() => selectTab("home")}>Home</button>
              <button type="button" onClick={() => selectTab("themes")}>Themes</button>
              <button type="button" onClick={() => selectTab("marketplace")}>Marketplace</button>
              <a href="/app/">Web app</a>
            </nav>
            <div className="footer-col">
              <span className="footer-label">Project</span>
              <a href="https://github.com/dysfunctionin/tactile">Source <IconArrowUpRight size={13} /></a>
              <a href="https://github.com/dysfunctionin/tactile/releases">Releases <IconArrowUpRight size={13} /></a>
            </div>
            <div className="footer-col">
              <span className="footer-label">Record</span>
              <span className="footer-fact">TACTILE.DYSFUNCTION.IN</span>
              <span className="footer-fact">BUILD 2026.08</span>
            </div>
          </div>
          <div className="footer-bar">
            <span>2026 dysfunction.in</span>
            {/* <span>Made on local machines</span>*/}
          </div>
        </div>
      </footer>
    </div>
  );
}
