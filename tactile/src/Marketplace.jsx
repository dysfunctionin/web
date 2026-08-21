import { useEffect, useState } from "react";
import {
  IconBrackets,
  IconCode,
  IconFileDescription,
  IconFileTypeHtml,
  IconFileTypePdf,
  IconHeadphones,
  IconPhoto,
  IconSearch,
  IconShieldCheck,
  IconVideo,
  IconX,
} from "@tabler/icons-react";

const CATALOG_URL = "https://raw.githubusercontent.com/dysfunctionin/tactile/main/marketplace/dist/catalog.json";
const SOURCE_URL = "https://github.com/dysfunctionin/tactile/tree/main/marketplace/plugins";

const fallback = [
  { packageId: "tactile.audio", type: "audio", name: "Audio", description: "A locally attached audio file.", version: "1.0.0", tactile: ">=1.1.0", permissions: ["media.playback"], extensions: ["mp3", "wav", "ogg", "flac", "m4a", "aac"], status: "available", size: 23136, assets: [] },
  { packageId: "tactile.code", type: "code", name: "Code", description: "A local source file with language-aware presentation.", version: "1.0.0", tactile: ">=1.1.0", permissions: ["code.execute"], status: "available", size: 1093952, assets: [] },
  { packageId: "tactile.html", type: "html", name: "HTML", description: "A local HTML document.", version: "1.0.0", tactile: ">=1.1.0", permissions: ["native.html-preview"], extensions: ["html", "htm"], status: "available", size: 12708, assets: [] },
  { packageId: "tactile.image", type: "image", name: "Image", description: "A locally attached image.", version: "1.0.0", tactile: ">=1.1.0", permissions: [], extensions: ["png", "jpg", "gif", "webp"], status: "available", size: 10710, assets: [] },
  { packageId: "tactile.pdf", type: "pdf", name: "PDF", description: "A locally attached PDF document.", version: "1.0.0", tactile: ">=1.1.0", permissions: ["worker.create"], extensions: ["pdf"], status: "available", size: 351286, assets: [{ size: 1375838 }] },
  { packageId: "tactile.svg", type: "svg", name: "SVG", description: "A locally attached vector image.", version: "1.0.0", tactile: ">=1.1.0", permissions: [], extensions: ["svg"], status: "available", size: 11046, assets: [] },
  { packageId: "tactile.video", type: "video", name: "Video", description: "A locally attached video.", version: "1.0.0", tactile: ">=1.1.0", permissions: ["media.playback", "media.picture-in-picture", "media.fullscreen"], extensions: ["mp4", "webm"], status: "available", size: 26150, assets: [] },
];

const categories = ["All", "Documents", "Media", "Developer"];
const mediaTypes = new Set(["audio", "image", "svg", "video"]);

function categoryFor(type) {
  if (mediaTypes.has(type)) return "Media";
  if (["code", "html", "example-counter"].includes(type)) return "Developer";
  return "Documents";
}

function iconFor(type) {
  if (type === "audio") return IconHeadphones;
  if (type === "code") return IconCode;
  if (type === "html") return IconFileTypeHtml;
  if (type === "image" || type === "svg") return IconPhoto;
  if (type === "pdf") return IconFileTypePdf;
  if (type === "video") return IconVideo;
  return IconBrackets;
}

function formatSize(entry) {
  const bytes = Number(entry.size || 0) + (entry.assets || []).reduce((total, asset) => total + Number(asset.size || 0), 0);
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PluginCard({ entry, onOpen }) {
  const Icon = iconFor(entry.type);
  return (
    <button className="plugin-card" onClick={onOpen}>
      <span className={`store-icon type-${entry.type}`}><Icon size={27} stroke={1.4} /></span>
      <span className="plugin-card-copy"><strong>{entry.name}</strong><small>{entry.description}</small></span>
      <span className="plugin-card-meta"><span>First party</span><i /> <span>v{entry.version}</span><i /> <span>{formatSize(entry)}</span></span>
    </button>
  );
}

function PluginDialog({ entry, onClose }) {
  if (!entry) return null;
  const Icon = iconFor(entry.type);
  return (
    <div className="dialog-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="plugin-dialog" role="dialog" aria-modal="true" aria-labelledby="plugin-dialog-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close details"><IconX size={18} /></button>
        <div className="dialog-title"><span className={`store-icon type-${entry.type}`}><Icon size={31} stroke={1.35} /></span><div><span>Verified first-party object</span><h2 id="plugin-dialog-title">{entry.name}</h2><code>{entry.packageId}</code></div></div>
        <p className="dialog-description">{entry.description}</p>
        <dl>
          <div><dt>Version</dt><dd>{entry.version}</dd></div>
          <div><dt>Requires Tactile</dt><dd>{entry.tactile}</dd></div>
          <div><dt>Download size</dt><dd>{formatSize(entry)}</dd></div>
          <div><dt>Formats</dt><dd>{entry.extensions?.join(", ") || "Tactile object"}</dd></div>
          <div><dt>Permissions</dt><dd>{entry.permissions?.join(", ") || "None"}</dd></div>
        </dl>
        <div className="verified-note"><IconShieldCheck size={19} /><p><strong>Installed safely inside Tactile</strong><span>The app verifies package size and SHA-256 before activation.</span></p></div>
        <div className="dialog-actions"><a className="button" href={`${SOURCE_URL}/${entry.type}`}>View source</a><a className="button primary" href="/app/">Open Tactile</a></div>
      </section>
    </div>
  );
}

export function Marketplace() {
  const [catalog, setCatalog] = useState(fallback);
  const [status, setStatus] = useState("Loading current catalog...");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(CATALOG_URL, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((data) => {
        if (data.schemaVersion !== 1 || !Array.isArray(data.plugins)) throw new Error("Invalid catalog");
        setCatalog(data.plugins);
        setStatus("Live catalog");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("Showing bundled catalog");
      });
    return () => controller.abort();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = catalog.filter((entry) => {
    const matchesCategory = category === "All" || categoryFor(entry.type) === category;
    const matchesQuery = !normalizedQuery || `${entry.name} ${entry.description} ${entry.type}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="marketplace-page">
      <header className="marketplace-hero"><span className="eyebrow">Tactile marketplace</span><h1>Bring the objects you need.</h1><p>First-party extensions keep the core small. Browse here, then install verified packages from inside Tactile.</p></header>
      <div className="marketplace-tools">
        <label className="store-search"><IconSearch size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects" aria-label="Search marketplace" /></label>
        <div className="category-control" aria-label="Marketplace categories">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      </div>
      <div className="catalog-heading"><p><strong>{visible.length}</strong> objects</p><span>{status}</span></div>
      <section className="plugin-grid" aria-label="Marketplace objects">{visible.map((entry) => <PluginCard entry={entry} onOpen={() => setSelected(entry)} key={entry.packageId} />)}</section>
      {!visible.length ? <div className="catalog-empty"><IconFileDescription /><strong>No objects found</strong><span>Try a different search or category.</span></div> : null}
      <PluginDialog entry={selected} onClose={() => setSelected(null)} />
    </main>
  );
}