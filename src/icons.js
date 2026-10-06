// Raster UI icons shipped in icons/ui/ (declared in web_accessible_resources).
// Falls back to the inline SVG when the extension URL cannot be resolved,
// e.g. after the extension was reloaded while the page stayed open.

export const ICON_DIR = 'icons/ui/';

export function getIconUrl(file) {
  try {
    if (!file || !chrome.runtime?.getURL) return null;
    return chrome.runtime.getURL(ICON_DIR + file);
  } catch (_) {
    return null;
  }
}

export function renderIcon(container, file, fallbackSvg) {
  const url = getIconUrl(file);
  if (!url) {
    container.innerHTML = fallbackSvg || '';
    return container;
  }
  const img = document.createElement('img');
  img.className = 'creatio-satelite-icon';
  img.src = url;
  img.alt = '';
  img.draggable = false;
  img.addEventListener('error', () => { container.innerHTML = fallbackSvg || ''; }, { once: true });
  container.replaceChildren(img);
  return container;
}
