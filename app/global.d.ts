export {};

declare global {
  interface Window {
    // This tells TypeScript that AndroidNative exists and what methods it has
    AndroidNative?: {
      sendMedicinePacket: (jsonString: string) => void;
      connectUsb: () => void;
    };
    // These are the listeners we call FROM Android TO JavaScript
    onSerialData?: (data: string) => void;
    onUsbStatus?: (status: string) => void;
  }
}