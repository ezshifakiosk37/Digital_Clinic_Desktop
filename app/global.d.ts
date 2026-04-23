export { };

declare global {
  interface Window {
    AndroidNative?: {
      sendMedicinePacket: (jsonString: string) => void;
      connectUsb: () => void;
      disconnectUsb: () => void;
      
      /** High-speed JSON Printing */
      printRawJSON: (jsonString: string) => void;
      
      getPrinterStatus?: () => string;
    };

    /** Unified Hardware Listeners */
    onUsbStatus?: (status: string) => void;
    onSerialData?: (data: string) => void;
    onPrintResult?: (success: boolean, message: string) => void;
    
    /** Printer Selection Listeners */
    onPrintersLoaded?: (data: string) => void;
    onPrinterSelected?: (success: boolean, message: string) => void;
  }
}