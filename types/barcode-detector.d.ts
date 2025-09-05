interface Window {
    BarcodeDetector: BarcodeDetector;
}

// Optional: Add the BarcodeDetector interface if you want typings
interface BarcodeDetector {
    new(options?: { formats?: string[] }): BarcodeDetector;
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface DetectedBarcode {
    boundingBox: DOMRectReadOnly;
    rawValue: string;
    format: string;
    cornerPoints?: DOMPoint[];
}