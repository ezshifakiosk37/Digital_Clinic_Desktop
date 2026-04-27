import { HARDWARE_PARSERS } from "../data/HardwareParser";
import { VitalsDataForHardware } from "../types";

export const AndroidBridge = {
  /**
   * RECONNECT LOGIC: 
   * Forcefully closes the existing port and re-establishes a fresh connection.
   */
  handleReconnect: () => {
    const bridge = window.AndroidNative;
    if (!bridge) return false;

    console.log("Initiating Hardware Reset...");

    // 1. Tell Android to release the USB port
    if (bridge.disconnectUsb) {
      bridge.disconnectUsb();
    }

    // 2. Short delay to allow the Android OS to release the hardware resource
    setTimeout(() => {
      console.log("Re-establishing USB Connection...");
      bridge.connectUsb();
    }, 500);

    return true;
  },

  /**
   * Triggers the Android Native USB connection logic (Direct Call)
   */
  connectHardware: () => {
    const bridge = window.AndroidNative;
    if (bridge?.connectUsb) {
      bridge.connectUsb();
      return true;
    }
    return false;
  },

  /**
   * Initializes listeners for both data and connection status
   */
  initHardwareListeners: (
    onDataUpdate: (data: Partial<VitalsDataForHardware>) => void,
    onStatusUpdate?: (status: string) => void
  ) => {
    window.onUsbStatus = (status: string) => {
      console.log("USB Status:", status);
      if (onStatusUpdate) onStatusUpdate(status);
    };

    window.onSerialData = (rawData: string) => {
      if (!rawData) return;
      const data = rawData.trim();

      for (const parser of HARDWARE_PARSERS) {
        const match = data.match(parser.pattern);
        if (match) {
          if (parser.transform) {
            // FIXED: Changed from onUpdate to onDataUpdate
            onDataUpdate(parser.transform(match));
          } else if (parser.keys) {
            const result: any = {};
            parser.keys.forEach((key, index) => {
              result[key] = match[index + 1];
            });
            // FIXED: Changed from onUpdate to onDataUpdate
            onDataUpdate(result);
          }
          break;
        }
      }
    };
  },
  /**
   * Sends dispense command: D:row,col,qty
   */
  dispenseMedicine: (row: number, col: number, quantity: number) => {
    const bridge = window.AndroidNative;
    if (bridge?.sendMedicinePacket) {
      // 1. Create a JSON object that matches what your Kotlin code expects
      const payloadObject = {
        action: "dispense",
        row: row,
        col: col,
        quantity: quantity
      };

      // 2. Convert it to a string (Stringify)
      const payload = JSON.stringify(payloadObject);

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
  },
  /**
   * Data-driven Printing: Sends raw data to Kotlin for high-speed thermal printing.
   * Fallback: Triggers standard window.print() if not on Android.
   */
  printThermal: (data: any) => {
    if (typeof window === "undefined") return false;
    const bridge = window.AndroidNative;

    if (bridge && typeof bridge.printRawJSON === 'function') {
      try {
        // Convert the JS object to a string for the Bridge
        const payload = JSON.stringify(data);
        bridge.printRawJSON(payload);
        return true;
      } catch (err) {
        console.error("JSON Stringify Error for Print:", err);
        return false;
      }
    } else {
      // FALLBACK: If no bridge or old bridge version, use system print
      console.warn("Native printRawJSON not found. Falling back to system print.");
      window.print();
      return true;
    }
  },
  // ... add this inside the AndroidBridge object in your bridge file

  /**
   * Part 1: Prepares the hardware (Cancel -> Calibration Mode -> Tare)
   */
  startCalibrationSequence: async () => {
    const bridge = window.AndroidNative;
    if (bridge?.sendWeightCalibrationCommand) {
      bridge.sendWeightCalibrationCommand("x"); // Clear old
      await new Promise(r => setTimeout(r, 200));
      bridge.sendWeightCalibrationCommand("c"); // Start Calib
      await new Promise(r => setTimeout(r, 500));
      bridge.sendWeightCalibrationCommand("a"); // Tare
      return true;
    }
    return false;
  },
  /**
   * Part 2: Sends the numerical value the user typed in the popup
   */
  sendFinalCalibrationWeight: (weight: string) => {
    const bridge = window.AndroidNative;
    if (bridge?.sendWeightCalibrationCommand) {
      bridge.sendWeightCalibrationCommand(weight);
      return true;
    }
    return false;
  }


};