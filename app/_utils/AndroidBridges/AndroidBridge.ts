import { HARDWARE_PARSERS } from "../data/HardwareParser";
import { VitalsDataForHardware } from "../types";

export const AndroidBridge = {
  /**
   * RECONNECT LOGIC: 
   * Forcefully closes the existing port and re-establishes a fresh connection.
   */
  handleReconnect: () => {
    const bridge = (window as any).AndroidNative;
    if (!bridge) return false;

    if (bridge.disconnectUsb) {
      bridge.disconnectUsb();
    }

    setTimeout(() => {
      bridge.connectUsb?.();
    }, 500);

    return true;
  },

  /**
   * Initializes listeners for both data and connection status.
   * This is the ONLY listener init you need.
   */
  initHardwareListeners: (
    onDataUpdate: (data: Partial<VitalsDataForHardware>) => void,
    onStatusUpdate?: (status: string) => void
  ) => {
    window.onUsbStatus = (status: string) => {
      if (onStatusUpdate) onStatusUpdate(status);
    };

    window.onSerialData = (rawData: string) => {
      if (!rawData) return;
      const data = rawData.trim();

      for (const parser of HARDWARE_PARSERS) {
        const match = data.match(parser.pattern);
        if (match) {
          if (parser.transform) {
            onDataUpdate(parser.transform(match)); 
          } else if (parser.keys) {
            const result: any = {};
            parser.keys.forEach((key, index) => {
              result[key] = match[index + 1];
            });
            onDataUpdate(result); 
          }
          break;
        }
      }
    };
  },

  /**
   * Sends dispense command as a JSON string to Kotlin.
   */
  dispenseMedicine: (row: number, col: number, quantity: number) => {
    const bridge = (window as any).AndroidNative;
    if (bridge?.sendMedicinePacket) {
      const payload = JSON.stringify({
        action: "dispense",
        row,
        col,
        quantity
      });

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
   * Data-driven Printing: High-speed thermal printing via JSON.
   */
  printThermal: (data: any): boolean => {
    if (typeof window === "undefined") return false;
    const bridge = (window as any).AndroidNative;

    if (bridge && typeof bridge.printRawJSON === 'function') {
      try {
        bridge.printRawJSON(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error("Print Error:", err);
        return false;
      }
    } else {
      window.print();
      return false;
    }
  },
};