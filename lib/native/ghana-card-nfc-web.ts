import type { GhanaCardMrzKeys, GhanaCardNfcPlugin } from "./ghana-card-nfc";

/**
 * Web cannot speak ISO 14443 APDUs to an ICAO chip (GOV.UK / Ghana Card style).
 * Chip verification must run inside the Capacitor Android app.
 */
export class GhanaCardNfcWeb implements GhanaCardNfcPlugin {
  async isAvailable() {
    return { available: false, enabled: false };
  }

  async readChip(_options: GhanaCardMrzKeys): Promise<never> {
    throw new Error(
      "Ghana Card chip reading requires the Asetena Pa Android app with NFC. Open this screen on your phone after installing the APK."
    );
  }

  async cancel() {
    /* no-op */
  }
}
