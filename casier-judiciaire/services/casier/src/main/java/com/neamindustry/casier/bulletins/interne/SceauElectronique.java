package com.neamindustry.casier.bulletins.interne;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.Instant;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureOptions;
import org.bouncycastle.asn1.ASN1EncodableVector;
import org.bouncycastle.asn1.DERSet;
import org.bouncycastle.asn1.cms.Attribute;
import org.bouncycastle.asn1.cms.AttributeTable;
import org.bouncycastle.asn1.cms.CMSAttributes;
import org.bouncycastle.asn1.ess.ESSCertIDv2;
import org.bouncycastle.asn1.ess.SigningCertificateV2;
import org.bouncycastle.asn1.nist.NISTObjectIdentifiers;
import org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.AlgorithmIdentifier;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.DefaultSignedAttributeTableGenerator;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.cms.jcajce.JcaSimpleSignerInfoVerifierBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.neamindustry.casier.bulletins.ParametresBulletins;

/**
 * BUL-01 : sceau électronique du Ministère de la Justice, signature PAdES (profil B-B, CAdES détaché, SHA-256).
 * <p>
 * En production, le certificat qualifié délivré par l'ANINF est fourni sous forme de magasin PKCS#12
 * ({@code casier.bulletins.sceau.magasin}), puis dans un module matériel de sécurité. Sans magasin, un certificat
 * de <strong>démonstration</strong> est créé au démarrage : il porte la mention « sans valeur officielle » et le
 * profil {@code prod} refuse de démarrer dans ce cas. L'horodatage qualifié sera ajouté avec le service de l'ANINF.
 */
@Component
public class SceauElectronique {

    private static final Logger LOG = LoggerFactory.getLogger(SceauElectronique.class);

    private final PrivateKey cle;
    private final X509Certificate certificat;
    private final boolean demonstration;

    SceauElectronique(ParametresBulletins parametres) throws Exception {
        ParametresBulletins.Sceau p = parametres.sceau();
        if (p.magasin() != null && !p.magasin().isBlank()) {
            KeyStore magasin = KeyStore.getInstance("PKCS12");
            char[] mdp = p.motDePasse() == null ? new char[0] : p.motDePasse().toCharArray();
            try (InputStream in = Files.newInputStream(Path.of(p.magasin()))) {
                magasin.load(in, mdp);
            }
            String alias = p.alias() != null && !p.alias().isBlank() ? p.alias() : Collections.list(magasin.aliases()).getFirst();
            this.cle = (PrivateKey) magasin.getKey(alias, mdp);
            this.certificat = (X509Certificate) magasin.getCertificate(alias);
            this.demonstration = false;
            LOG.info("Sceau électronique chargé : {}", certificat.getSubjectX500Principal().getName());
        } else {
            if (p.exigerCertificat()) {
                throw new IllegalStateException("BUL-01 : aucun certificat de sceau configuré (casier.bulletins.sceau.magasin).");
            }
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(3072, new SecureRandom());
            KeyPair paire = kpg.generateKeyPair();
            this.cle = paire.getPrivate();
            this.certificat = certificatDeDemonstration(paire);
            this.demonstration = true;
            LOG.warn("Sceau électronique de DÉMONSTRATION (sans valeur officielle) : configurez le certificat qualifié en production.");
        }
    }

    public boolean demonstration() {
        return demonstration;
    }

    public X509Certificate certificat() {
        return certificat;
    }

    /** Empreinte SHA-256 du certificat de sceau, pour le contrôle des documents déposés (BUL-08). */
    public String empreinteCertificat() {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(certificat.getEncoded()));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Appose le sceau sur un PDF et renvoie le document scellé (sauvegarde incrémentale : le PDF/A est conservé). */
    public byte[] sceller(byte[] pdf, Instant date, String motif) {
        try (PDDocument doc = Loader.loadPDF(pdf); ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            PDSignature signature = new PDSignature();
            signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
            signature.setSubFilter(COSName.getPDFName("ETSI.CAdES.detached"));
            signature.setName("Ministère de la Justice — République gabonaise");
            signature.setLocation("Libreville, Gabon");
            signature.setReason(motif);
            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Africa/Libreville"));
            cal.setTime(Date.from(date));
            signature.setSignDate(cal);
            SignatureOptions options = new SignatureOptions();
            options.setPreferredSignatureSize(SignatureOptions.DEFAULT_SIGNATURE_SIZE * 2);
            doc.addSignature(signature, this::signerCms, options);
            doc.saveIncremental(sortie);
            options.close();
            return sortie.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("BUL-01 : scellement impossible.", e);
        }
    }

