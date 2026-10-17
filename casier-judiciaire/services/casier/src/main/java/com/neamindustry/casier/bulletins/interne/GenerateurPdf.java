package com.neamindustry.casier.bulletins.interne;

import java.awt.color.ColorSpace;
import java.awt.color.ICC_Profile;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDMetadata;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.color.PDOutputIntent;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.apache.xmpbox.XMPMetadata;
import org.apache.xmpbox.schema.DublinCoreSchema;
import org.apache.xmpbox.schema.PDFAIdentificationSchema;
import org.apache.xmpbox.schema.XMPBasicSchema;
import org.apache.xmpbox.xml.XmpSerializer;
import org.springframework.stereotype.Component;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.neamindustry.casier.bulletins.ContenuBulletin;
import com.neamindustry.casier.bulletins.IdentiteSurBulletin;
import com.neamindustry.casier.bulletins.ParametresBulletins;
import com.neamindustry.casier.commun.NaturePeine;
import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.commun.TypeBulletin;

/**
 * BUL-01 à BUL-05 : mise en page du bulletin en PDF/A-2b (polices incorporées, profil sRGB, métadonnées XMP),
 * QR code vectoriel, code court en clair, filigrane du type et, en démonstration, « Spécimen ».
 * Le contenu vient exclusivement du {@link ContenuBulletin} calculé par le moteur de règles.
 */
@Component
public class GenerateurPdf {

    /** Clé du dictionnaire d'information portant le jeton, pour le contrôle d'un PDF déposé (BUL-08). */
    public static final String CLE_JETON = "CasierJetonVerification";

