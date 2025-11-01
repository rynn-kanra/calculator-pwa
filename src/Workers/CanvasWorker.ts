/// <reference lib="webworker" />
// https://github.com/bwipp/postscriptbarcode/wiki/Options-Reference
import type BwipJs from "@bwip-js/browser";
import {
    upca, upce, ean13, ean8, code39, itf14, rationalizedCodabar, code128,
    pdf417, pdf417compact, qrcode, azteccode, azteccodecompact, datamatrix, datamatrixrectangular,
    drawingCanvas
} from '@bwip-js/browser';
import { TextStyle, TextAlign, FontMode, AztecOption, Barcode1DOption, Barcode2DOption, BarcodeTextPosition, BarcodeType, DataMatrixOption, PDF417Option, QRCodeOption } from "../PrinterService/IPrinterService";
import { DeepPartial } from "../Utility/DeepPartial";
import { expose, proxy, transfer } from "@leoc11/comlink";

type RectBox = {
    x: number,
    y: number,
    width: number,
    height: number
};

// NOTE: bwip-js need this workaround to run in worker
(globalThis as any).HTMLCanvasElement = OffscreenCanvas;

let sharedCanvas: OffscreenCanvas | undefined = undefined;

const silentData = new Uint8Array([128, 0, 0, 0, 128]);
let BarcodeMap: Map<number, (opts: BwipJs.RenderOptions, drawing: BwipJs.DrawingContext<any>) => OffscreenCanvas> | undefined;

class AudioVisual {
    private _ctx: OffscreenCanvasRenderingContext2D;
    constructor(public canvas: OffscreenCanvas) {
        this._ctx = canvas.getContext('2d')!;
    }