    /** CAdES détaché : attribut signing-certificate-v2, sans signing-time (date portée par le dictionnaire de signature). */
    private byte[] signerCms(InputStream contenu) throws IOException {
        try {
            byte[] donnees = contenu.readAllBytes();
            ContentSigner signataire = new JcaContentSignerBuilder("SHA256withRSA").build(cle);
            byte[] empreinte = MessageDigest.getInstance("SHA-256").digest(certificat.getEncoded());
            ESSCertIDv2 id = new ESSCertIDv2(new AlgorithmIdentifier(NISTObjectIdentifiers.id_sha256), empreinte);
            ASN1EncodableVector attributs = new ASN1EncodableVector();
            attributs.add(new Attribute(PKCSObjectIdentifiers.id_aa_signingCertificateV2,
                    new DERSet(new SigningCertificateV2(new ESSCertIDv2[] {id}))));
            DefaultSignedAttributeTableGenerator parDefaut = new DefaultSignedAttributeTableGenerator(new AttributeTable(attributs));
            // PAdES : pas d'attribut signing-time, la date est portée par le dictionnaire de signature.
            org.bouncycastle.cms.CMSAttributeTableGenerator generateurAttributs =
                    parametres -> parDefaut.getAttributes(parametres).remove(CMSAttributes.signingTime);
            CMSSignedDataGenerator generateur = new CMSSignedDataGenerator();
            generateur.addSignerInfoGenerator(new JcaSignerInfoGeneratorBuilder(new JcaDigestCalculatorProviderBuilder().build())
                    .setSignedAttributeGenerator(generateurAttributs).build(signataire, certificat));
            generateur.addCertificates(new JcaCertStore(List.of(certificat)));
            return generateur.generate(new CMSProcessableByteArray(donnees), false).getEncoded();
        } catch (Exception e) {
            throw new IOException("Signature CMS impossible", e);
        }
    }

    /**
     * BUL-08 : contrôle d'un PDF déposé. Vrai si la dernière signature couvre tout le fichier, est mathématiquement valide
     * et a été produite par le certificat de sceau de la plateforme.
     */
    public boolean controler(byte[] pdf) {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            List<PDSignature> signatures = doc.getSignatureDictionaries();
            if (signatures.isEmpty()) {
                return false;
            }
            PDSignature derniere = signatures.getLast();
            int[] plage = derniere.getByteRange();
            if (plage.length != 4 || (long) plage[2] + plage[3] != pdf.length) {
                return false; // contenu ajouté après le scellement
            }
            byte[] signe = new byte[plage[1] + plage[3]];
            System.arraycopy(pdf, plage[0], signe, 0, plage[1]);
            System.arraycopy(pdf, plage[2], signe, plage[1], plage[3]);
            // Le bloc /Contents est complété par des zéros : seule la structure ASN.1 est lue.
            byte[] contenu;
            try (org.bouncycastle.asn1.ASN1InputStream asn = new org.bouncycastle.asn1.ASN1InputStream(derniere.getContents(pdf))) {
                contenu = asn.readObject().getEncoded();
            }
            CMSSignedData cms = new CMSSignedData(new CMSProcessableByteArray(signe), contenu);
            for (SignerInformation si : cms.getSignerInfos().getSigners()) {
                @SuppressWarnings("unchecked")
                var certs = cms.getCertificates().getMatches(si.getSID());
                for (Object c : certs) {
                    X509Certificate cert = new JcaX509CertificateConverter().getCertificate((X509CertificateHolder) c);
                    if (cert.equals(certificat) && si.verify(new JcaSimpleSignerInfoVerifierBuilder().build(cert))) {
                        return true;
                    }
                }
            }
            return false;
        } catch (IOException | CMSException | RuntimeException | java.security.cert.CertificateException
                 | org.bouncycastle.operator.OperatorCreationException e) {
            return false;
        }
    }

    private static X509Certificate certificatDeDemonstration(KeyPair paire) throws Exception {
        X500Name sujet = new X500Name("CN=Sceau de démonstration — Casier judiciaire numérique, "
                + "O=DÉMONSTRATION — sans valeur officielle, C=GA");
        Instant debut = Instant.now().minus(Duration.ofDays(1));
        JcaX509v3CertificateBuilder b = new JcaX509v3CertificateBuilder(sujet, new BigInteger(64, new SecureRandom()),
                Date.from(debut), Date.from(debut.plus(Duration.ofDays(3650))), sujet, paire.getPublic());
        b.addExtension(Extension.basicConstraints, true, new BasicConstraints(false));
        b.addExtension(Extension.keyUsage, true, new KeyUsage(KeyUsage.digitalSignature | KeyUsage.nonRepudiation));
        return new JcaX509CertificateConverter().getCertificate(
                b.build(new JcaContentSignerBuilder("SHA256withRSA").build(paire.getPrivate())));
    }
}
