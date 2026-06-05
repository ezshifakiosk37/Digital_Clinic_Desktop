export { };

declare global {
  interface Window {
    AndroidNative?: {
      /** 
       * NEW: Controls native ringtone playback for incoming calls.
       * Bypasses WebView autoplay restrictions.
       */
      playIncomingCallSound: () => void;
      stopIncomingCallSound: () => void;
      /** * NEW: Triggers the native Android request for the FCM token.
       * The result is sent back via window.onFcmTokenReceived.
       */
      requestFcmToken: () => void;

      /** * NEW: Deletes the current FCM token and unregisters the device.
       * Useful for security during Doctor Logout.
       */
      unregisterFcmDevice: () => void; // <--- ADD THIS LINE

      /** Sends the specific 'c' character to calibrate the scale. */
      sendWeightCalibrationCommand: (command: string) => void;
      
      /** Existing IoT/Hardware methods */
      sendMedicinePacket: (jsonString: string) => void;
      connectUsb: () => void;
      disconnectUsb: () => void;

      /** Print raw text or ESC/POS commands. */
      printReceipt: (text: string) => void;
      printRawJSON: (jsonString: string) => void;
      
      /** NEW: Send a Base64 encoded PNG/JPG. */
      printImage: (base64Data: string) => void;

      /** Optional: Get printer status (Out of paper, Disconnected, etc.) */
      getPrinterStatus?: () => string;

      /** Requests a fresh glucose reading from the meter. The result will be sent via window.onGlucoseReceived. */
      requestGlucoseReading?: () => void;

      // ─────────────────────────────────────────────────────────────────────────
      // NEW: OPEN KARDIA APP
      // ─────────────────────────────────────────────────────────────────────────
      /** Opens the external Kardia ECG app. */
      openKardiaApp: () => void;

      // ─────────────────────────────────────────────────────────────────────────
      // ECG PENDING FILE (polling from native storage)
      // ─────────────────────────────────────────────────────────────────────────
      /** 
       * Called by the web layer to retrieve any pending ECG file name.
       * Returns the file name (e.g., "ecg-2025-01-15.pdf") or an empty string.
       * After calling, the stored file name is cleared on native side.
       */
      getPendingEcgFile: () => string;

      /**
       * Explicitly clears the stored pending ECG file on the native side.
       */
      clearPendingEcgFile: () => void;
    };

    /** * NEW: Receives the FCM token from Android. 
     * Format: '{"token": "xyz...", "error": null}' 
     */
    onFcmTokenReceived?: (jsonString: string) => void;

    /** Optional: Receives status after unregistration attempt */
    onFcmUnregistered?: (jsonString: string) => void;

    /** NEW: Notify JS if the print job finished or failed */
    onPrintResult?: (success: boolean, message: string) => void;

    /** Refined Statuses for USB Connection */
    onUsbStatus?: (status: "CONNECTED" | "DISCONNECTED" | "DEVICE_NOT_FOUND" | "PERMISSION_DENIED" | string) => void;

    /** Listeners called FROM Android TO JavaScript */
    onSerialData?: (data: string) => void;

    // ─────────────────────────────────────────────────────────────────────────
    // GLUCOSE METER CALLBACK (from Android to JS)
    // ─────────────────────────────────────────────────────────────────────────
    /** Receives a glucose value from the Accu‑Chek Guide meter (mg/dL). */
    onGlucoseReceived?: (mgdl: number) => void;

    // ─────────────────────────────────────────────────────────────────────────
    // ECG FILE DETECTION CALLBACK (from Android to JS)
    // ─────────────────────────────────────────────────────────────────────────
    /** Called when the Android native code detects a new file starting with 'ecg-*' in the Downloads folder. */
    onEcgFileDetected?: (filename: string) => void;
  }
}