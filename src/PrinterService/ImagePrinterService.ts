import html2canvas from "html2canvas";
import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { FontMode, FontStyle, IColumnOption, IDevice, IGridOption, IPrinterService, TextAlign, TextStyle } from "./IPrinterService";

export abstract class ImagePrinterService implements IPrinterService {
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
    public abstract init(): Promise<void>;
    public abstract connect(): Promise<void>;
    public abstract disconnect(): Promise<void>;
    public abstract dispose(): Promise<void>;

    protected currentStyle: TextStyle;
    protected defaultStyle: TextStyle;
    private _canvas: HTMLCanvasElement | null = null;
    private _htmlContainer: HTMLDivElement | null = null;
    public option: PrinterConfig;

    public print(text: string, fontStyle?: DeepPartial<FontStyle>): void {
        const textStyle = fontStyle ? copy({ font: fontStyle }, this.currentStyle) : undefined;
        this.printLine(text, textStyle);
    }
    public printLine(text: string, textStyl?: DeepPartial<TextStyle>): void {
        const textStyle = copy(textStyl, this.currentStyle);

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

        this.printImage(imageData!.data.buffer, imageData!.width, imageData!.height);
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

        this.printImage(imageData!.data.buffer, imageData!.width, imageData!.height);
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

        this.printImage(imageData!.data.buffer, imageData!.width, imageData!.height);
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
        ctx.textBaseline = 'top';
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

    public printHtml(html: string) {
        if (!this._htmlContainer) {
            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = "-9999px";
            div.style.width = `${this.option.width}px`;
            document.body.appendChild(div);
            this._htmlContainer = div;
            div.style.left = "0";
            div.style.top = "0";
            div.style.zIndex = "999";
        }

        this._htmlContainer.innerHTML = html;
        html2canvas(this._htmlContainer, {
            scale: 1,
            useCORS: true,
            backgroundColor: null,
        }).then(canvas => {
            const ctx = canvas.getContext('2d')!;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.printImage(imageData.data.buffer, imageData.width, imageData.height);
        });
    }

    public printGrid(option: IGridOption, data: string[][]): void {
        const gridStyle = [
            'display:grid',
            `grid-template-columns: ${option.columns.map(o => o.width ? `${o.width}fr` : 'auto').join(" ")}`,
            `gap: ${(option.gap?.[0] ?? 0)}px ${(option.gap?.[1] ?? 0)}px`,
            `line-height: ${this.currentStyle.lineHeight}`,
            `font-family: sans-serif`
        ];
        const styles = option.columns.map(o => {
            const align = o.align ?? this.currentStyle.align;
            const alignStyle = align == TextAlign.center ? 'center' : align == TextAlign.right ? 'right' : 'left';
            return `font-size:${(o.fontSize ?? this.currentStyle.font.size)}px;text-align:${(alignStyle)}`;
        });
        const html = `<div style='${gridStyle.join(';')}'>
        ${data.flatMap(row => row.map((col, ix) => `<div style='${styles[ix]}'>${col}</div>`)).join('')}
</div>`;
        this.printHtml(html);
    }

    public setDefaultStyle(style: TextStyle): void {
        this.defaultStyle = style;
        this.currentStyle = copy({}, style);
    }
    public abstract printImage(data: ArrayBufferLike, width: number, height: number): void;
    public abstract openCashdrawer(): void;
    public abstract printQR(): void;
    public abstract pause(): void;
    public abstract printBarcode(): void;
}