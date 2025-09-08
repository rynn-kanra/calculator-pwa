import html2canvas from "html2canvas";
import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { retry } from "../Utility/retry";
import { Barcode2DOption, Barcode1DOption, FontMode, FontStyle, IDevice, IGridOption, IPrinterService, PrintImageData, TextAlign, TextStyle } from "./IPrinterService";

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
    public printLine(text: string | PromiseLike<string>, textStyl?: DeepPartial<TextStyle>): void {
        const textStyle = copy(textStyl, this.currentStyle);
        const p = Promise.resolve(text).then<PrintImageData>((text) => {
            const imageData = this.drawCanvas((cv, ctx) => {
                const lines = [];
                let line = '';
                let textHeight: number = textStyle.font.size;
                for (let i = 0; i < text.length; i++) {
                    const testLine = line + text[i];
                    const metrics = ctx.measureText(testLine);

                    if (metrics.width > cv.width && line !== '') {
                        lines.push(line);
                        line = text[i];
                    } else {
                        line = testLine;
                    }
                }
                if (line) {
                    lines.push(line);
                }

                const lineHeight = Math.ceil(textHeight * textStyle.lineHeight);
                const height = lines.length * lineHeight;
                const x = textStyle.align === TextAlign.right
                    ? cv.width
                    : textStyle.align == TextAlign.center
                        ? cv.width / 2
                        : 0;

                for (let i = 0; i < lines.length; i++) {
                    const y = i * lineHeight + Math.ceil((lineHeight - textHeight) / 2);
                    const text = lines[i];
                    ctx.fillText(text, x, y);
                    if (textStyle.font.fontStyle & FontMode.underline) {
                        const textWidth = ctx.measureText(text).width;
                        const y2 = y + lineHeight - Math.ceil((lineHeight - textHeight) / 2);
                        ctx.beginPath();

                        const lx = textStyle.align === TextAlign.right
                            ? x - textWidth
                            : textStyle.align == TextAlign.center
                                ? x - (textWidth / 2)
                                : 0;

                        ctx.moveTo(lx, y2);
                        ctx.lineTo(lx + textWidth, y2);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = ctx.fillStyle;
                        ctx.stroke();
                    }
                }

                return height;
            }, textStyle);

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
        const imageData = this.drawCanvas((cv, ctx) => {
            const textHeight = this.currentStyle.font.size;
            const lineHeight = textHeight * textStyle.lineHeight!;

            const metrics = ctx.measureText(separator);
            const count = Math.ceil(cv.width / metrics.width);
            const text = separator.repeat(count);

            const y = Math.floor((lineHeight - textHeight) / 2);
            const x = textStyle.align === TextAlign.right
                ? cv.width
                : textStyle.align == TextAlign.center
                    ? cv.width / 2
                    : 0;
            ctx.fillText(text, x, y);
            return lineHeight;
        });

        this.printImage({
            data: imageData.data.buffer,
            height: imageData.height,
            width: imageData.width
        });
    }

    public reset(): void {
        this.currentStyle = copy({}, this.defaultStyle);
    }
    public abstract textAlign(align: TextAlign): void;
    public abstract cut(isFull?: boolean): void;
    public abstract lineFeed(n?: number): void;
    public feed(pt: number = 24): void {
        const imageData = this.drawCanvas((cv, ctx) => {
            const textHeight = pt;
            const lineHeight = textHeight * this.currentStyle.lineHeight;

            ctx.fillStyle = 'white'; // blank = white background
            ctx.fillRect(0, 0, cv.width, lineHeight);
            return lineHeight;
        });

        this.printImage({
            data: imageData.data.buffer,
            height: imageData.height,
            width: imageData.width
        });
    }

    protected drawCanvas(draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => number, textStyle?: DeepPartial<TextStyle>): ImageData {
        let canvas = this._canvas;
        this._canvas = null;
        const width = this.option.width; // Math.floor(this.option.paperWidth * this.option.dpi / 25.4);
        const height = 100;
        if (!canvas) {
            canvas = document.createElement("canvas");
            // canvas.style.position = "absolute";
            // canvas.style.zIndex = "999";
            // canvas.style.border = "solid black 1px";
            // canvas.style.top = "0px";
            // canvas.style.right = "0px";
            // document.body.append(canvas);
            // globalThis.canvas = canvas;
        }
        if (!textStyle) {
            textStyle = this.currentStyle;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'top';
        ctx.font = `${textStyle!.font!.size}px sans-serif`;
        if (textStyle!.font!.fontStyle! & FontMode.italic) {
            ctx.font += " italic";
        }
        if (textStyle!.font!.fontStyle! & FontMode.bold) {
            ctx.font += " bold";
        }
        switch (textStyle.align) {
            case TextAlign.right: {
                ctx.textAlign = "right";
                break;
            }
            case TextAlign.center: {
                ctx.textAlign = "center";
                break;
            }
            case TextAlign.left:
            default: {
                ctx.textAlign = "left";
                break;
            }
        }

        ctx.clearRect(0, 0, width, height);
        const finalHeight = draw(canvas, ctx);
        const imageData = ctx.getImageData(0, 0, width, finalHeight);

        this._canvas = canvas;

        return imageData;
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

    public printGrid(option: IGridOption, data: string[][] | PromiseLike<string[][]>): void {
        const gridStyle = [
            'display:grid',
            `grid-template-columns: ${option.columns.map(o => o.width ? `${o.width}fr` : 'auto').join(" ")}`,
            `gap: ${(option.gap?.[0] ?? 0)}px ${(option.gap?.[1] ?? 0)}px`,
            `line-height: ${this.currentStyle.lineHeight}`,
            `font-family: sans-serif`,
            ``
        ];
        const styles = option.columns.map(o => {
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
        const p = Promise.resolve(data).then<string>((data) => `<div style='${gridStyle.join(';')}'>
            ${data.flatMap(row => row.map((col, ix) => {
                ix = Math.min(ix, styles.length - 1);
                return `<div style='${styles[ix]}'>${col}</div>`;
            })).join('')}
    </div>`);
        this.printHtml(p);
    }

    public setDefaultStyle(style: TextStyle): void {
        this.defaultStyle = style;
        this.currentStyle = copy({}, style);
    }
    public abstract printImage(data: PrintImageData | Promise<PrintImageData>): void;
    public abstract openCashdrawer(): void;
    public abstract printBarcode(data: string | PromiseLike<string>, option?: DeepPartial<Barcode1DOption | Barcode2DOption>): void;
}