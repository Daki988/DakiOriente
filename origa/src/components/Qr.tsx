import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR code en SVG, généré localement (aucun service externe, fonctionne hors ligne). */
export function Qr({ value, size = 200 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#0B3D2E', light: '#FFFFFF' }, width: size })
      .then(setSvg).catch(() => setSvg(''));
  }, [value, size]);
  return <div aria-label="QR code du lot" role="img" dangerouslySetInnerHTML={{ __html: svg }} />;
}