    drawSilent() {
        this.draw(silentData);
    }
    draw(dataArray: Uint8Array) {
        if (!this._ctx) return;

        this._ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this._ctx.lineWidth = 1;
        this._ctx.strokeStyle = '#4caf50';
        this._ctx.beginPath();

        const sliceWidth = this.canvas.width / Math.floor((dataArray.length - 1) / 4);
        let x = 0;

        for (let i = 0, len = dataArray.length; i < len; i += 4) {
            const v = dataArray[i] / 128.0;
            const y = v * this.canvas.height / 2;
            if (i === 0) {
                this._ctx.moveTo(x, y);
            } else {
                this._ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        this._ctx.stroke();
    }
}

class PrinterImageGenerator {
    public drawBlank(pt: number, width: number, textStyle: TextStyle) {
        return this.drawCanvas(width, textStyle, (cv, ctx) => {
            const textHeight = pt;
            const lineHeight = textHeight * textStyle.lineHeight;

            ctx.fillStyle = 'white'; // blank = white background
            ctx.fillRect(0, 0, cv.width, lineHeight);
            return lineHeight;
        });;
    }
    public drawSeparator(separator: string, width: number, textStyle: TextStyle) {
        return this.drawCanvas(width, textStyle, (cv, ctx) => {
            const textHeight = textStyle.font.size;
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
    }
    public drawText(text: string, width: number, textStyle: TextStyle) {
        return this.drawCanvas(width, textStyle, (cv, ctx) => {
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
        });
    }
    public async drawBarcode(data: string, option?: DeepPartial<Barcode1DOption | Barcode2DOption>) {
        if (!BarcodeMap) {
            BarcodeMap = new Map([
                [BarcodeType.UPC_A, upca],
                [BarcodeType.UPC_E, upce],
                [BarcodeType.EAN13, ean13],
                [BarcodeType.EAN8, ean8],
                [BarcodeType.CODE39, code39],
                [BarcodeType.ITF, itf14],
                [BarcodeType.CODABAR, rationalizedCodabar],
                [BarcodeType.CODE128, code128],

                [BarcodeType.PDF417, pdf417],
                [BarcodeType.PDF417 + 0.1, pdf417compact],
                [BarcodeType.QRCODE, qrcode],
                [BarcodeType.AZTEC, azteccode],
                [BarcodeType.AZTEC + 0.1, azteccodecompact],
                [BarcodeType.DATA_MATRIX, datamatrix],
                [BarcodeType.DATA_MATRIX + 0.1, datamatrixrectangular],
            ]);
        }
        let canvas = sharedCanvas ?? new OffscreenCanvas(0, 0);
        sharedCanvas = undefined;
        const drawing = drawingCanvas(canvas as any);

        try {
            if (!option) {
                option = {}
            }
            if (!option.type) {
                option.type = BarcodeType.CODE128;
            }

            switch (option.type) {
                case BarcodeType.UPC_A:
                case BarcodeType.UPC_E:
                case BarcodeType.EAN13:
                case BarcodeType.EAN8:
                case BarcodeType.CODE39:
                case BarcodeType.ITF:
                case BarcodeType.CODABAR:
                case BarcodeType.CODE128: {
                    const setting = {
                        type: option.type,
                        width: 3,
                        height: 162,
                        ...option
                    } as Barcode1DOption;

                    const opts: BwipJs.RenderOptions = {
                        bcid: "",
                        text: data,
                        textxalign: "center",
                        width: setting.width,
                        height: Math.round(setting.height * 100 / 203) / 100,
                        includecheck: true,
                        includetext: false,
                    };
                    if ((setting.textPosition ?? 0) !== BarcodeTextPosition.None) {
                        opts.includetext = true;
                        opts.includetext = true;
                        opts.textsize = opts.height;
                        switch (setting.textFont) {
                            case 1: {
                                opts.textfont = "OCR-A";
                                break;
                            }
                            default: {
                                break;
                            }
                        }

                        switch (setting.textPosition) {
                            case BarcodeTextPosition.Above: {
                                opts.textyalign = "above";
                                break;
                            }
                            case BarcodeTextPosition.Below: {
                                opts.textyalign = "below";
                                break;
                            }
                            case BarcodeTextPosition.Both: {
                                opts.textyalign = "below";
                                (opts as any).extratext = opts.text;
                                opts.textsize && ((opts as any).extratextsize = opts.textsize);
                                opts.textfont && ((opts as any).extratextfont = opts.textfont);
                                opts.textxalign && ((opts as any).extratextxalign = opts.textxalign);
                                (opts as any).extratextyalign = "above";
                                break;
                            }
                        }
                    }

                    BarcodeMap.get(setting.type)?.(opts, drawing);
                    break;
                }
                case BarcodeType.PDF417: {
                    const setting: PDF417Option = {
                        type: option.type,
                        column: 0,
                        row: 0,
                        width: 3,
                        height: 3,
                        correctionLevel: 1,
                        truncated: false,
                        ...(option as DeepPartial<PDF417Option>)
                    };

                    const opts = {
                        bcid: "",
                        text: data,
                        columns: setting.column,
                        rows: setting.row,
                        width: setting.width,
                        height: setting.height,
                        eclevel: Math.min(5, setting.correctionLevel >> 3) // map 1-40 => 1-5
                    };
                    BarcodeMap.get(option.type + (0.1 * +setting.truncated))?.(opts, drawing);
                    break;
                }
                case BarcodeType.QRCODE: {
                    const setting: QRCodeOption = {
                        type: option.type,
                        mode: 50,
                        size: 1,
                        correctionLevel: 48,
                        ...(option as DeepPartial<QRCodeOption>)
                    };
                    const opts = {
                        bcid: "",
                        text: data,
                        version: setting.size * 5,
                        eclevel: 'L'
                    };
                    switch (setting.correctionLevel) {
                        case 49: {
                            opts.eclevel = 'M';
                            break;
                        }
                        case 50: {
                            opts.eclevel = 'Q';
                            break;
                        }
                        case 51: {
                            opts.eclevel = 'H';
                            break;
                        }
                    }
                    BarcodeMap.get(option.type)?.(opts, drawing);
                    break;
                }
                case BarcodeType.AZTEC: {
                    const setting: AztecOption = {
                        type: option.type,
                        compact: false,
                        layer: 0,
                        size: 3,
                        correctionLevel: 20,
                        ...(option as DeepPartial<AztecOption>)
                    };
                    const opts = {
                        bcid: "",
                        text: data,
                        layers: setting.layer,
                        width: setting.size,
                        height: setting.size,
                        eclevel: setting.correctionLevel
                    };
                    BarcodeMap.get(setting.type + (0.1 * +setting.compact))?.(opts, drawing);
                    break;
                }
                case BarcodeType.DATA_MATRIX: {
                    const setting: DataMatrixOption = {
                        type: option.type,
                        column: 0,
                        row: 0,
                        size: 3,
                        ...(option as DeepPartial<DataMatrixOption>)
                    };
                    if (setting.row <= 0 || setting.column <= 0) {
                        setting.row = setting.column = Math.max(0, setting.row, setting.column);
                    }
                    const opts = {
                        bcid: "",
                        text: data,
                        columns: setting.column > 0 ? setting.column : undefined,
                        rows: setting.row > 0 ? setting.row : undefined,
                        width: setting.size,
                        height: setting.size,
                    };

                    BarcodeMap.get(option.type + (0.1 * +(setting.row !== setting.column)))?.(opts, drawing);
                    break;
                }
                default: {
                    throw new Error(`Barcode not supported. code: ${option.type}`);
                }
            }

            const imageData = canvas.getContext("2d")!
                .getImageData(0, 0, canvas.width, canvas.height);

            return transfer(imageData, [imageData.data.buffer]);
        }
        finally {
            if (!sharedCanvas) {
                sharedCanvas = canvas;
            }
        }
    }
    protected drawCanvas(width: number, textStyle: TextStyle, draw: (canvas: OffscreenCanvas, ctx: OffscreenCanvasRenderingContext2D) => number): ImageData {
        const canvas = sharedCanvas ?? new OffscreenCanvas(0, 0);
        sharedCanvas = undefined;
        const height = 100;
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

        if (!sharedCanvas) {
            sharedCanvas = canvas;
        }

        return transfer(imageData, [imageData.data.buffer]);
    }
}

export class BarcodeScanner {
    private _detector?: BarcodeDetector;
    constructor(options?: { formats?: string[] }) {
        if (!('BarcodeDetector' in globalThis)) {
            (globalThis as any).BarcodeDetector = function () {
                this.detect = () => [{
                    rawValue: "testing",
                    format: "test"
                }];
            };
        }
        this._detector = new BarcodeDetector(options);
    }
    public async detect(bitmap: ImageBitmapSource, box?: RectBox, visibleAspect?: number) {
        if (!this._detector) {
            return;
        }

        if (box) {
            const blob = await imageProcessor.crop(bitmap, box, visibleAspect);
            bitmap = await createImageBitmap(blob);
        }
        else if (!(bitmap instanceof ImageBitmap)) {
            bitmap = await createImageBitmap(bitmap);
        }

        const result = await this._detector.detect(bitmap);
        return result[0];
    }
}

const imageProcessor = {
    AudioVisual: proxy(AudioVisual),
    image: proxy(new PrinterImageGenerator()),
    BarcodeScanner: proxy(BarcodeScanner),
    async resize(input: Blob, maxSize = 960): Promise<Blob> {
        const img = await createImageBitmap(input)
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1); // only downscale
        if (scale >= 1) {
            return transfer(input, [input]);
        }

        const canvas = sharedCanvas ?? new OffscreenCanvas(0, 0);
        sharedCanvas = undefined;

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = await canvas.convertToBlob({
            type: 'image/webp',
            quality: 0.8
        });

        if (!sharedCanvas) {
            sharedCanvas = canvas;
        }
        return transfer(result, [result]);
    },
    async crop(input: ImageBitmapSource, box: RectBox, visibleAspect?: number): Promise<Blob> {
        const img = input instanceof ImageBitmap ? input : await createImageBitmap(input);
        const canvas = sharedCanvas ?? new OffscreenCanvas(0, 0);
        sharedCanvas = undefined;

        let width = img.width, height = img.height, offsetX = 0, offsetY = 0;
        if (visibleAspect) {
            const videoAspect = img.width / img.height;
            if (visibleAspect > videoAspect) {
                width = img.width;
                height = img.width / visibleAspect;
                offsetY = (img.height - height) / 2;
            }
            else {
                height = img.height;
                width = img.height * visibleAspect;
                offsetX = (img.width - width) / 2;
            }
        }

        // Coordinates in pixels
        const sx = width * box.x + offsetX;
        const sy = height * box.y + offsetY;
        const sw = width * box.width;
        const sh = height * box.height;

        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const result = await canvas.convertToBlob({
            type: 'image/webp'
        });

        if (!sharedCanvas) {
            sharedCanvas = canvas;
        }

        return transfer(result, [result]);
    }
};

export default expose(imageProcessor);