/**
 * Gestes « système » (imprimer, partager, ouvrir un lien, enregistrer un fichier) qui fonctionnent partout :
 * dans le navigateur avec les API web, dans l'application Android / HarmonyOS 2 par le pont natif de MainActivity
 * (la WebView ne gère ni window.print, ni navigator.share, ni target="_blank", ni les téléchargements).
 */
type Bridge = {
  print(title: string): void;
  share(title: string, text: string): void;
  openUrl(url: string): void;
  shareFile(name: string, mime: string, content: string): void;
};
const bridge = (): Bridge | undefined => (window as unknown as { OrigaNative?: Bridge }).OrigaNative;
export const hasNativeBridge = () => !!bridge();

export function printPage(title = 'Origa') {
  const n = bridge();
  if (n) n.print(title); else window.print();
}

/** Partage un lien. Renvoie 'copied' quand seul le presse-papiers était disponible. */
export async function shareLink(title: string, text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const n = bridge();
  if (n) { n.share(title, `${text}\n${url}`); return 'shared'; }
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'shared'; }
    await navigator.clipboard.writeText(url); return 'copied';
  } catch (e) { return (e as Error)?.name === 'AbortError' ? 'shared' : 'failed'; }
}

export function openExternal(url: string) {
  const n = bridge();
  if (n) n.openUrl(url); else window.open(url, '_blank', 'noopener');
}

export function saveText(name: string, content: string, mime = 'text/csv') {
  const n = bridge();
  if (n) { n.shareFile(name, mime, content); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
