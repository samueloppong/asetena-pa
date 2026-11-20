package com.sheltergh.app;

import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.sheltergh.app.nfc.GhanaCardNfcPlugin;
import com.sheltergh.app.nfc.MainActivityNfcBridge;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GhanaCardNfcPlugin.class);
        super.onCreate(savedInstanceState);
        maybeDispatchNfc(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        maybeDispatchNfc(intent);
    }

    private void maybeDispatchNfc(Intent intent) {
        if (intent == null) return;
        if (NfcAdapter.ACTION_TECH_DISCOVERED.equals(intent.getAction())
                || NfcAdapter.ACTION_TAG_DISCOVERED.equals(intent.getAction())
                || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(intent.getAction())) {
            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            MainActivityNfcBridge.dispatch(tag);
        }
    }
}
