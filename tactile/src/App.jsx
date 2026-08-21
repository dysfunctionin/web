import { useEffect, useState } from "react";
import {
  IconArrowRight,
  IconBrandApple,
  IconBrandGithub,
  IconBrandWindows,
  IconBrowser,
  IconDownload,
  IconGridDots,
  IconPalette,
  IconPlugConnected,
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

function tabFromLocation() {
  const tab = new URLSearchParams(window.location.search).get("view");
  return tabs.some(({ id }) => id === tab) ? tab : "home";
}

function ProductMark({ alpha = false }) {
  return <img src={alpha ? "/tactile-mark-alpha.svg" : "/tactile-mark.svg"} alt="" />;
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
      <div className="download-heading">
        <div><span className="eyebrow">Desktop builds</span><h2 id="download-title">Choose your Tactile</h2></div>
        <div className="channel-control" aria-label="Release channel">
          <button className={channel === "stable" ? "active" : ""} onClick={() => setChannel("stable")}>Stable</button>
          <button className={channel === "alpha" ? "active alpha" : ""} onClick={() => setChannel("alpha")}>Alpha</button>
        </div>
      </div>
      <div className="platform-control" aria-label="Operating system">
        {platforms.map(({ id, label, icon: Icon }) => (
          <button key={id} className={platform === id ? "active" : ""} onClick={() => setPlatform(id)}>
            <Icon size={18} stroke={1.6} /> {label}
          </button>
        ))}
      </div>
      <div className="download-result" aria-live="polite">
        {status === "loading" ? <p>Checking GitHub for current builds...</p> : null}
        {status === "error" ? <p>Release details are temporarily unavailable. <a href={RELEASES_PAGE}>Open GitHub Releases</a>.</p> : null}
        {status === "ready" && !release ? (
          <div className="empty-release"><strong>No stable release yet</strong><span>The first stable build will appear here automatically.</span></div>
        ) : null}
        {release ? (
          <>
            <div className="release-meta">
              <span className={`release-mark ${channel}`}><ProductMark alpha={channel === "alpha"} /></span>
              <div><strong>{release.name || release.tag_name}</strong><small>{channel === "alpha" ? "Pre-release build" : "Latest stable build"}</small></div>
            </div>
            <div className="download-actions">
              {downloads.map((item) => <a className="button primary" href={item.url} key={item.label}><IconDownload size={17} /> Download {item.label}</a>)}
              {!downloads.length ? <a className="button" href={release.html_url}>View release assets</a> : null}
            </div>
          </>
        ) : null}
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
          <h1>Keep ideas close.<br />Keep your files yours.</h1>
          <p>Arrange notes, data, documents, and media in Tiles. Open objects in place, move through nested work, and keep everything in formats you own.</p>
          <div className="hero-actions">
            <a className="button primary" href="/app/"><IconBrowser size={18} /> Use on web</a>
            <a className="button" href="#download"><IconDownload size={18} /> Download</a>
          </div>
          <small>No account required. Your workspace stays local.</small>
        </div>
        <div className="product-frame">
          <div className="window-bar"><i /><i /><i /><span>Home - Tactile</span></div>
          <img src="/tactile-feature-tour.gif" alt="Tactile workspace arranging sheets, notes, and nested objects" />
        </div>
      </section>
      <section className="feature-band" aria-label="Tactile features">
        <article><IconGridDots /><strong>Spatial and nested</strong><p>Move between sheets, documents, and files without flattening their identity.</p></article>
        <article><IconPalette /><strong>Made to feel yours</strong><p>Shape the paper, ink, density, type, and focus colors around your work.</p></article>
        <article><IconPlugConnected /><strong>Small, extensible core</strong><p>Add verified Code, PDF, Image, Audio, Video, HTML, and SVG objects when needed.</p></article>
      </section>
      <DownloadPanel />
    </main>
  );
}

function ComingPage({ title, children, icon: Icon }) {
  return <main className="coming-page"><Icon size={32} stroke={1.35} /><span className="eyebrow">Tactile tools</span><h1>{title}</h1><p>{children}</p></main>;
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => selectTab("home")} aria-label="Tactile home"><ProductMark /><strong>Tactile</strong></button>
        <nav aria-label="Primary navigation">
          {tabs.map((tab) => <button className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => selectTab(tab.id)}>{tab.label}</button>)}
        </nav>
        <a className="github-link" href="https://github.com/dysfunctionin/tactile" aria-label="Tactile on GitHub"><IconBrandGithub /></a>
      </header>
      {activeTab === "home" ? <HomePage /> : null}
      {activeTab === "themes" ? <ThemeStudio /> : null}
      {activeTab === "marketplace" ? <Marketplace /> : null}
      <footer><span><ProductMark /> Tactile</span><p>Local-first software from dysfunction.in</p><a href="https://github.com/dysfunctionin/tactile">Source <IconArrowRight size={14} /></a></footer>
    </div>
  );
}