    private static final float MARGE = 56;
    private static final float LARGEUR = PDRectangle.A4.getWidth();
    private static final float HAUTEUR = PDRectangle.A4.getHeight();
    private static final ZoneId LIBREVILLE = ZoneId.of("Africa/Libreville");
    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH);
    private static final DateTimeFormatter JOUR_HEURE = DateTimeFormatter.ofPattern("d MMMM yyyy 'à' HH 'h' mm", Locale.FRENCH);
    private static final float[] NAVY = {15 / 255f, 29 / 255f, 54 / 255f};
    private static final float[] GRIS = {0.38f, 0.42f, 0.48f};
    private static final Map<TypeBulletin, String> TITRES = new EnumMap<>(Map.of(
            TypeBulletin.B1, "Bulletin n°1 du casier judiciaire",
            TypeBulletin.B2, "Bulletin n°2 du casier judiciaire",
            TypeBulletin.B3, "Bulletin n°3 du casier judiciaire"));
    private static final Map<TypeBulletin, String> DESTINATAIRES = new EnumMap<>(Map.of(
            TypeBulletin.B1, "Relevé intégral réservé à l’autorité judiciaire",
            TypeBulletin.B2, "Extrait délivré à une administration habilitée",
            TypeBulletin.B3, "Extrait délivré à la personne concernée"));

    private final ParametresBulletins parametres;

    GenerateurPdf(ParametresBulletins parametres) {
        this.parametres = parametres;
    }

    public record Donnees(String numero, ContenuBulletin contenu, Instant emission, Instant expiration, String jeton,
                          String codeCourt, String finalite, boolean sceauDemonstration) {
    }

    public byte[] generer(Donnees d) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            Polices p = new Polices(doc);
            Mise m = new Mise(doc, p, d);
            m.nouvellePage();
            m.corps();
            m.fermer();
            metadonnees(doc, d);
            doc.save(sortie);
            return sortie.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("BUL-01 : génération du bulletin impossible.", e);
        }
    }

    private record Polices(PDType0Font texte, PDType0Font semi, PDType0Font gras, PDType0Font titre) {
        Polices(PDDocument doc) throws IOException {
            this(charger(doc, "SourceSans3-Regular.ttf"), charger(doc, "SourceSans3-Semibold.ttf"),
                    charger(doc, "SourceSans3-Bold.ttf"), charger(doc, "SourceSerif4-Semibold.ttf"));
        }

        private static PDType0Font charger(PDDocument doc, String nom) throws IOException {
            try (InputStream in = GenerateurPdf.class.getResourceAsStream("/polices/" + nom)) {
                return PDType0Font.load(doc, in, true);
            }
        }
    }

    /** Mise en page séquentielle avec saut de page automatique. */
    private final class Mise {
        private final PDDocument doc;
        private final Polices p;
        private final Donnees d;
        private PDPageContentStream cs;
        private PDImageXObject logo;
        private float y;
        private int pages;

        Mise(PDDocument doc, Polices p, Donnees d) {
            this.doc = doc;
            this.p = p;
            this.d = d;
        }

        void nouvellePage() throws IOException {
            if (cs != null) {
                pied();
                cs.close();
            }
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            pages++;
            cs = new PDPageContentStream(doc, page);
            filigranes();
            entete();
        }

        void fermer() throws IOException {
            pied();
            cs.close();
        }

        private void filigranes() throws IOException {
            PDExtendedGraphicsState transparence = new PDExtendedGraphicsState();
            transparence.setNonStrokingAlphaConstant(0.06f);
            cs.saveGraphicsState();
            cs.setGraphicsStateParameters(transparence);
            cs.setNonStrokingColor(NAVY[0], NAVY[1], NAVY[2]);
            texteTourne(p.titre, 64, d.contenu().type() == TypeBulletin.B3 ? "BULLETIN N°3"
                    : d.contenu().type() == TypeBulletin.B2 ? "BULLETIN N°2" : "BULLETIN N°1", LARGEUR / 2 - 230, HAUTEUR / 2 - 120);
            cs.restoreGraphicsState();
            if (parametres.specimen() || d.sceauDemonstration()) {
                PDExtendedGraphicsState rouge = new PDExtendedGraphicsState();
                rouge.setNonStrokingAlphaConstant(0.14f);
                cs.saveGraphicsState();
                cs.setGraphicsStateParameters(rouge);
                cs.setNonStrokingColor(0.76f, 0.15f, 0.11f);
                texteTourne(p.gras, 30, "SPÉCIMEN — SANS VALEUR OFFICIELLE", 70, 200);
                cs.restoreGraphicsState();
            }
        }

        private void texteTourne(PDType0Font f, float taille, String t, float x, float yy) throws IOException {
            cs.beginText();
            cs.setFont(f, taille);
            cs.setTextMatrix(Matrix.getRotateInstance(Math.toRadians(32), x, yy));
            cs.showText(t);
            cs.endText();
        }

        private void entete() throws IOException {
            // Filet tricolore (VIS-02)
            float tiers = LARGEUR / 3;
            float[][] couleurs = {{0.0f, 0.58f, 0.33f}, {0.99f, 0.82f, 0.05f}, {0.23f, 0.46f, 0.77f}};
            for (int i = 0; i < 3; i++) {
                cs.setNonStrokingColor(couleurs[i][0], couleurs[i][1], couleurs[i][2]);
                cs.addRect(i * tiers, HAUTEUR - 6, tiers, 6);
                cs.fill();
            }
            logoMinistere(MARGE, HAUTEUR - 82, 60);
            float x = MARGE + 70;
            couleur(NAVY);
            texte(p.gras, 9, "RÉPUBLIQUE GABONAISE", x, HAUTEUR - 50);
            texte(p.semi, 9, "Ministère de la Justice, Garde des Sceaux, chargé des Droits humains", x, HAUTEUR - 62);
            couleur(GRIS);
            texte(p.texte, 8, "Casier judiciaire national", x, HAUTEUR - 74);
            texteDroite(p.semi, 9, "N° " + d.numero(), LARGEUR - MARGE, HAUTEUR - 50);
            couleur(GRIS);
            texteDroite(p.texte, 8, "Page " + pages, LARGEUR - MARGE, HAUTEUR - 62);
            ligne(MARGE, HAUTEUR - 90, LARGEUR - MARGE, NAVY, 1.2f);
            y = HAUTEUR - 122;
        }

        /** VIS-02 : logo du Ministère de la Justice (drapeau et sceau), fourni par le Ministère ; chargé une fois par document. */
        private void logoMinistere(float x, float bas, float largeur) throws IOException {
            if (logo == null) {
                try (InputStream in = GenerateurPdf.class.getResourceAsStream("/emblemes/logo-ministere.jpg")) {
                    logo = JPEGFactory.createFromStream(doc, in);
                }
            }
            float hauteur = largeur * logo.getHeight() / logo.getWidth();
            cs.drawImage(logo, x, bas, largeur, hauteur);
            cs.setStrokingColor(0.85f, 0.87f, 0.9f);
            cs.setLineWidth(0.5f);
            cs.addRect(x, bas, largeur, hauteur);
            cs.stroke();
        }

        void corps() throws IOException {
            ContenuBulletin c = d.contenu();
            couleur(NAVY);
            texte(p.titre, 21, TITRES.get(c.type()), MARGE, y);
            y -= 17;
            couleur(GRIS);
            texte(p.texte, 10, DESTINATAIRES.get(c.type()) + (d.finalite() != null && c.type() == TypeBulletin.B2
                    ? " — finalité : " + d.finalite() : ""), MARGE, y);
            y -= 28;

            IdentiteSurBulletin i = c.identite();
            titreBloc("Identité");
            champ("Nom", i.nom());
            champ("Prénoms", i.prenoms());
            champ("Né(e) le", i.dateNaissance() == null ? "—" : i.dateNaissance().format(JOUR)
                    + (i.lieuNaissance() == null ? "" : " à " + i.lieuNaissance()));
            if (i.nomPere() != null || i.nomMere() != null) {
                champ("Filiation", String.join(" et ", java.util.stream.Stream.of(i.nomPere(), i.nomMere())
                        .filter(s -> s != null && !s.isBlank()).toList()));
            }
            y -= 10;
            titreBloc("État du casier judiciaire au " + c.etatDuCasierAu().atZone(LIBREVILLE).format(JOUR_HEURE));
            if (c.neant()) {
                cs.setStrokingColor(0.7f, 0.72f, 0.76f);
                cs.setLineWidth(0.8f);
                cs.setLineDashPattern(new float[] {3, 3}, 0);
                cs.addRect(MARGE, y - 46, LARGEUR - 2 * MARGE, 50);
                cs.stroke();
                cs.setLineDashPattern(new float[] {}, 0);
                couleur(NAVY);
                texteCentre(p.titre, 22, "NÉANT", y - 22);
                couleur(GRIS);
                texteCentre(p.texte, 9, "Aucune condamnation ne doit figurer sur ce bulletin.", y - 37);
                y -= 64;
            } else {
                int n = 1;
                for (ContenuBulletin.Ligne l : c.condamnations()) {
                    if (y < 260) {
                        nouvellePage();
                        titreBloc("État du casier judiciaire (suite)");
                    }
                    couleur(NAVY);
                    texte(p.gras, 10, n++ + ". " + l.dateDecision().format(JOUR) + " — " + l.juridiction(), MARGE, y);
                    y -= 14;
                    paragraphe("Décision n° " + l.numeroDecision() + " · " + l.infraction(), 10);
                    paragraphe("Peine(s) : " + String.join(" ; ", l.peines().stream().map(GenerateurPdf::peine).toList()), 10);
                    if (!l.mentions().isEmpty()) {
                        paragraphe("Mentions : " + String.join(" ; ", l.mentions().stream()
                                .map(m -> libelleMention(m.type().name()) + " le " + m.date().format(JOUR)).toList()), 10);
                    }
                    y -= 8;
                }
            }
            y -= 6;
            titreBloc("Délivrance");
            champ("Délivré le", d.emission().atZone(LIBREVILLE).format(JOUR_HEURE));
            champ("Valable jusqu’au", d.expiration().atZone(LIBREVILLE).format(JOUR));
            champ("Règles appliquées", "version " + c.versionRegles() + " — " + c.referenceRegles());
        }

        private void pied() throws IOException {
            float base = 66;
            ligne(MARGE, base + 118, LARGEUR - MARGE, new float[] {0.85f, 0.86f, 0.88f}, 0.8f);
            String adresse = parametres.adresseVerification() + "/v/" + d.jeton();
            qr(adresse, MARGE, base, 104);
            float x = MARGE + 120;
            couleur(NAVY);
            texte(p.gras, 10, "Document électronique – vérifiez son authenticité sur", x, base + 92);
            texte(p.semi, 10, parametres.adresseVerification().replaceFirst("^https?://", "") + "/verifier", x, base + 78);
            couleur(GRIS);
            texte(p.texte, 9, "Code de vérification", x, base + 56);
            couleur(NAVY);
            texte(p.gras, 15, d.codeCourt(), x, base + 38);
            couleur(GRIS);
            texte(p.texte, 8, "Scellé électroniquement par le Ministère de la Justice. Toute modification du fichier le rend invalide.", x, base + 18);
            texte(p.texte, 8, d.sceauDemonstration()
                    ? "Sceau de DÉMONSTRATION : ce document n’a aucune valeur officielle."
                    : "Le QR code renvoie au registre des bulletins émis ; la vérification est gratuite et sans compte.", x, base + 6);
        }

        private void qr(String contenu, float x, float yy, float taille) throws IOException {
            try {
                BitMatrix m = new QRCodeWriter().encode(contenu, BarcodeFormat.QR_CODE, 0, 0,
                        Map.of(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M, EncodeHintType.MARGIN, 0));
                float module = taille / m.getWidth();
                cs.setNonStrokingColor(NAVY[0], NAVY[1], NAVY[2]);
                for (int r = 0; r < m.getHeight(); r++) {
                    for (int col = 0; col < m.getWidth(); col++) {
                        if (m.get(col, r)) {
                            cs.addRect(x + col * module, yy + taille - (r + 1) * module, module, module);
                        }
                    }
                }
                cs.fill();
            } catch (com.google.zxing.WriterException e) {
                throw new IOException(e);
            }
        }

        private void titreBloc(String t) throws IOException {
            couleur(NAVY);
            texte(p.gras, 11, t, MARGE, y);
            y -= 6;
            ligne(MARGE, y, LARGEUR - MARGE, new float[] {0.85f, 0.86f, 0.88f}, 0.6f);
            y -= 15;
        }

        private void champ(String libelle, String valeur) throws IOException {
            couleur(GRIS);
            texte(p.texte, 10, libelle, MARGE, y);
            couleur(NAVY);
            List<String> lignes = couper(valeur == null ? "—" : valeur, p.semi, 10, LARGEUR - 2 * MARGE - 130);
            for (String l : lignes) {
                texte(p.semi, 10, l, MARGE + 130, y);
                y -= 14;
            }
        }

        private void paragraphe(String t, float taille) throws IOException {
            couleur(NAVY);
            for (String l : couper(t, p.texte, taille, LARGEUR - 2 * MARGE - 14)) {
                texte(p.texte, taille, l, MARGE + 14, y);
                y -= taille + 4;
            }
        }

        private void couleur(float[] c) throws IOException {
            cs.setNonStrokingColor(c[0], c[1], c[2]);
        }

        private void ligne(float x1, float yy, float x2, float[] c, float epaisseur) throws IOException {
            cs.setStrokingColor(c[0], c[1], c[2]);
            cs.setLineWidth(epaisseur);
            cs.moveTo(x1, yy);
            cs.lineTo(x2, yy);
            cs.stroke();
        }

        private void texte(PDType0Font f, float taille, String t, float x, float yy) throws IOException {
            cs.beginText();
            cs.setFont(f, taille);
            cs.newLineAtOffset(x, yy);
            cs.showText(t);
            cs.endText();
        }

        private void texteDroite(PDType0Font f, float taille, String t, float droite, float yy) throws IOException {
            texte(f, taille, t, droite - f.getStringWidth(t) / 1000 * taille, yy);
        }

        private void texteCentre(PDType0Font f, float taille, String t, float yy) throws IOException {
            texte(f, taille, t, (LARGEUR - f.getStringWidth(t) / 1000 * taille) / 2, yy);
        }
    }

    static List<String> couper(String t, PDType0Font f, float taille, float largeur) throws IOException {
        List<String> lignes = new ArrayList<>();
        StringBuilder courante = new StringBuilder();
        for (String mot : t.split("\\s+")) {
            String essai = courante.isEmpty() ? mot : courante + " " + mot;
            if (f.getStringWidth(essai) / 1000 * taille > largeur && !courante.isEmpty()) {
                lignes.add(courante.toString());
                courante = new StringBuilder(mot);
            } else {
                courante = new StringBuilder(essai);
            }
        }
        if (!courante.isEmpty()) {
            lignes.add(courante.toString());
        }
        return lignes;
    }

    static String peine(Peine pe) {
        String base = switch (pe.nature()) {
            case EMPRISONNEMENT -> "emprisonnement de " + pe.dureeMois() + " mois";
            case AMENDE -> "amende de " + String.format(Locale.FRENCH, "%,d", pe.montantFcfa()).replace(' ', ' ') + " FCFA";
            case TRAVAIL_INTERET_GENERAL -> "travail d’intérêt général" + (pe.dureeMois() == null ? "" : " (" + pe.dureeMois() + " mois)");
            case PEINE_COMPLEMENTAIRE -> "peine complémentaire";
            case AUTRE -> "autre peine";
        };
        if (pe.nature() == NaturePeine.EMPRISONNEMENT && pe.sursis() == Sursis.TOTAL) {
            return base + " avec sursis";
        }
        if (pe.sursis() == Sursis.PARTIEL) {
            return base + " dont " + pe.dureeSursisMois() + " mois avec sursis";
        }
        return base;
    }

    private static String libelleMention(String type) {
        return switch (type) {
            case "APPEL" -> "appel";
            case "EXECUTION" -> "exécution";
            case "REVOCATION_SURSIS" -> "révocation du sursis";
            case "REHABILITATION" -> "réhabilitation";
            case "AMNISTIE" -> "amnistie";
            case "GRACE" -> "grâce";
            case "RECTIFICATION" -> "rectification";
            case "EFFACEMENT" -> "effacement";
            default -> type.toLowerCase(Locale.FRENCH);
        };
    }

    /** PDF/A-2b : métadonnées XMP, profil de sortie sRGB, dictionnaire d'information. */
    private static void metadonnees(PDDocument doc, Donnees d) throws IOException {
        String titre = TITRES.get(d.contenu().type()) + " — " + d.numero();
        PDDocumentInformation info = doc.getDocumentInformation();
        info.setTitle(titre);
        info.setAuthor("Ministère de la Justice — République gabonaise");
        info.setProducer("Casier judiciaire numérique");
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        cal.setTimeInMillis(d.emission().toEpochMilli());
        info.setCreationDate(cal);
        info.setCustomMetadataValue(CLE_JETON, d.jeton());
        try {
            XMPMetadata xmp = XMPMetadata.createXMPMetadata();
            PDFAIdentificationSchema pdfa = xmp.createAndAddPDFAIdentificationSchema();
            pdfa.setPart(2);
            pdfa.setConformance("B");
            DublinCoreSchema dc = xmp.createAndAddDublinCoreSchema();
            dc.setTitle(titre);
            dc.addCreator("Ministère de la Justice — République gabonaise");
            XMPBasicSchema basic = xmp.createAndAddXMPBasicSchema();
            basic.setCreateDate(cal);
            basic.setCreatorTool("Casier judiciaire numérique");
            ByteArrayOutputStream x = new ByteArrayOutputStream();
            new XmpSerializer().serialize(xmp, x, true);
            PDMetadata meta = new PDMetadata(doc);
            meta.importXMPMetadata(x.toByteArray());
            PDDocumentCatalog catalogue = doc.getDocumentCatalog();
            catalogue.setMetadata(meta);
            catalogue.setLanguage("fr-FR");
            PDOutputIntent intention = new PDOutputIntent(doc,
                    new ByteArrayInputStream(ICC_Profile.getInstance(ColorSpace.CS_sRGB).getData()));
            intention.setInfo("sRGB IEC61966-2.1");
            intention.setOutputCondition("sRGB IEC61966-2.1");
            intention.setOutputConditionIdentifier("sRGB IEC61966-2.1");
            intention.setRegistryName("http://www.color.org");
            catalogue.addOutputIntent(intention);
        } catch (Exception e) {
            throw new IOException("Métadonnées PDF/A", e);
        }
    }

    static LocalDate jour(Instant i) {
        return i.atZone(LIBREVILLE).toLocalDate();
    }
}
