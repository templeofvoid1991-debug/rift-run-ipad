import { safePath } from "./zip.js";

export function localPath(value) {
  const path = value.replace(/^\.\//, "").split(/[?#]/)[0];
  if (/^[a-z]+:|^\/|^\/\//i.test(path)) throw new Error("Das Paket verweist auf externe Dateien und kann nicht offline installiert werden.");
  return safePath(decodeURIComponent(path));
}

// Select the actual game page (for The Rift Run games/irregular-verb-race/START.html),
// not the outer START.html redirect. Adapted from the Lesson Arcade Cup installer.
export async function readPackage(zip, edition) {
  const candidates = [...zip.entries.keys()].filter(path =>
    (path === edition.startFile || path.endsWith("/" + edition.startFile)) && !path.startsWith("__MACOSX/"));
  if (candidates.length !== 1) throw new Error(`Bitte die ZIP von ${edition.name} auswählen.`);
  const root = candidates[0].slice(0, -edition.startFile.length);
  const html = new TextDecoder().decode(await zip.read(root + edition.startFile));
  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "";
  // The game page must carry the edition's own element ids; other ZIPs are rejected.
  const markers = edition.markers || [];
  if (!title.includes(edition.title) || markers.some(id => !new RegExp(`id=["']${id}["']`).test(html))) {
    throw new Error(`Dieses Paket gehört nicht zu ${edition.name}. Bitte die ZIP von ${edition.name} auswählen.`);
  }
  let files;
  if (zip.entries.has(root + "offline-assets.json")) {
    const list = JSON.parse(new TextDecoder().decode(await zip.read(root + "offline-assets.json")));
    if (!Array.isArray(list) || !list.length || list.some(path => typeof path !== "string")) throw new Error("Das Offline-Dateiverzeichnis ist beschädigt.");
    const runtimeList = list.map(localPath).filter(path => !/(^|\/)(?:\.DS_Store|\._[^/]+|__MACOSX)(?:\/|$)/.test(path));
    files = new Set([edition.startFile, "offline-assets.json", ...runtimeList]);
  } else {
    // Fallback for packages without an inventory: every runtime file of the subtree.
    files = new Set([...zip.entries.keys()].filter(path => path.startsWith(root)).map(path => path.slice(root.length))
      .filter(path => /\.(?:html|js|css|json|webmanifest|png|jpe?g|svg|webp|gif|woff2?|ttf|otf|mp3|wav|ogg|m4a|mp4|txt|pdf)$/i.test(path) && !/(^|\/)(tests|tmp|integration|backups)\//.test(path)));
  }
  // Script and style paths are relative to the game page, which may sit in a subfolder.
  const pageDir = edition.startFile.includes("/") ? edition.startFile.slice(0, edition.startFile.lastIndexOf("/") + 1) : "";
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    files.add(localPath(pageDir + match[1]));
  }
  for (const path of zip.entries.keys()) {
    const relative = path.slice(root.length);
    if (path.startsWith(root) && /(^|\/)LICENSE[^/]*$/i.test(relative)) files.add(relative);
  }
  for (const path of files) {
    safePath(path);
    if (!zip.entries.has(root + path)) throw new Error(`Das Paket ist unvollständig: ${path}`);
  }
  return { root, html, files };
}
