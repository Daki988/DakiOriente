import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { save } from '../data/repo';
import { BackBar, Stepper, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { useCurrentBand, useSession, useSettings } from '../app/hooks';
import { today, uid } from '../domain/ids';

/** Réduit une photo à 900 px de large (JPEG 70 %) pour limiter les données mobiles. */
async function compress(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 900 / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}

/** Déclaration sanitaire : transmise aux seuls services vétérinaires (§ 5.2). */
export function HealthReportPage() {
  const s = useSession();
  const cur = useCurrentBand(s.farmId);
  const settings = useSettings();
  const nav = useNavigate();
  const [toast, show] = useToast();
  const [signs, setSigns] = useState<string[]>([]);
  const [affected, setAffected] = useState(0);
  const [photo, setPhoto] = useState<string>();
  const [note, setNote] = useState('');
  const band = cur?.band;
  if (!band) return null;
  const toggle = (x: string) => setSigns((v) => (v.includes(x) ? v.filter((y) => y !== x) : [...v, x]));

  async function submit() {
    const at = new Date().toISOString();
    const id = uid();
    await save('reports', { id, bandId: band!.id, farmId: band!.farmId, date: today(), signs, affected, photo, note: note || undefined }, 'déclaration sanitaire');
    await save('alerts', { id: uid(), farmId: band!.farmId, bandId: band!.id, createdAt: at, source: 'declaration', message: `${signs.join(', ')} · ${affected} animaux touchés`, status: 'nouvelle', history: [{ at, status: 'nouvelle', by: s.userLabel }] }, 'alerte déclarée');
    show('Signalement envoyé aux services vétérinaires');
    setTimeout(() => nav('/'), 900);
  }

  return (
    <>
      <BackBar title="Signaler un problème" sub="Envoyé uniquement aux services vétérinaires" />
      <div className="content">
        <div className="card">
          <h3>Qu'observez-vous ?</h3>
          <div className="chips">
            {settings.clinicalSigns.map((x) => (
              <button key={x} className={`chip${signs.includes(x) ? ' sel' : ''}`} aria-pressed={signs.includes(x)} onClick={() => toggle(x)}>{x}</button>
            ))}
          </div>
        </div>
        <Stepper label="Animaux touchés" hint="estimation" value={affected} onChange={setAffected} />
        <label className="photo">
          {photo ? <img src={photo} alt="Photo jointe" /> : <><Icon name="camera" size={22} />Ajouter une photo</>}
          <input type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await compress(f)); }} />
        </label>
        <label className="f">Précisions (facultatif)<textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="note red"><Icon name="warn" size={18} />Isolez les animaux malades et ne vendez pas ce lot avant l'avis du vétérinaire.</div>
        <button className="cta red" disabled={!signs.length} onClick={submit}>Envoyer au vétérinaire</button>
      </div>
      {toast}
    </>
  );
}
