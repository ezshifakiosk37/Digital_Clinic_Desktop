export { };

declare global {
  interface Window {
    AndroidNative?: {
      /** * NEW: Triggers the native Android request for the FCM token.
       * The result is sent back via window.onFcmTokenReceived.
       */
      requestFcmToken: () => void;

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
    };

    /** * NEW: Receives the FCM token from Android. 
     * Format: '{"token": "xyz...", "error": null}' 
     */
    onFcmTokenReceived?: (jsonString: string) => void;

    /** NEW: Notify JS if the print job finished or failed */
    onPrintResult?: (success: boolean, message: string) => void;

    /** Refined Statuses for USB Connection */
    onUsbStatus?: (status: "CONNECTED" | "DISCONNECTED" | "DEVICE_NOT_FOUND" | "PERMISSION_DENIED" | string) => void;

    /** Listeners called FROM Android TO JavaScript */
    onSerialData?: (data: string) => void;
  }
}