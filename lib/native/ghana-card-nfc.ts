import { registerPlugin } from "@capacitor/core";

/** MRZ keys required to open a BAC/PACE session with the Ghana Card chip. */
export type GhanaCardMrzKeys = {
  documentNumber: string;
  dateOfBirth: string; // YYMMDD
  dateOfExpiry: string; // YYMMDD
  mrzRaw?: string;
};

export type GhanaCardChipReadResult = {
  sessionId: string;
  timestamp: string;
  mrzData: {
    documentNumber: string;
    dateOfBirth: string;
    dateOfExpiry: string;
    mrzRaw: string;
  };
  nfcChipData: {
    dg1PersonalDetails: {
      nationalIdNumber: string;
      surname: string;
      givenNames: string;
      gender: "M" | "F" | "X";
      nationality: string;
    };
    dg2FacePhotoBase64: string;
    passiveAuthentication: {
      isValid: boolean;
      documentSignerCertBase64: string;
      signatureAlgorithm: string;
    };
    activeAuthentication: {
      isSupported: boolean;
      isAuthentic: boolean;
    };
  };
  chipProvenance: {
    method: "nfc";
    library: "jmrtd";
    platform: "android";
  };
};

export interface GhanaCardNfcPlugin {
  /** True when the device has NFC hardware enabled. */
  isAvailable(): Promise<{ available: boolean; enabled: boolean }>;

  /**
   * Opens an NFC session, waits for a Ghana Card / eMRTD, runs BAC with the
   * supplied MRZ keys, and returns DG1 + DG2 + PA/AA results.
   * Holds the card against the phone until the promise resolves.
   */
  readChip(options: GhanaCardMrzKeys): Promise<GhanaCardChipReadResult>;

  /** Cancel an in-flight NFC wait. */
  cancel(): Promise<void>;
}

export const GhanaCardNfc = registerPlugin<GhanaCardNfcPlugin>("GhanaCardNfc", {
  web: () => import("./ghana-card-nfc-web").then((m) => new m.GhanaCardNfcWeb()),
});
