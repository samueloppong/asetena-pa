package com.sheltergh.app.nfc;

import android.nfc.Tag;

/**
 * Forwards NFC tags from {@link com.sheltergh.app.MainActivity#onNewIntent}
 * to the active {@link GhanaCardChipReader}.
 */
public final class MainActivityNfcBridge {
    public interface TagListener {
        void onTag(Tag tag);
    }

    private static volatile TagListener listener;

    private MainActivityNfcBridge() {}

    public static void setListener(TagListener l) {
        listener = l;
    }

    public static void clearListener() {
        listener = null;
    }

    public static void dispatch(Tag tag) {
        TagListener l = listener;
        if (l != null && tag != null) {
            l.onTag(tag);
        }
    }
}
