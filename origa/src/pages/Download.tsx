import { Logo, Icon } from '../components/Icon';

const RELEASE = 'https://github.com/Daki988/DakiOriente/releases/download/origa-latest';
const APK = `${RELEASE}/Origa-Android.apk`;
const APK_HARMONY = `${RELEASE}/Origa-HarmonyOS.apk`;

/** Page publique de téléchargement : Android et HarmonyOS 2 (APK), iPhone (application web installable). */
export function Download() {
  return (
    <div className="m-shell">
      <div className="pub-hero bg-photo" style={{ backgroundImage: 'linear-gradient(160deg,rgba(11,61,46,.92),rgba(18,128,92,.8)),url(./img/veterinaire.webp)' }}>
        <div className="brand" style={{ color: '#fff' }}><Logo dark />Origa</div>
        <h1>Installer Origa sur votre téléphone</h1>
        <span style={{ fontSize: 14, color: '#CFE7DC' }}>Suivi des fermes du programme POUFA et origine des poulets du Gabon</span>
      </div>
      <div className="content" style={{ marginTop: -18 }}>
        <div className="card">
          <h3>Android et Huawei (HarmonyOS 2)</h3>
          <a className="cta green" href={APK}><Icon name="download" />Télécharger pour Android</a>
          <a className="cta light" href={APK_HARMONY}><Icon name="download" />Télécharger pour Huawei (HarmonyOS 2)</a>
          <ol className="muted" style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Ouvrez le fichier téléchargé (« Origa-Android.apk » ou « Origa-HarmonyOS.apk »).</li>
            <li>Si le téléphone le demande, autorisez l'installation depuis cette source.</li>
            <li>Ouvrez Origa : l'application fonctionne même sans réseau.</li>
          </ol>
        </div>
        <div className="card">
          <h3>iPhone</h3>
          <ol className="muted" style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Ouvrez <b>origa-ten.vercel.app</b> dans Safari.</li>
            <li>Touchez le bouton Partager, puis « Sur l'écran d'accueil ».</li>
            <li>Origa s'ouvre ensuite comme une application, même hors ligne.</li>
          </ol>
        </div>
        <a className="cta light" href="#/">Utiliser la version web</a>
        <span className="muted" style={{ textAlign: 'center', fontSize: 12 }}>Version de démonstration avec des données fictives.</span>
      </div>
    </div>
  );
}
