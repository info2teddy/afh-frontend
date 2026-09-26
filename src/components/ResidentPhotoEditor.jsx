// src/components/ResidentPhotoEditor.jsx
// The resident's photo in the profile header, with Add / Change / Remove.
// Images are shrunk in the browser (longest side 800px, JPEG) before upload,
// so a phone photo of several MB lands as roughly 100 KB.
import { useRef, useState } from "react";
import { api } from "../lib/api";
import { Icon } from "./icons";
import { ResidentPhoto } from "./ResidentPhoto";

const MAX_SIDE = 800;

async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that image."))), "image/jpeg", 0.85)
  );
}

// children (the name and subtitle) sit beside the photo, above the links.
export function ResidentPhotoEditor({ resident, onChange, children }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const has = !!resident.photoUpdatedAt;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { photoUpdatedAt } = await api.residents.uploadPhoto(resident.id, await shrink(file));
      onChange(photoUpdatedAt);
    } catch (err) {
      setError(err.message || "Couldn't upload that photo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await api.residents.removePhoto(resident.id);
      onChange(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={has ? "Change photo" : "Add photo"}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none"
      >
        <ResidentPhoto resident={resident} size="thumb" />
        <span className={`absolute inset-0 grid place-items-center bg-stone-900/45 text-white transition-opacity ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
          {busy ? <span className="text-xs">Saving…</span> : <Icon name="camera" className="h-6 w-6" />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      <div>
        {children}
        <div className="mt-1.5 text-xs">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="font-medium text-brand-600 hover:underline">
          {has ? "Change photo" : "Add photo"}
        </button>
        {has && (
          <>
            <span className="text-stone-300"> · </span>
            <button type="button" onClick={handleRemove} disabled={busy} className="text-stone-500 hover:text-stone-800 hover:underline">
              Remove
            </button>
          </>
        )}
        </div>
        {error && <p className="mt-1 max-w-[20rem] text-xs text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
