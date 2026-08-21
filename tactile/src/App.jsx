import { Fragment, useEffect, useState } from "react";
import {
  IconArrowUpRight,
  IconBrandApple,
  IconBrandGithub,
  IconBrandWindows,
  IconDeviceDesktop,
  IconDownload,
  IconPalette,
  IconPuzzle,
  IconStack2,
  IconTerminal2,
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

const sheetColumns = ["A", "B", "C", "D", "E", "F"];

const sheetRows = [
  ["sel:", "", "", "", "", ""],
  ["", "Rent", "num:1,450.00", "", "note:Draft \u2014 rewrite onboarding copy", ""],
  ["", "Food", "num:486.20", "", "", ""],
  ["", "Transit", "num:122.50", "", "file:q3-report.pdf", ""],
  ["", "Total", "fx:=SUM(C2:C4)", "", "", ""],
  ["", "", "", "", "", ""],
];

function tabFromLocation() {
  const tab = new URLSearchParams(window.location.search).get("view");
  return tabs.some(({ id }) => id === tab) ? tab : "home";
}

function ProductMark({ alpha = false }) {
  return <img src={alpha ? "/tactile-mark-alpha.svg" : "/tactile-mark.svg"} alt="" />;
}

function AppWindow() {
  return (
    <div className="app-window" role="img" aria-label="Preview of the Tactile workspace: a sheet of tiles holding numbers, formulas, notes, and files">
      <div className="aw-titlebar"><i /><i /><i /><span>Home &#8212; Tactile</span></div>
      <div className="aw-body">
        <aside className="aw-side" aria-hidden="true">
          <p className="aw-kicker">Workspace</p>
          <p className="aw-workspace">Files</p>
          <div className="aw-search">Find a file or object</div>
          <div className="aw-filter"><span className="on">All</span><span>Tiles</span><span>Text</span><span>Files</span></div>
          <p className="aw-kicker">All objects</p>
          <div className="aw-item on">Home</div>
          <div className="aw-item">Budget</div>
          <div className="aw-item">Reading list</div>
        </aside>
        <div className="aw-main">
          <div className="aw-toolbar" aria-hidden="true">
            <span className="tb">B</span><span className="tb i">I</span><span className="tb u">U</span>
            <i />
            <span className="tb wide">11.5</span>
            <i />
            {swatches.map((color) => <span className="dot" key={color} style={{ background: color }} />)}
            <i />
            <span className="tb">%</span><span className="tb">$</span>
          </div>
          <div className="aw-formula" aria-hidden="true">
            <span className="cellref">C5</span>
            <span className="fx">fx</span>
            <code>=SUM(C2:C4)</code>
          </div>
          <div className="aw-grid" aria-hidden="true">
            <span className="aw-h" />
            {sheetColumns.map((column) => <span className="aw-h" key={column}>{column}</span>)}
            {sheetRows.map((row, r) => (
              <Fragment key={r}>
                <span className="aw-h">{r + 1}</span>
                {row.map((cell, c) => {
                  const split = cell.indexOf(":");
                  const kind = split === -1 ? "" : cell.slice(0, split);
                  const text = split === -1 ? cell : cell.slice(split + 1);
                  return <span key={c} className={`tile ${kind}`}>{text}</span>;
                })}
              </Fragment>
            ))}
          </div>
          <div className="aw-status" aria-hidden="true"><span>ACTIVE C5</span><span>256 &#215; 64</span></div>
        </div>
      </div>
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
      <span className="eyebrow">Desktop builds</span>
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
                  <small>{channel === "alpha" ? "Pre-release build" : "Latest stable build"} &#183; versioned on GitHub</small>
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
          <span className="eyebrow">Local-first spatial workspace</span>
          <h1>Your work, laid out in <em>tiles</em><span className="accent">.</span></h1>
          <p className="lede">Tactile is a workspace where notes, numbers, and files sit side by side on endless sheets. Click any tile to open it in place &#8212; nothing to upload, nothing leaves your machine.</p>
          <div className="hero-actions">
            <a className="button primary" href="/app/">Open on web <IconArrowUpRight size={17} /></a>
            <a className="button" href="#download"><IconDownload size={17} /> Download</a>
          </div>
          <p className="micro-note">No account &#183; Works offline &#183; Plain files on your disk</p>
        </div>
        <AppWindow />
      </section>

      <section className="usecases" aria-label="What goes on a sheet">
        <header className="section-head">
          <div>
            <span className="eyebrow">What goes on a sheet</span>
            <h2>Numbers, notes, and files &#8212; together.</h2>
          </div>
          <p>Every tile is its own object. Move it, nest it, link it, or open it without leaving the sheet.</p>
        </header>
        <div className="usecase-grid">
          <article>
            <MiniSheet>
              <span className="tile">128</span><span className="tile num">58</span><span className="tile fx">=SUM(A1:B1)</span>
              <span className="tile">12</span><span className="tile num">9</span><span className="tile num soft">205</span>
            </MiniSheet>
            <strong>Work like a spreadsheet</strong>
            <p>Type values, write formulas, and let totals follow your data as it moves.</p>
          </article>
          <article>
            <MiniSheet>
              <span className="tile note">Call Dana Tuesday</span><span className="tile note">Ship notes for v1.2</span>
              <span className="tile note">Ideas &#8594; /inbox</span><span className="tile sel" />
            </MiniSheet>
            <strong>Think in plain notes</strong>
            <p>Jot text right next to your data. Notes are objects too, not comments trapped in cells.</p>
          </article>
          <article>
            <MiniSheet>
              <span className="tile file">q3-report.pdf</span><span className="tile file img">cover-photo.png</span>
              <span className="tile file audio">voice-memo.mp3</span><span className="tile" />
            </MiniSheet>
            <strong>Attach real files</strong>
            <p>Drop in PDFs, images, audio, or code. They open in place and stay in formats you own.</p>
          </article>
        </div>
      </section>

      <section className="principles" aria-label="Why Tactile feels different">
        <header className="section-head">
          <div>
            <span className="eyebrow">Why it feels different</span>
            <h2>Built to be kept.</h2>
          </div>
        </header>
        <div className="principle-grid">
          <article><IconDeviceDesktop /><strong>Local-first</strong><p>Your workspace is plain files on your disk. No account, no cloud lock-in, works offline.</p></article>
          <article><IconStack2 /><strong>Spatial and nested</strong><p>Open objects inside objects. Move through nested work without losing where you are.</p></article>
          <article><IconPuzzle /><strong>Small, extensible core</strong><p>Add verified Code, PDF, Image, Audio, Video, HTML, and SVG objects only when you need them.</p></article>
          <article><IconPalette /><strong>Made to feel yours</strong><p>Themes reshape paper, ink, density, and focus colors. Export them, share them, keep them.</p></article>
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
              <p>A local-first spatial workspace. Files stay files, on your machine.</p>
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
              <span className="footer-fact">NO ACCOUNTS &#183; PLAIN FILES</span>
            </div>
          </div>
          <div className="footer-bar">
            <span>&#169; 2026 dysfunction.in</span>
            <span>Made on local machines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
