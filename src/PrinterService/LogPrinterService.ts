import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { PrinterServiceBase } from "./PrinterServiceBase";
import { PrintImageData, TextAlign, TextStyle } from "./IPrinterService";

type MessageLog = {
    message: string,
    params?: any[]
};

const resolvedPromise = Promise.resolve();
export class LogPrinterService extends PrinterServiceBase<MessageLog> {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _imageCanvas?: HTMLCanvasElement;
    private _tempCanvas?: HTMLCanvasElement;

    public execute(command: MessageLog): Promise<void> {
        console.log(command.message, ...(command.params || []));
        return resolvedPromise;
    }

    public init(): Promise<void> {
        this.device = { id: "console", name: "CONSOLE" };
        return resolvedPromise;
    }
    public connect(): Promise<void> {
        return resolvedPromise;
    }
    public disconnect(): Promise<void> {
        return resolvedPromise;
    }
    public dispose(): Promise<void> {
        return resolvedPromise;
    }

    public printLine(text: string | PromiseLike<string>, textStyle?: DeepPartial<TextStyle>): void {
        if (this.option.textAsImage) {
            return super.printLine(text, textStyle);
        }

        textStyle = copy(textStyle, this.currentStyle);
        const p = Promise.resolve(text).then<MessageLog>(text => {
            switch (textStyle?.align) {
                case TextAlign.right: {
                    text = text.padStart(50);
                    break;
                }
                case TextAlign.center: {
                    text = ' '.repeat((50 - text.length) / 2) + text;
                    break;
                }
            }

            return {
                message: text
            };
        });
        this.enqueue(p);
    }
    public printSeparator(separator: string): void {
        if (this.option.textAsImage) {
            return super.printSeparator(separator);
        }

        this.enqueue({
            message: separator.padStart(50, separator)
        });
    }

    public textAlign(align: TextAlign): void { }
    public cut(isFull?: boolean): void {
        this.enqueue({
            message: 'cut'
        });
    }
    public lineFeed(n: number = 1): void {
        for (let i = 0, len = n || 1; i < len; i++) {
            this.enqueue({
                message: ''
            });
        }
    }
    public feed(pt: number = 24): void {
        if (this.option.textAsImage) {
            return super.feed(pt);
        }

        this.lineFeed(Math.ceil(pt / 24));
    }

    public printImage(image: PrintImageData | PromiseLike<PrintImageData>): void {
        if (!this._imageCanvas) {
            this._imageCanvas = document.createElement('canvas');
        }
        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
        }

        const p = Promise.resolve(image).then<MessageLog>(image => {
            this._imageCanvas!.width = image.width;
            this._imageCanvas!.height = image.height;
            const ctx = this._imageCanvas!.getContext('2d')!;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, image.width, image.height);

            this._tempCanvas!.width = image.width;
            this._tempCanvas!.height = image.height;
            const tempCtx = this._tempCanvas!.getContext('2d')!;
            tempCtx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
            ctx.drawImage(this._tempCanvas!, 0, 0);

            const dataUrl = this._imageCanvas!.toDataURL();
            const style = [
                'font-size: 1px;',
                `background: url(${dataUrl}) no-repeat;`,
                'background-size: contain;',
                `padding: ${image.height}px ${image.width}px;`, // height:width
                'line-height: 0;',
            ].join(' ');

            return {
                message: '%c ',
                params: [style]
            };
        });

        this.enqueue(p);
    }
    public openCashdrawer(): void { }
    public printBarcode(): void { }
    public pause(): void { }
}