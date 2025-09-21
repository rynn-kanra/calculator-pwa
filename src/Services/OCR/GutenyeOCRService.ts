import { OCRServiceBase } from "./OCRService";
import type GutenyeWorker from "../../Workers/GutenyeWorker";
import { Remote, UnProxyMarked, wrap } from "comlink";

export class GutenyeOCRService extends OCRServiceBase {
    private _engine?: Remote<UnProxyMarked<typeof GutenyeWorker>>;

    public override depedencies: string[] = [
        "./workers/GutenyeWorker.js",
        './assets/models/paddleocr-en/det.onnx',
        './assets/models/paddleocr-en/rec.onnx',
        './assets/models/paddleocr-en/dictionary.txt',
    ];
    public async init(): Promise<void> {
        if (this._engine) {
            return;
        }

        this._engine = wrap<typeof GutenyeWorker>(new Worker("./workers/GutenyeWorker.js", { type: "module" }));
    }
    async recognize(input: Blob): Promise<string> {
        if (!this._engine) {
            await this.init();
        }

        const resizedImage = await this.resize(input);
        const result = await this._engine?.detect(resizedImage);
        return result || "";
    }
}
