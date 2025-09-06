
export interface IOCRService {
    depedencies: string[];
    init(): Promise<void>;
    recognize(input: File): Promise<string>;
    recognizeImage(): Promise<string>;
}

export abstract class OCRServiceBase implements IOCRService {
    private _canvas?: OffscreenCanvas;
    private _input?: HTMLInputElement;
    abstract init(): Promise<void>;
    abstract depedencies: string[];
    abstract recognize(input: Blob): Promise<string>;
    public recognizeImage() {
        if (!this._input) {
            this._input = document.createElement("input") as HTMLInputElement;
            this._input.type = 'file';
            this._input.multiple = true;
            this._input.style.display = "none";
            document.body.appendChild(this._input);
        }

        return new Promise<string>((resolve, reject) => {
            this._input!.onchange = async () => {
                if (!this._input?.files) return;
                const text = await this.recognize(this._input.files[0]);
                resolve(text);
            };

            this._input!.value = '';
            this._input!.click();
        });
    }
    protected async resize(input: Blob, maxSize = 960): Promise<Blob> {
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

        if (!this._canvas) {
            this._canvas = new OffscreenCanvas(0, 0);
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