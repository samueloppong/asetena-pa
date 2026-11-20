package com.sheltergh.app.nfc;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.UUID;

/**
 * Capacitor bridge for ICAO 9303 Ghana Card chip reads (UK GOV-style NFC ID check).
 * Actual BAC / DG1 / DG2 / Passive Authentication work lives in {@link GhanaCardChipReader}.
 */
@CapacitorPlugin(name = "GhanaCardNfc")
public class GhanaCardNfcPlugin extends Plugin {

    private GhanaCardChipReader reader;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        boolean hardware = getContext().getPackageManager()
                .hasSystemFeature("android.hardware.nfc");
        android.nfc.NfcAdapter adapter = android.nfc.NfcAdapter.getDefaultAdapter(getContext());
        boolean enabled = adapter != null && adapter.isEnabled();
        result.put("available", hardware);
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void readChip(PluginCall call) {
        String documentNumber = call.getString("documentNumber");
        String dateOfBirth = call.getString("dateOfBirth");
        String dateOfExpiry = call.getString("dateOfExpiry");
        String mrzRaw = call.getString("mrzRaw", "");

        if (documentNumber == null || dateOfBirth == null || dateOfExpiry == null) {
            call.reject("documentNumber, dateOfBirth (YYMMDD) and dateOfExpiry (YYMMDD) are required");
            return;
        }
        if (!dateOfBirth.matches("^[0-9]{6}$") || !dateOfExpiry.matches("^[0-9]{6}$")) {
            call.reject("dateOfBirth and dateOfExpiry must be YYMMDD");
            return;
        }

        getBridge().getActivity().runOnUiThread(() -> {
            try {
                if (reader != null) {
                    reader.cancel();
                }
                reader = new GhanaCardChipReader(getActivity());
                reader.read(documentNumber, dateOfBirth, dateOfExpiry, mrzRaw,
                        new GhanaCardChipReader.Callback() {
                            @Override
                            public void onSuccess(JSObject payload) {
                                call.resolve(payload);
                            }

                            @Override
                            public void onError(String message) {
                                call.reject(message);
                            }
                        });
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "NFC read failed");
            }
        });
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        if (reader != null) {
            reader.cancel();
            reader = null;
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (reader != null) {
            reader.cancel();
            reader = null;
        }
        super.handleOnDestroy();
    }
}
