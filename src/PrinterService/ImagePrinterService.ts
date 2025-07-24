import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { FontMode, FontStyle, IDevice, IPrinterService, TextAlign, TextStyle } from "./IPrinterService";

export abstract class ImagePrinterService implements IPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        if (!option) {
            option = {}
        }
        this.option = Object.assign(new PrinterConfig(), option);

        if (!style) {
            style = {};
        }
        style = {
            align: TextAlign.left,
            lineHeight: 1.2,
            ...style,
            font: {
                fontFaceType: 0,
                fontStyle: FontMode.none,
                size: 24,
                ...style.font
            }
        };
        this.defaultStyle = style as TextStyle;
        this.currentStyle = { ...style, font: { ...style.font } } as TextStyle;
    }

    public device?: IDevice;
    public abstract init(): Promise<void>;
    public abstract connect(): Promise<void>;
    public abstract disconnect(): Promise<void>;
    public abstract dispose(): Promise<void>;

    protected currentStyle: TextStyle;
    protected defaultStyle: TextStyle;
    private _canvas: HTMLCanvasElement | null = null;
    public option: PrinterConfig;

    public print(text: string, fontStyle?: DeepPartial<FontStyle>): void {
        const textStyle = fontStyle ? { align: this.currentStyle.align, lineHeight: this.currentStyle.lineHeight, font: fontStyle } : undefined;
        this.printLine(text, textStyle);
    }
    public printLine(text: string, textStyle?: DeepPartial<TextStyle>): void {
        let imageData: ImageData;
        this.drawCanvas((cv, ctx, textStyle) => {
            const lines = [];
            let line = '';
            for (let i = 0; i < text.length; i++) {
                const testLine = line + text[i];
                const width = ctx.measureText(testLine).width;

                if (width > cv.width && line !== '') {
                    lines.push(line);
                    line = text[i];
                } else {
                    line = testLine;
                }
            }
            if (line) {
                lines.push(line);
            }

            const lineHeight = Math.ceil(textStyle.font?.size! * textStyle.lineHeight!);
            const height = (lines.length * lineHeight);
            const x = textStyle.align === TextAlign.right
                ? cv.width
                : textStyle.align == TextAlign.center
                    ? cv.width / 2
                    : 0;

            for (let i = 0; i < lines.length; i++) {
                const y = (i * lineHeight) + Math.floor(textStyle.font!.size! * (textStyle.lineHeight! - 1) / 2);
                const text = lines[i];
                ctx.fillText(text, x, y);
                if (textStyle.font!.fontStyle! & FontMode.underline) {
                    const textWidth = ctx.measureText(text).width;
                    const y2 = y + (textStyle.font!.size! * (1 - Math.abs(textStyle.lineHeight! - 1) / 2));
                    ctx.beginPath();
                    ctx.moveTo(x, y2);
                    ctx.lineTo(x + textWidth, y2);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.stroke();
                }
            }

            imageData = ctx.getImageData(0, 0, cv.width, height);
        }, textStyle);

        this.printImage(imageData!.data.buffer, imageData!.width, imageData!.height);
    }
    public printSeparator(separator: string): void {
        let imageData: ImageData;
        this.drawCanvas((cv, ctx, textStyle) => {
            const count = Math.ceil(cv.width / ctx.measureText(separator).width);
            const x = textStyle.align === TextAlign.right
                ? cv.width
                : textStyle.align == TextAlign.center
                    ? cv.width / 2
                    : 0;
            const lineHeight = textStyle.font!.size! * textStyle.lineHeight!;
            const text = separator.repeat(count);
            ctx.fillText(text, x, 0);
            imageData = ctx.getImageData(0, 0, cv.width, lineHeight);
        });

        this.printImage(imageData!.data.buffer, imageData!.width, imageData!.height);
    }

    public reset(): void {
        this.currentStyle = { ...this.defaultStyle, font: { ...this.defaultStyle.font } };
    }
    public abstract textAlign(align: TextAlign): void;
    public abstract cut(isFull?: boolean): void;
    public abstract lineFeed(n?: number): void;
    public feed(pt: number = 24): void {
        let imageData: ImageData;
        this.drawCanvas((cv, ctx) => {
            ctx.fillStyle = 'white'; // blank = white background
            ctx.fillRect(0, 0, cv.width, pt);
            imageData = ctx.getImageData(0, 0, cv.width, pt);
        });

        this.printImage(imageData!.data.buffer, imageData!.width, imageData!.height);
    }

    protected drawCanvas(draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, textStyle: TextStyle) => void, textStyle?: DeepPartial<TextStyle>) {
        let canvas = this._canvas;
        this._canvas = null;
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
        else {
            textStyle = copy(textStyle, this.currentStyle);
        }

        canvas.width = this.option.width;
        canvas.height = 100;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'black';
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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        draw(canvas, ctx, textStyle as TextStyle);

        this._canvas = canvas;
    }


    public setDefaultStyle(style: TextStyle): void {
        this.defaultStyle = style;
        this.currentStyle = { ...style, font: { ...style.font } } as TextStyle;
    }
    public abstract printImage(data: ArrayBufferLike, width: number, height: number): void;
    public abstract openCashdrawer(): void;
    public abstract printQR(): void;
    public abstract printBarcode(): void;
}