import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { ImagePrinterService } from "./ImagePrinterService";
import { TextAlign, TextStyle } from "./IPrinterService";

export class LogPrinterService extends ImagePrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _imageCanvas?: HTMLCanvasElement;
    private _tempCanvas?: HTMLCanvasElement;

    public init(): Promise<void> {
        this.device = { id: "", name: "console" };
        return Promise.resolve();
    }
    public connect(): Promise<void> {
        return Promise.resolve();
    }
    public disconnect(): Promise<void> {
        return Promise.resolve();
    }
    public dispose(): Promise<void> {
        return Promise.resolve();
    }

    public printLine(text: string, textStyle?: DeepPartial<TextStyle>): void {
        if (this.option.textAsImage) {
            return super.printLine(text, textStyle);
        }

        textStyle = copy(textStyle, this.currentStyle);
        switch (textStyle.align) {
            case TextAlign.right: {
                text = text.padStart(50);
                break;
            }
            case TextAlign.center: {
                text = ' '.repeat((50 - text.length) / 2) + text;
                break;
            }
        }
        console.log(text);
    }
    public printSeparator(separator: string): void {
        if (this.option.textAsImage) {
            return super.printSeparator(separator);
        }

        console.log(separator.padStart(50, separator));
    }

    public textAlign(align: TextAlign): void { }
    public cut(isFull?: boolean): void {
        console.log("cut");
    }
    public lineFeed(n: number = 1): void {
        for (let i = 0, len = n || 1; i < len; i++) {
            console.log("");
        }
    }
    public feed(pt: number = 24): void {
        if (this.option.textAsImage) {
            return super.feed(pt);
        }

        this.lineFeed(Math.ceil(pt / 24));
    }

    public printImage(data: ArrayBufferLike, width: number, height: number): void {
        if (!this._imageCanvas) {
            this._imageCanvas = document.createElement('canvas');
        }
        this._imageCanvas.width = width;
        this._imageCanvas.height = height;
        const ctx = this._imageCanvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
        }
        this._tempCanvas.width = width;
        this._tempCanvas.height = height;
        const tempCtx = this._tempCanvas.getContext('2d')!;
        tempCtx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
        ctx.drawImage(this._tempCanvas, 0, 0);

        const dataUrl = this._imageCanvas.toDataURL();
        const style = [
            'font-size: 1px;',
            `background: url(${dataUrl}) no-repeat;`,
            'background-size: contain;',
            `padding: ${height}px ${width}px;`, // height:width
            'line-height: 0;',
        ].join(' ');

        console.log('%c ', style);
    }
    public openCashdrawer(): void { }
    public printQR(): void { }
    public printBarcode(): void { }
    public pause(): void { }
}