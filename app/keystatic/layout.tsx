import KeystaticApp from "./keystatic";

export const metadata = { title: "Administration · Jackboy", robots: { index: false, follow: false } };

/** Layout racine séparé : l'administration n'hérite pas de l'habillage du site. */
export default function Layout() {
  return (
    <html lang="fr">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
