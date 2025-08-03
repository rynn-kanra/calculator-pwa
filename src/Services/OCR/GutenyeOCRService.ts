import { OCRServiceBase } from "./OCRService";
import type Ocr from "@gutenye/ocr-browser";
import { loadDefault } from "../../Utility/loadModule";

export class GutenyeOCRService extends OCRServiceBase {
    private _engine?: Ocr;
    private _canvas?: OffscreenCanvas;

    public override depedencies: string[] = [
        "./workers/gutenye.js",
        './assets/models/paddleocr/ch_PP-OCRv4_det_infer.onnx',
        './assets/models/paddleocr/ch_PP-OCRv4_rec_infer.onnx',
        './assets/models/paddleocr/ppocr_keys_v1.txt',
    ];
    public async init(): Promise<void> {
        const ocr = await loadDefault("./workers/gutenye.js");
        this._engine = await ocr.create({
            models: {
                detectionPath: './assets/models/paddleocr/ch_PP-OCRv4_det_infer.onnx',
                recognitionPath: './assets/models/paddleocr/ch_PP-OCRv4_rec_infer.onnx',
                dictionaryPath: './assets/models/paddleocr/ppocr_keys_v1.txt'
            },
            onnxOptions: {
                executionProviders: ['webgpu', 'wasm'],
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
            return lines?.map(o => o.text).join("\n") || "";
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    }
    async resize(input: Blob, maxSize = 960): Promise<Blob> {
        if (!this._canvas) {
            this._canvas = new OffscreenCanvas(0, 0);
        }
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(input);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };
            img.src = url;
        });

        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1); // only downscale
        if (scale >= 1) {
            return input;
        }

        this._canvas.width = Math.round(img.width * scale);
        this._canvas.height = Math.round(img.height * scale);
        const ctx = this._canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, this._canvas.width, this._canvas.height);
        return await this._canvas.convertToBlob({
            type: 'image/webp',
            quality: 0.8
        });
    }
}
