export {};

declare global {
  interface Window {
    AndroidNative?: {
      /** Existing IoT/Hardware methods */
      sendMedicinePacket: (jsonString: string) => void;
      connectUsb: () => void;

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

    /** Listeners called FROM Android TO JavaScript */
    onSerialData?: (data: string) => void;
    onUsbStatus?: (status: string) => void;
    
    /** NEW: Notify JS if the print job finished or failed */
    onPrintResult?: (success: boolean, message: string) => void;
  }
}