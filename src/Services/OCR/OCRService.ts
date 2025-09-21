import { transfer } from "comlink";
import CanvasWorkerService from "../CanvasWorkerService";

export interface IOCRService {
    depedencies: string[];
    init(): Promise<void>;
    recognize(input: File): Promise<string>;
    recognizeImage(): Promise<string>;
}

export abstract class OCRServiceBase implements IOCRService {
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
    protected resize(input: Blob, maxSize = 960): Promise<Blob> {
        return CanvasWorkerService.resize(transfer(input, [input]), maxSize);
    }
}