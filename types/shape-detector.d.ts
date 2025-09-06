// Optional: Add the BarcodeDetector interface if you want typings
interface BarcodeDetector {
  new(options?: { formats?: string[] }): BarcodeDetector;
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface DetectedText {
  boundingBox: DOMRectReadOnly;
  rawValue: string;
  cornerPoints?: DOMPoint[];
}
interface DetectedBarcode extends DetectedText {
  format: string;
}

interface TextDetector {
  detect(image: ImageBitmapSource): Promise<DetectedText[]>;
}

declare var TextDetector: {
  prototype: TextDetector;
  new(): TextDetector;
};
declare var BarcodeDetector: {
  prototype: BarcodeDetector;
  new(): BarcodeDetector;
};
