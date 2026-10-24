import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BandeauDemo, FiletTricolore } from '@casier/design-system';

import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/source-serif-4/600.css';
import '@casier/design-system/styles.css';
import './socle.css';
import './penitentiaire.css';

import { EnTete } from '@/components/EnTete';
import { Pied } from '@/components/Pied';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: `${config.nomService} — République gabonaise`, template: `%s — ${config.nomService}` },
  description: 'Administration pénitentiaire : établissements, écrou, situation pénale et mouvements des personnes détenues. Ministère de la Justice, Garde des Sceaux, chargé des Droits humains.',
  robots: config.modeDemo ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = { themeColor: '#0F1D36', width: 'device-width', initialScale: 1 };

export default function Racine({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="cj-racine">
        <a className="cj-evitement" href="#contenu">Aller au contenu</a>
        {config.modeDemo && <BandeauDemo />}
        <FiletTricolore />
        <EnTete />
        <main id="contenu" tabIndex={-1}>{children}</main>
        <Pied />
      </body>
    </html>
  );
}
