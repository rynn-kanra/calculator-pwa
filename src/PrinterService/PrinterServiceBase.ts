import html2canvas from "html2canvas";
import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { retry } from "../Utility/retry";
import { Barcode2DOption, Barcode1DOption, FontMode, FontStyle, IDevice, IGridOption, IPrinterService, PrintImageData, TextAlign, TextStyle, BarcodeType, BarcodeTextPosition, PDF417Option, QRCodeOption, AztecOption, DataMatrixOption } from "./IPrinterService";
import WorkerService from "../Services/WorkerService";

export abstract class PrinterServiceBase<TCommand> implements IPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        if (!option) {
            option = {}
        }
        this.option = Object.assign(new PrinterConfig(), option);

        if (!style) {
            style = {};
        }

        this.defaultStyle = copy(style, {
            align: TextAlign.left,
            lineHeight: 1.2,
            font: {
                fontFaceType: 0,
                fontStyle: FontMode.none,
                size: 24
            }
        } as TextStyle);
        this.currentStyle = copy({}, this.defaultStyle);
    }

    public device?: IDevice;
    public abstract init(id?: string): Promise<void>;
    public abstract connect(): Promise<void>;
    public abstract disconnect(): Promise<void>;
    public abstract execute(command: TCommand): Promise<void>;

    public async dispose(): Promise<void> {
        this._queue.length = 0;
        await this.disconnect();
    }

    protected currentStyle: TextStyle;
    protected defaultStyle: TextStyle;
    private _canvas: HTMLCanvasElement | null = null;
    private _htmlContainer: HTMLDivElement | null = null;
    public option: PrinterConfig;

    private _queue: Promise<TCommand | null>[] = [];
    private _isRunning = false;
    protected enqueue(command: TCommand | null | Promise<TCommand | null>, isTop: boolean = false) {
        if (isTop) {
            this._queue.unshift(Promise.resolve(command));
        }
        else {
            this._queue.push(Promise.resolve(command));
        }
        this.runQueue();
    }
    protected async runQueue() {
        if (this._isRunning) {
            return;
        }

        this._isRunning = true;
        try {
            const delays = [500, 500, 1000, 1000 * 2, 1000 * 5, 1000 * 10, 1000 * 30, 1000 * 60];
            await retry(async () => {
                if (this._queue.length <= 0) {
                    return;
                }

                // ensure device connected.
                await this.connect();
                while (this._queue.length > 0) {
                    const c = await this._queue[0];
                    if (c === null) {
                        if (this.option.sharePrinter) {
                            await this.disconnect();
                        }
                        this._queue.shift();
                        return true;
                    }
                    else {
                        await this.execute(c);
                        this._queue.shift();
                    }
                }
            }, delays);
        }
        catch { }

        this._isRunning = false;
    }

    public pause(): void {
        this.enqueue(Promise.resolve(null));
    }

    public print(text: string | PromiseLike<string>, fontStyle?: DeepPartial<FontStyle>): void {
        const textStyle = fontStyle ? copy({ font: fontStyle }, this.currentStyle) : undefined;
        this.printLine(text, textStyle);
    }
    public printLine(text: string | PromiseLike<string>, textStyle?: DeepPartial<TextStyle>): void {
        const style = copy(textStyle, this.currentStyle);
        const p = Promise.resolve(text).then<PrintImageData>(async (text) => {
            const imageData = await WorkerService.canvas.image.drawText(text, this.option.width, style);
            return {
                data: imageData.data.buffer,
                width: imageData.width,
                height: imageData.height
            };
        });

        this.printImage(p);
    }
    public printSeparator(separator: string): void {
        const textStyle = this.currentStyle;
        const imageDataPromise = WorkerService.canvas.image.drawSeparator(separator, this.option.width, textStyle)
            .then(o => ({
                data: o.data.buffer,
                height: o.height,
                width: o.width
            }));
        this.printImage(imageDataPromise);
    }

    public reset(): void {
        this.currentStyle = copy({}, this.defaultStyle);
    }
    public abstract textAlign(align: TextAlign): void;
    public abstract cut(isFull?: boolean): void;
    public abstract lineFeed(n?: number): void;
    public feed(pt: number = 24): void {
        const imageDataPromise = WorkerService.canvas.image.drawBlank(pt, this.option.width, this.currentStyle)
            .then(o => ({
                data: o.data.buffer,
                height: o.height,
                width: o.width
            }));
        this.printImage(imageDataPromise);
    }

    public printHtml(html: string | PromiseLike<string>) {
        if (!this._htmlContainer) {
            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = "-9999px";
            div.style.textOrientation = ""
            div.style.width = `${this.option.width}px`;
            document.body.appendChild(div);
            this._htmlContainer = div;
            // div.style.left = "0";
            // div.style.top = "0";
            // div.style.zIndex = "999";
        }
        const p = Promise.resolve(html).then<PrintImageData>(async (html) => {
            this._htmlContainer!.innerHTML = html;
            const canvas = await html2canvas(this._htmlContainer!, {
                scale: 1,
                useCORS: true,
                backgroundColor: null,
            });
            const ctx = canvas.getContext('2d')!;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return {
                data: imageData.data.buffer,
                height: imageData.height,
                width: imageData.width
            };
        });

        this.printImage(p);
    }

    public printGrid(data: string[][] | PromiseLike<string[][]>, option?: IGridOption): void {
        const p = Promise.resolve(data).then<string>((data) => {
            if (!option) {
                option = {};
            }
            if (!Array.isArray(option.columns)) {
                option.columns = [];
            }
            const columns = Array.from(option.columns);
            const columnDefined = columns.length > 0;
            while (columns.length < data[0].length) {
                columns.push({ width: +columnDefined });
            }
            const gridStyle = [
                'display:grid',
                `grid-template-columns: ${columns.map(o => o.width ? `${o.width}fr` : 'auto').join(" ")}`,
                `gap: ${(option.gap?.[0] ?? 0)}em ${(option.gap?.[1] ?? 0)}em`,
                `line-height: ${this.currentStyle.lineHeight}`,
                `font-family: sans-serif`
            ];
            const styles = columns.map(o => {
                const textStyle = copy(o, this.currentStyle);
                const alignStyle = textStyle.align == TextAlign.center ? 'center' : textStyle.align == TextAlign.right ? 'right' : 'left';
                const styles = [
                    `text-align:${(alignStyle)}`,
                    `line-height:${textStyle.lineHeight}`,
                    `font-size:${textStyle.font.size}px`,
                ];

                if (textStyle.font.fontStyle & FontMode.bold) {
                    styles.push(`font-weight:bold`);
                }
                if (textStyle.font.fontStyle & FontMode.italic) {
                    styles.push(`font-style:italic`);
                }
                if (textStyle.font.fontStyle & FontMode.underline) {
                    styles.push(`text-decoration:underline`);
                }

                return styles.join(";");
            });
            return `<div style='${gridStyle.join(';')}'>${data.flatMap(row => row.map((col, ix) => {
                ix = Math.min(ix, styles.length - 1);
                return `<div style='${styles[ix]}'>${col}</div>`;
            })).join('')
                }</div>`;
        });
        this.printHtml(p);
    }

    public setDefaultStyle(style: TextStyle): void {
        this.defaultStyle = style;
        this.currentStyle = copy({}, style);
    }
    public abstract printImage(data: PrintImageData | Promise<PrintImageData>): void;
    public abstract openCashdrawer(): void;

    public printBarcode(data: string | PromiseLike<string>, option?: DeepPartial<Barcode1DOption | Barcode2DOption>) {
        const imageDataPromise = Promise.resolve(data)
            .then(o => WorkerService.canvas.image.drawBarcode(o, option))
            .then(o => ({
                data: o.data.buffer,
                height: o.height,
                width: o.width
            }));
        this.printImage(imageDataPromise);
    }
}