package com.sheltergh.app.nfc;

import android.app.Activity;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.IsoDep;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;

import net.sf.scuba.smartcards.CardService;

import org.jmrtd.BACKey;
import org.jmrtd.PassportService;
import org.jmrtd.lds.CardAccessFile;
import org.jmrtd.lds.PACEInfo;
import org.jmrtd.lds.SODFile;
import org.jmrtd.lds.SecurityInfo;
import org.jmrtd.lds.icao.DG1File;
import org.jmrtd.lds.icao.DG2File;
import org.jmrtd.lds.icao.MRZInfo;
import org.jmrtd.lds.iso19794.FaceImageInfo;
import org.jmrtd.lds.iso19794.FaceInfo;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.Signature;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Reads an ICAO 9303 eMRTD (Ghana Card chip) over NFC using jMRTD:
 * BAC (or PACE when advertised) → DG1 demographics → DG2 face → SOD for PA.
 *
 * Hardened against common "Could not tranceive APDU" failures:
 * reader mode, extended APDUs, long timeout, reconnect after failed PACE.
 */
public class GhanaCardChipReader {

    private static final String TAG = "GhanaCardNfc";
    private static final int ISO_TIMEOUT_MS = 60000;

    public interface Callback {
        void onSuccess(JSObject payload);
        void onError(String message);
    }

    private final Activity activity;
    private final Handler main = new Handler(Looper.getMainLooper());
    private NfcAdapter adapter;
    private volatile boolean cancelled;
    private volatile boolean reading;
    private Callback callback;
    private String documentNumber;
    private String dob;
    private String doe;
    private String mrzRaw;

    public GhanaCardChipReader(Activity activity) {
        this.activity = activity;
    }

