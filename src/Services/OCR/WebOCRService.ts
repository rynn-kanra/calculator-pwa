import { OCRServiceBase } from "./OCRService";

export class WebOCRService extends OCRServiceBase {
    private _engine?: TextDetector;

    public override depedencies: string[] = [];
    public async init(): Promise<void> {
        if (!("TextDetector" in window)) {
            throw new Error("Text detector not supported");
        }

        this._engine = new TextDetector();
    }
    async recognize(input: Blob): Promise<string> {
        if (!this._engine) {
            await this.init();
        }

        const resizedImage = await this.resize(input);
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(resizedImage);
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

        const lines = await this._engine?.detect(img);
        console.log(lines);
        return this.parseResult(lines!)?.join("\n") || "";
    }
    private parseResult(lines: DetectedText[], threshold = 10) {
        lines = lines
            .toSorted((a, b) => a.boundingBox.left - b.boundingBox.left)
            .sort((a, b) => {
                const d = a.boundingBox.top - b.boundingBox.top;
                if (Math.abs(d) <= threshold) {
                    return 0;
                }

                return d;
            });

        const results: string[] = [];
        let top = 0;
        for (const box of lines) {
            if (top > box.boundingBox.top) {
                results[results.length - 1] += ` ${box.rawValue}`;
            }
            else {
                top = box.boundingBox.top + box.boundingBox.height - threshold;
                results.push(box.rawValue);
            }
        }

        return results;
    }
}
