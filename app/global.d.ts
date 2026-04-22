export { };

declare global {
  interface Window {
    AndroidNative?: {
      /** Existing IoT/Hardware methods */
      sendMedicinePacket: (jsonString: string) => void;

      connectUsb: () => void;
      disconnectUsb: () => void;

      /** * Print raw text or ESC/POS commands. 
       * Use this for simple text or when you've pre-formatted the string.
       */
      printReceipt: (text: string) => void;

      /** * NEW: Send a Base64 encoded PNG/JPG.
       * This is the ONLY way to make your Tailwind layout look correct 
       * on the thermal printer.
       */
      printImage: (base64Data: string) => void;

      /**
       * Optional: Get printer status (Out of paper, Disconnected, etc.)
       */
      getPrinterStatus?: () => string;
    };

    /** * NEW: Refined Statuses. 
     * Logic should handle: "CONNECTED", "DISCONNECTED", "DEVICE_NOT_FOUND", "PERMISSION_DENIED"
     */
    onUsbStatus?: (status: "CONNECTED" | "DISCONNECTED" | "DEVICE_NOT_FOUND" | "PERMISSION_DENIED" | string) => void;

    /** Listeners called FROM Android TO JavaScript */
    onSerialData?: (data: string) => void;
    onUsbStatus?: (status: string) => void;

    /** NEW: Notify JS if the print job finished or failed */
    onPrintResult?: (success: boolean, message: string) => void;
  }
}