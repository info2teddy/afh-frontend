// src/components/ResidentPhoto.jsx
// A resident's photo, or their initials on a muted wash when none is on file.
// Photos are PHI, so they're fetched with the login's token (api.residents.
// photoUrl) rather than linked publicly. Blob URLs are cached per resident
// and photo version, so a list of cards fetches each photo once.
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const cache = new Map(); // `${id}:${photoUpdatedAt}` -> Promise<blobUrl | null>

function loadPhoto(id, version) {
  const key = `${id}:${version}`;
  if (!cache.has(key)) cache.set(key, api.residents.photoUrl(id).catch(() => null));
  return cache.get(key);
}

// Muted, app-toned washes (slate, clay, stone, sage, sand, dusk), picked by
// resident id so each person keeps the same one everywhere.
const WASHES = [
  ["#c9d2df", "#7d8fac"],
  ["#e6d3c8", "#b98f7b"],
  ["#dcd8d3", "#9c948b"],
  ["#cfd9cf", "#8aa08c"],
  ["#e5dcc6", "#b5a47e"],
  ["#cfd0dd", "#8a8ba6"],
];
function washFor(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return WASHES[h % WASHES.length];
}
function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// size: "card" (fills its frame, big initials) | "thumb" | "large"
export function ResidentPhoto({ resident, className = "", size = "card" }) {
  const version = resident.photoUpdatedAt || null;
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let live = true;
    setUrl(null);
    if (version) loadPhoto(resident.id, version).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [resident.id, version]);

  if (url) {
    return <img src={url} alt={`Photo of ${resident.name}`} className={`h-full w-full object-cover ${className}`} />;
  }
  const [from, to] = washFor(resident.id);
  const text = size === "thumb" ? "text-base" : size === "large" ? "text-4xl" : "text-5xl";
  return (
    <div
      role="img"
      aria-label={`${resident.name} (no photo yet)`}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 30% 25%, ${from}, ${to})` }}
    >
      <span className="absolute -right-6 -bottom-8 h-28 w-28 rounded-full bg-white/15" aria-hidden="true" />
      <span className={`font-display font-medium text-white/90 ${text}`}>{initials(resident.name)}</span>
    </div>
  );
}