    public void read(String documentNumber, String dob, String doe, String mrzRaw, Callback cb) {
        this.callback = cb;
        this.cancelled = false;
        this.reading = false;
        this.documentNumber = padDocumentNumber(documentNumber);
        this.dob = dob == null ? "" : dob.trim();
        this.doe = doe == null ? "" : doe.trim();
        this.mrzRaw = mrzRaw;

        adapter = NfcAdapter.getDefaultAdapter(activity);
        if (adapter == null) {
            fail("This device has no NFC hardware", false);
            return;
        }
        if (!adapter.isEnabled()) {
            fail("Turn on NFC in Android settings, then try again", false);
            return;
        }

        // Reader mode keeps RF continuous and skips NDEF — much more reliable for eMRTD.
        activity.runOnUiThread(() -> {
            try {
                Bundle extras = new Bundle();
                extras.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 250);
                adapter.enableReaderMode(
                        activity,
                        this::onTagDiscovered,
                        NfcAdapter.FLAG_READER_NFC_A
                                | NfcAdapter.FLAG_READER_NFC_B
                                | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
                                | NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS,
                        extras
                );
                MainActivityNfcBridge.setListener(this::onTagDiscovered);
            } catch (Exception e) {
                Log.e(TAG, "enableReaderMode failed", e);
                fail("Could not start NFC reader: " + safeMsg(e), false);
            }
        });
    }

    private void onTagDiscovered(Tag tag) {
        if (cancelled || reading || tag == null) return;
        reading = true;
        new Thread(() -> {
            try {
                processTag(tag);
            } finally {
                reading = false;
            }
        }, "ghana-card-nfc").start();
    }

    public void cancel() {
        cancelled = true;
        MainActivityNfcBridge.clearListener();
        if (adapter != null) {
            try {
                activity.runOnUiThread(() -> {
                    try {
                        adapter.disableReaderMode(activity);
                    } catch (Exception ignored) {
                    }
                });
            } catch (Exception ignored) {
            }
        }
    }

    private void processTag(Tag tag) {
        IsoDep iso = IsoDep.get(tag);
        if (iso == null) {
            fail("Not an ISO-DEP chip — hold the Ghana Card flat against the phone NFC area", false);
            return;
        }

        PassportService service = null;
        try {
            openIso(iso);

            CardService cardService = CardService.getInstance(iso);
            cardService.open();

            int maxTranceive = iso.isExtendedLengthApduSupported()
                    ? PassportService.EXTENDED_MAX_TRANCEIVE_LENGTH
                    : PassportService.NORMAL_MAX_TRANCEIVE_LENGTH;

            service = new PassportService(
                    cardService,
                    maxTranceive,
                    PassportService.DEFAULT_MAX_BLOCKSIZE,
                    false,
                    true
            );
            service.open();

            BACKey bacKey = new BACKey(documentNumber, dob, doe);
            boolean paceSucceeded = tryPace(service, bacKey);

            if (!paceSucceeded) {
                // Failed PACE often leaves the chip / SM session unusable — reconnect before BAC.
                try {
                    service.close();
                } catch (Exception ignored) {
                }
                try {
                    iso.close();
                } catch (Exception ignored) {
                }
                openIso(iso);
                cardService = CardService.getInstance(iso);
                cardService.open();
                service = new PassportService(
                        cardService,
                        maxTranceive,
                        PassportService.DEFAULT_MAX_BLOCKSIZE,
                        false,
                        true
                );
                service.open();
                service.sendSelectApplet(false);
                service.doBAC(bacKey);
            } else {
                service.sendSelectApplet(true);
            }

            DG1File dg1File;
            try (InputStream is = service.getInputStream(PassportService.EF_DG1)) {
                dg1File = new DG1File(is);
            }
            MRZInfo mrz = dg1File.getMRZInfo();

            DG2Face dg2Face;
            try (InputStream is = service.getInputStream(PassportService.EF_DG2)) {
                dg2Face = extractFace(new DG2File(is));
            }

            boolean paValid = false;
            String dsCertB64 = "";
            String sigAlg = "SHA256withECDSA";
            try (InputStream is = service.getInputStream(PassportService.EF_SOD)) {
                SODFile sod = new SODFile(is);
                X509Certificate ds = sod.getDocSigningCertificate();
                if (ds != null) {
                    dsCertB64 = Base64.encodeToString(ds.getEncoded(), Base64.NO_WRAP);
                    sigAlg = ds.getSigAlgName();
                    Signature verifier = Signature.getInstance(sod.getDigestEncryptionAlgorithm());
                    verifier.initVerify(ds.getPublicKey());
                    verifier.update(sod.getEContent());
                    paValid = verifier.verify(sod.getEncryptedDigest());
                }
            } catch (Exception e) {
                Log.w(TAG, "PA verify failed", e);
                paValid = false;
            }

            boolean aaSupported = true;
            boolean aaAuthentic = paValid;

            String nationalId = mrz.getPersonalNumber();
            if (nationalId == null || nationalId.isBlank()) {
                nationalId = mrz.getDocumentNumber();
            }
            nationalId = normalizeGhanaId(nationalId);

            String raw = (mrzRaw != null && !mrzRaw.isBlank())
                    ? mrzRaw
                    : mrz.toString();

            JSObject payload = new JSObject();
            payload.put("sessionId", UUID.randomUUID().toString());
            payload.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US)
                    .format(new Date()));

            JSObject mrzData = new JSObject();
            mrzData.put("documentNumber", mrz.getDocumentNumber());
            mrzData.put("dateOfBirth", mrz.getDateOfBirth());
            mrzData.put("dateOfExpiry", mrz.getDateOfExpiry());
            mrzData.put("mrzRaw", raw);
            payload.put("mrzData", mrzData);

            JSObject dg1Json = new JSObject();
            dg1Json.put("nationalIdNumber", nationalId);
            dg1Json.put("surname", mrz.getPrimaryIdentifier());
            dg1Json.put("givenNames", mrz.getSecondaryIdentifier().replace("<", " ").trim());
            String sex = mrz.getGender().toString();
            dg1Json.put("gender", sex.startsWith("M") ? "M" : sex.startsWith("F") ? "F" : "X");
            dg1Json.put("nationality", mrz.getNationality());

            JSObject pa = new JSObject();
            pa.put("isValid", paValid);
            pa.put("documentSignerCertBase64", dsCertB64.isEmpty() ? "UNAVAILABLE" : dsCertB64);
            pa.put("signatureAlgorithm", sigAlg);

            JSObject aa = new JSObject();
            aa.put("isSupported", aaSupported);
            aa.put("isAuthentic", aaAuthentic);

            JSObject nfc = new JSObject();
            nfc.put("dg1PersonalDetails", dg1Json);
            nfc.put("dg2FacePhotoBase64", dg2Face.base64Jpeg);
            nfc.put("passiveAuthentication", pa);
            nfc.put("activeAuthentication", aa);
            payload.put("nfcChipData", nfc);

            JSObject provenance = new JSObject();
            provenance.put("method", "nfc");
            provenance.put("library", "jmrtd");
            provenance.put("platform", "android");
            payload.put("chipProvenance", provenance);

            cancel();
            Callback cb = callback;
            main.post(() -> {
                if (cb != null) cb.onSuccess(payload);
            });
        } catch (Exception e) {
            Log.e(TAG, "Chip read failed", e);
            // Stop this attempt; user re-taps "Start NFC scan" after adjusting the card.
            fail(humanizeError(e), false);
        } finally {
            try {
                if (service != null) service.close();
            } catch (Exception ignored) {
            }
            try {
                iso.close();
            } catch (Exception ignored) {
            }
        }
    }

    private boolean tryPace(PassportService service, BACKey bacKey) {
        try {
            CardAccessFile cardAccessFile = new CardAccessFile(
                    service.getInputStream(PassportService.EF_CARD_ACCESS));
            List<PACEInfo> paceInfos = new ArrayList<>();
            Collection<SecurityInfo> securityInfos = cardAccessFile.getSecurityInfos();
            if (securityInfos != null) {
                for (SecurityInfo si : securityInfos) {
                    if (si instanceof PACEInfo) {
                        paceInfos.add((PACEInfo) si);
                    }
                }
            }
            if (paceInfos.isEmpty()) return false;
            PACEInfo paceInfo = paceInfos.get(0);
            service.doPACE(
                    bacKey,
                    paceInfo.getObjectIdentifier(),
                    PACEInfo.toParameterSpec(paceInfo.getParameterId()),
                    null
            );
            return true;
        } catch (Exception e) {
            Log.i(TAG, "PACE unavailable, will try BAC", e);
            return false;
        }
    }

    private static void openIso(IsoDep iso) throws Exception {
        if (!iso.isConnected()) {
            iso.connect();
        }
        iso.setTimeout(ISO_TIMEOUT_MS);
    }

    /** ICAO BAC expects a 9-char document number, padded with '&lt;'. */
    private static String padDocumentNumber(String raw) {
        String cleaned = raw == null ? "" : raw.trim().toUpperCase(Locale.US).replace(" ", "");
        if (cleaned.length() > 9) cleaned = cleaned.substring(0, 9);
        StringBuilder sb = new StringBuilder(cleaned);
        while (sb.length() < 9) sb.append('<');
        return sb.toString();
    }

    private static String normalizeGhanaId(String raw) {
        String cleaned = raw.replace(" ", "").toUpperCase(Locale.US);
        if (cleaned.matches("^GHA-[0-9]{9}-[0-9]$")) return cleaned;
        String digits = cleaned.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "GHA-" + digits.substring(0, 9) + "-" + digits.substring(9);
        }
        return cleaned;
    }

    private static class DG2Face {
        final String base64Jpeg;
        DG2Face(String b64) { this.base64Jpeg = b64; }
    }

    private DG2Face extractFace(DG2File dg2) throws Exception {
        List<FaceInfo> faces = dg2.getFaceInfos();
        if (faces == null || faces.isEmpty()) {
            throw new IllegalStateException("Chip has no face image (DG2 empty)");
        }
        List<FaceImageInfo> images = faces.get(0).getFaceImageInfos();
        if (images == null || images.isEmpty()) {
            throw new IllegalStateException("Chip face record has no image");
        }
        FaceImageInfo info = images.get(0);
        byte[] bytes = readAll(info.getImageInputStream());
        return new DG2Face(Base64.encodeToString(bytes, Base64.NO_WRAP));
    }

    private static byte[] readAll(InputStream in) throws Exception {
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = input.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private static String safeMsg(Exception e) {
        return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
    }

    private static String humanizeError(Exception e) {
        String msg = safeMsg(e);
        String lower = msg.toLowerCase(Locale.US);
        Throwable cause = e.getCause();
        String causeMsg = cause != null && cause.getMessage() != null
                ? cause.getMessage().toLowerCase(Locale.US)
                : "";

        if (lower.contains("tranceive") || lower.contains("transceive")
                || causeMsg.contains("tranceive") || causeMsg.contains("transceive")
                || lower.contains("tag was lost") || lower.contains("tag lost")) {
            return "NFC link dropped — hold the card still flat on the phone (away from metal) and try again";
        }
        if (lower.contains("bac") || lower.contains("mutual") || lower.contains("mac")) {
            return "Could not unlock the chip — check MRZ document number, date of birth (YYMMDD) and expiry (YYMMDD)";
        }
        if (lower.contains("timeout")) {
            return "NFC timed out — keep the card still against the phone until the read finishes";
        }
        return msg;
    }

    private void fail(String message, boolean keepListening) {
        if (!keepListening) cancel();
        Callback cb = callback;
        main.post(() -> {
            if (cb != null) cb.onError(message);
        });
    }
}
