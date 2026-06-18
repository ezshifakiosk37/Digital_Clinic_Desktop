// src/utils/pdfExport.ts
import jsPDF from 'jspdf';

/**
 * Universal PDF download function - works on Android WebView and browsers
 */
export const downloadPDF = (
  doc: jsPDF, 
  fileName: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  try {
    const pdfBlob = doc.output('blob');

    // Check if running in Android WebView
    const android = window.AndroidNative;
    
    if (android && typeof android.downloadPDF === 'function') {
      // Android path - send Base64 through bridge
      const reader = new FileReader();
      reader.onload = function() {
        const base64 = (reader.result as string).split(',')[1];
        android.downloadPDF(base64, fileName);
        onSuccess?.();
      };
      reader.onerror = function() {
        onError?.('Failed to read PDF data');
      };
      reader.readAsDataURL(pdfBlob);
    } else {
      // Browser fallback
      doc.save(fileName);
      onSuccess?.();
    }
  } catch (error) {
    console.error('PDF download failed:', error);
    onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
};