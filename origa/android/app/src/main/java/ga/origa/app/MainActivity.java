package ga.origa.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView web = getBridge().getWebView();
        // Zoom de la page désactivé dans l'application (Android, HarmonyOS 2) : ni pincement ni boutons de zoom.
        WebSettings settings = web.getSettings();
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        // La WebView Android ne sait ni imprimer (window.print), ni partager (navigator.share), ni télécharger un fichier
        // généré, ni ouvrir un nouvel onglet : ces gestes passent par ce pont natif (src/app/native.ts).
        web.addJavascriptInterface(new NativeBridge(), "OrigaNative");
    }

    private class NativeBridge {
        /** Imprime la page affichée (styles d'impression appliqués) ; « Enregistrer au format PDF » est proposé. */
        @JavascriptInterface
        public void print(final String title) {
            runOnUiThread(() -> {
                WebView web = getBridge().getWebView();
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                String name = title == null || title.isEmpty() ? "Origa" : title;
                pm.print(name, web.createPrintDocumentAdapter(name), new PrintAttributes.Builder().build());
            });
        }

        /** Partage un texte (lien du lot…) vers WhatsApp, SMS, e-mail, etc. */
        @JavascriptInterface
        public void share(final String title, final String text) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_SUBJECT, title);
                send.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(send, title));
            });
        }

        /** Ouvre un lien web dans le navigateur du téléphone. */
        @JavascriptInterface
        public void openUrl(final String url) {
            if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) return;
            runOnUiThread(() -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))));
        }

        /** Enregistre un fichier généré (CSV, JSON-LD) puis propose de l'envoyer ou de l'ouvrir. */
        @JavascriptInterface
        public void shareFile(final String name, final String mime, final String content) {
            runOnUiThread(() -> {
                try {
                    File dir = new File(getCacheDir(), "exports");
                    dir.mkdirs();
                    File f = new File(dir, new File(name).getName());
                    try (FileOutputStream out = new FileOutputStream(f)) { out.write(content.getBytes(StandardCharsets.UTF_8)); }
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", f);
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType(mime);
                    send.putExtra(Intent.EXTRA_STREAM, uri);
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(send, f.getName()));
                } catch (Exception ignored) { /* écriture impossible : rien à proposer */ }
            });
        }
    }
}
