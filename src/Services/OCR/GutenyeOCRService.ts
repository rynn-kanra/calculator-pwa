import { OCRServiceBase } from "./OCRService";
import type Ocr from "@gutenye/ocr-browser";
import { loadDefault } from "../../Utility/loadModule";

export class GutenyeOCRService extends OCRServiceBase {
    private _engine?: Ocr;

    public override depedencies: string[] = [
        "./workers/gutenye.js",
        './assets/models/paddleocr-en/det.onnx',
        './assets/models/paddleocr-en/rec.onnx',
        './assets/models/paddleocr-en/dictionary.txt',
    ];
    public async init(): Promise<void> {
        if (this._engine) {
            return;
        }

        const ocr = await loadDefault("./workers/gutenye.js");
        this._engine = await ocr.create({
            models: {
                detectionPath: './assets/models/paddleocr-en/det.onnx',
                recognitionPath: './assets/models/paddleocr-en/rec.onnx',
                dictionaryPath: './assets/models/paddleocr-en/dictionary.txt'
            },
            onnxOptions: {
                executionProviders: ['webnn', 'webgpu', 'wasm'],
                graphOptimizationLevel: 'all'
            }
        });

    }
    async recognize(input: Blob): Promise<string> {
        if (!this._engine) {
            await this.init();
        }

        let blobUrl: string = "";
        try {
            const resizedImage = await this.resize(input);
            blobUrl = URL.createObjectURL(resizedImage!);
            const lines = await this._engine?.detect(blobUrl);
            return lines?.map(o => o.text).join("\n").replaceAll('\r', '') || "";
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    }
}
