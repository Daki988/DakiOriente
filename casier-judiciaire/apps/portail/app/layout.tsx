import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BandeauDemo, FiletTricolore } from '@casier/design-system';

import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/source-serif-4/600.css';
import '@casier/design-system/styles.css';
import './portail.css';

import { EnTetePortail } from '@/components/EnTetePortail';
import { PiedPortail } from '@/components/PiedPortail';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: `${config.nomService} — République gabonaise`, template: `%s — ${config.nomService}` },
  description: 'Demandez votre bulletin n°3 en ligne, suivez votre demande et vérifiez l’authenticité d’un bulletin. Ministère de la Justice, République gabonaise.',
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
        <EnTetePortail />
        <main id="contenu" tabIndex={-1}>{children}</main>
        <PiedPortail />
      </body>
    </html>
  );
}
