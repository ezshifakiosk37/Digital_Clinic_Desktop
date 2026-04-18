import { HARDWARE_PARSERS } from "../data/HardwareParser";
import { VitalsDataForHardware } from "../types";

export const AndroidBridge = {
  /**
   * Sends dispense command: D:row,col,qty
   */
  dispenseMedicine: (row: number, col: number, quantity: number) => {
    const bridge = window.AndroidNative;
    if (bridge?.sendMedicinePacket) {
      const payload = `D:${row},${col},${quantity}`;
      try {
        bridge.sendMedicinePacket(payload);
        return true;
      } catch (err) {
        console.error("Hardware Write Error:", err);
        return false;
      }
    }
    return false;
  },

  /**
   * Listens to serial data and maps it to the Vitals State
   */
  initVitalsListener: (onUpdate: (data: Partial<VitalsDataForHardware>) => void) => {
    window.onSerialData = (rawData: string) => {
      if (!rawData) return;
      const data = rawData.trim();

      console.log("Incoming Serial:", data); // Logic: Always log to verify hardware output

      for (const parser of HARDWARE_PARSERS) {
        const match = data.match(parser.pattern);
        if (match) {
          if (parser.transform) {
            // Use custom transform for nested data (like BP)
            onUpdate(parser.transform(match));
          } else if (parser.keys) {
            // Standard mapping for flat values
            const result: any = {};
            parser.keys.forEach((key, index) => {
              result[key] = match[index + 1];
            });
            onUpdate(result);
          }
          break;
        }
      }
    };
  },

  printPrescription: (htmlContent: string) => {
    // Safety check for Server Side Rendering (SSR)
    if (typeof window === "undefined") return false;

    const bridge = window.AndroidNative;

    if (bridge?.printReceipt) {
      // CASE: Running in Android App
      console.log("Outputting to Thermal Printer...");
      bridge.printReceipt(htmlContent);
      return true;
    } else {
      // CASE: Running in Windows Browser / Laptop
      console.log("No Bridge found. Defaulting to System Print...");
      window.print();
      return true;
    }
  }


};