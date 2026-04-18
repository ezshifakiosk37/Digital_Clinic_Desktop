import { VitalsData } from "../types";

export const AndroidBridge = {
  /**
   * Sends dispense command to ESP32
   * Format: D:row,col,qty (e.g., "D:2,4,6")
   */
  dispenseMedicine: (row: number, col: number, quantity: number) => {
    if (window.AndroidNative?.sendMedicinePacket) {
      // Ditching JSON for the lightweight custom string protocol
      const payload = `D:${row},${col},${quantity}`;

      try {
        window.AndroidNative.sendMedicinePacket(payload);
        console.log("Sent to Hardware:", payload);
        return true;
      } catch (err) {
        console.error("Bridge Communication Error:", err);
        return false;
      }
    }

    console.warn("Android Bridge not found. Simulation mode active.");
    return false;
  },

  initVitalsListener: (onUpdate: (data: VitalsData) => void) => {
    window.onSerialData = (rawData: string) => {
      if (!rawData) return;
      const data = rawData.trim();

      for (const parser of HARDWARE_PARSERS) {
        const match = data.match(parser.pattern);
        if (match) {
          const result: VitalsData = {};
          parser.keys.forEach((key, index) => {
            // match[0] is full string, match[1] is first group
            result[key as keyof VitalsData] = match[index + 1];
          });
          onUpdate(result);
          break;
        }
      }
    };
  }
};