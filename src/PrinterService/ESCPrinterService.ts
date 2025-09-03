import { ImagePrintMode, PrinterConfig } from "../Model/PrinterConfig";
import { DeepPartial } from "../Utility/DeepPartial";
import { PrinterServiceBase } from "./PrinterServiceBase";
import { AztecOption, Barcode2DOption, Barcode1DOption, BarcodeTextPosition, BarcodeType, DataMatrixOption, FontMode, FontStyle, PDF417Option, PrintImageData, QRCodeOption, TextAlign, TextStyle } from "./IPrinterService";
import { concat, toUtf8 } from "../Utility/crypto";

const ESC = 0x1B;
const GS = 0x1D;
// DOC: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/commands.html
export abstract class ESCPrinterService extends PrinterServiceBase<Uint8Array> {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    public reset(): void {
        super.reset();
        this.resetPrinter();
        this.textAlign(this.currentStyle.align!);
        this.lineHeight(this.currentStyle.lineHeight!);
        this.fontStyle(this.currentStyle.font!);
    }

    protected resetPrinter(): void {
        // ESC @
        this.enqueue(new Uint8Array([ESC, 0x40]), true);
    }
    public textAlign(align: TextAlign): void {
        // ESC a n
        this.enqueue(new Uint8Array([ESC, 0x61, align]));
        this.currentStyle.align = align;
    }
    public bold(isActive: boolean = true): void {
        // ESC E n
        this.enqueue(new Uint8Array([ESC, 0x45, +isActive]));
        const mode = FontMode.bold;
        if (isActive) {
            this.currentStyle.font!.fontStyle! |= mode;
        }
        else {
            this.currentStyle.font!.fontStyle! &= mode;
        }
    }
    public underline(isActive: boolean = true): void {
        // ESC - n
        this.enqueue(new Uint8Array([ESC, 0x2D, +isActive]));
        const mode = FontMode.underline;
        if (isActive) {
            this.currentStyle.font!.fontStyle! |= mode;
        }
        else {
            this.currentStyle.font!.fontStyle! &= mode;
        }
    }
    public italic(isActive: boolean = true): void {
        // ESC 4 n
        this.enqueue(new Uint8Array([ESC, 0x34, +isActive]));
        const mode = FontMode.italic;
        if (isActive) {
            this.currentStyle.font!.fontStyle! |= mode;
        }
        else {
            this.currentStyle.font!.fontStyle! &= mode;
        }
    }
    public cut(isFull: boolean = true): void {
        // GS V n
        this.enqueue(new Uint8Array([GS, 0x56, +isFull]));
    }
    public lineFeed(n: number = 1): void {
        // ESC d n
        this.enqueue(new Uint8Array([ESC, 0x64, n]));
    }
    public feed(pt: number = 24): void {
        if (this.option.textAsImage) {
            super.feed(pt);
            return;
        }

        // ESC j n
        this.enqueue(new Uint8Array([ESC, 0x6A, pt]));
    }
    public fontFace(faceId: number = 0): void {
        // ESC ! n
        this.enqueue(new Uint8Array([ESC, 0x21, faceId]));
        this.currentStyle.font!.fontFaceType = faceId;
    }
    public fontSize(size: number = 0): void {
        const normalSize = 24;
        let d = size / normalSize;
        let m = 0;
        let t = Math.round(d); // byte = [width][height]. ex hexa: 00 (normal), 11 (2x)
        if ((d - t) >= 0.5) {
            m = 1;
        }
        if (t > 0) {
            t--;
        }
        if (t > 7) {
            t = 7;
        }
        const sizeC = t * (16 + 1) + m;
        // GS ! n
        this.enqueue(new Uint8Array([GS, 0x21, sizeC]));
        this.currentStyle.font!.size = size;
    }
    public lineHeight(size: number): void {
        const ln = Math.ceil(this.currentStyle.font?.size! * size);
        // ESC 3 n
        this.enqueue(new Uint8Array([ESC, 0x33, ln]));
        this.currentStyle.lineHeight = size;
    }
    protected fontStyle(style: DeepPartial<FontStyle>): void {
        if (typeof style.fontFaceType == "number") {
            this.fontFace(style.fontFaceType);
        }
        if (typeof style.size == "number") {
            this.fontSize(style.size);
        }

        if (!style.fontStyle) {
            return;
        }

        this.bold(Boolean(style.fontStyle & FontMode.bold));
        this.italic(Boolean(style.fontStyle & FontMode.italic));
        this.underline(Boolean(style.fontStyle & FontMode.underline));
    }
    public override print(text: string | PromiseLike<string>, fontStyle?: DeepPartial<FontStyle>): void {
        if (this.option.textAsImage) {
            return super.print(text, fontStyle);
        }

        if (fontStyle) {
            this.fontStyle(fontStyle);
        }

        this.enqueue(Promise.resolve(text).then(text => toUtf8(text)));
        if (fontStyle) {
            this.reset();
        }
    }
    public printLine(text: string | PromiseLike<string>, textStyle?: DeepPartial<TextStyle>): void {
        if (this.option.textAsImage) {
            return super.printLine(text, textStyle);
        }

        if (textStyle) {
            if (textStyle.font) {
                this.fontStyle(textStyle.font);
            }
            if (textStyle.align) {
                this.textAlign(textStyle.align);
            }
        }

        this.enqueue(Promise.resolve(text).then(text => toUtf8(`${text}\n`)));
        if (textStyle) {
            this.reset();
        }
    }
    public printSeparator(separator: string): void {
        if (this.option.textAsImage) {
            return super.printSeparator(separator);
        }

        let count = 32; // 32/42-48
        if (this.option.paperWidth > 58) {
            count = 42;
        }

        this.printLine(separator.padStart(count, separator));
    }
    public printImage(data: PrintImageData | Promise<PrintImageData>): void {
        if (!(data instanceof Promise)) {
            data = Promise.resolve(data);
        }

        this.enqueue(data.then(o => {
            switch (this.option.image) {
                case ImagePrintMode.DotMatrix: {
                    return this.dotMatrixImage(new Uint8ClampedArray(o.data), o.width, o.height);
                }
                case ImagePrintMode.RamRastar: {
                    return this.ramRastarImage(new Uint8ClampedArray(o.data), o.width, o.height);
                }
                case ImagePrintMode.Bit: {
                    return this.bitImage(new Uint8ClampedArray(o.data), o.width, o.height);
                }
                case ImagePrintMode.Rastar:
                default: {
                    return this.rastarImage(new Uint8ClampedArray(o.data), o.width, o.height);
                }
            }
        }));
    }
    public openCashdrawer(): void {
        const pin: 0 | 1 | 48 | 49 = 48, on: number = 25, off: number = 200;
        // ESC p m t1 t2
        this.enqueue(new Uint8Array([ESC, 0x70, pin, on, off]));
    }
    public printBarcode(data: string, option?: DeepPartial<PDF417Option>): void;
    public printBarcode(data: string, option?: DeepPartial<QRCodeOption>): void;
    public printBarcode(data: string, option?: DeepPartial<AztecOption>): void;
    public printBarcode(data: string, option?: DeepPartial<DataMatrixOption>): void;
    public printBarcode(data: string, option?: DeepPartial<Barcode1DOption>): void;
    public printBarcode(data: string, option?: DeepPartial<Barcode1DOption | Barcode2DOption>) {
        const type = option?.type ?? BarcodeType.CODE128;
        this.enqueue(Promise.resolve(data).then(data => {
            const bit = toUtf8(data);
            let headers: number[] = [];
            let footers: number[] = [];
            switch (type) {
                case BarcodeType.PDF417: {
                    const setting: PDF417Option = {
                        type: type,
                        column: 0,
                        row: 0,
                        width: 3,
                        height: 3,
                        correctionLevel: 48,
                        truncated: false,
                        ...(option as DeepPartial<PDF417Option>)
                    };
                    const s = bit.length + 3;
                    headers = [
                        // GS ( k 4 0 48 65 n1 n2
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 65, setting.column,
                        // GS ( k 3 0 48 66 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 66, setting.row,
                        // GS ( k 3 0 48 67 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 67, setting.width,
                        // GS ( k 3 0 48 68 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 68, setting.height,
                        // GS ( k 4 0 48 69 m n (m=49, ratio)
                        GS, 0x28, 0x6B, 0x04, 0x00, type, 69, 0x31, setting.correctionLevel,
                        // GS ( k 4 0 48 70 m n (m=49, ratio)
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 70, +setting.truncated,
                        // GS ( k pL pH 48 80 48
                        GS, 0x28, 0x6b, (s & 0xFF), (s >> 8) & 0xFF, type, 80, 0x30,
                    ];

                    footers = [
                        // GS ( k 3 0 48 81 48
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 81, 0x30
                    ];
                    break;
                }
                case BarcodeType.QRCODE: {
                    const setting: QRCodeOption = {
                        type: type,
                        mode: 50,
                        size: 1,
                        correctionLevel: 48,
                        ...(option as DeepPartial<QRCodeOption>)
                    };
                    const s = bit.length + 3;
                    headers = [
                        // GS ( k 4 0 49 65 n1 n2
                        GS, 0x28, 0x6B, 0x04, 0x00, type, 65, setting.mode, 0x00,
                        // GS ( k 3 0 49 67 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 67, setting.size,
                        // GS ( k 3 0 49 69 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 69, setting.correctionLevel,
                        // GS ( k pL pH 49 80 48
                        GS, 0x28, 0x6b, (s & 0xFF), (s >> 8) & 0xFF, type, 80, 0x30,
                    ];

                    footers = [
                        // GS ( k pL pH 49 81 48
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 81, 0x30
                    ];
                    break;
                }
                case BarcodeType.AZTEC: {
                    const setting: AztecOption = {
                        type: type,
                        compact: false,
                        layer: 0,
                        size: 3,
                        correctionLevel: 20,
                        ...(option as DeepPartial<AztecOption>)
                    };
                    const s = bit.length + 3;
                    headers = [
                        // GS ( k 4 0 53 66 n1 n2
                        GS, 0x28, 0x6B, 0x04, 0x00, type, 66, +setting.compact, setting.layer,
                        // GS ( k 3 0 53 67 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 67, setting.size,
                        // GS ( k 3 0 53 69 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 69, setting.correctionLevel,
                        // GS ( k pL pH 53 80 48
                        GS, 0x28, 0x6B, (s & 0xFF), (s >> 8) & 0xFF, type, 80, 0x30,
                    ];

                    footers = [
                        // GS ( k pL pH 53 81 48
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 81, 0x30
                    ];
                    break;
                }
                case BarcodeType.DATA_MATRIX: {
                    const setting: DataMatrixOption = {
                        type: type,
                        column: 0,
                        row: 0,
                        size: 3,
                        ...(option as DeepPartial<DataMatrixOption>)
                    };
                    const s = bit.length + 3;
                    headers = [
                        // GS ( k 5 0 54 66 m d1 d2
                        GS, 0x28, 0x6B, 0x05, 0x00, type, 66, +(setting.column !== setting.row), setting.column, setting.row,
                        // GS ( k 3 0 54 67 n
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 67, setting.size,
                        // GS ( k pL pH 54 80 48
                        GS, 0x28, 0x6B, (s & 0xFF), (s >> 8) & 0xFF, type, 80, 0x30,
                    ];

                    footers = [
                        // GS ( k pL pH 54 81 48
                        GS, 0x28, 0x6B, 0x03, 0x00, type, 81, 0x30
                    ];
                    break;
                }
                case BarcodeType.UPC_A:
                case BarcodeType.UPC_E:
                case BarcodeType.EAN13:
                case BarcodeType.EAN8:
                case BarcodeType.CODE39:
                case BarcodeType.ITF:
                case BarcodeType.CODABAR: {
                    // Barcode Function A more common
                    const setting = {
                        type: type,
                        width: 3,
                        height: 162,
                        ...option
                    } as Barcode1DOption;

                    // 1D Barcode
                    let d: number[] = [];
                    if (setting.textPosition != BarcodeTextPosition.None && typeof setting.textFont === "number") {
                        // GS f n
                        d = [GS, 0x66, setting.textFont];
                    }

                    headers = [
                        // GS H n
                        GS, 0x48, setting.textPosition || 0,
                        // // GS f n
                        ...d,
                        // // GS w n
                        GS, 0x77, setting.width,
                        // // GS h n
                        GS, 0x68, setting.height,
                        // GS k m d1..dn
                        GS, 0x6B, (setting.type - 65)
                    ];
                    footers = [0x00];
                    break;
                }
                default: {
                    // Barcode Function B support more Type
                    const setting = {
                        type: type,
                        width: 3,
                        height: 162,
                        ...option
                    } as Barcode1DOption;

                    // 1D Barcode
                    let d: number[] = [];
                    if (setting.textPosition != BarcodeTextPosition.None && typeof setting.textFont === "number") {
                        // GS f n
                        d = [GS, 0x66, setting.textFont];
                    }

                    headers = [
                        // GS H n
                        GS, 0x48, setting.textPosition || 0,
                        // // GS f n
                        ...d,
                        // // GS w n
                        GS, 0x77, setting.width,
                        // // GS h n
                        GS, 0x68, setting.height,
                        // GS k m n d1..dn
                        GS, 0x6B, setting.type, bit.length
                    ];
                    break;
                }
            }

            return concat(headers, bit, footers);
        }));
    }

    protected rastarImage(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const bytesPerRow = (width + 7) >> 3; // Math.ceil(width/8)
        const bitmap = new Uint8Array(bytesPerRow * height + 8);

        bitmap.set([
            // GS v 0 m (m=0 → normal width and height)
            0x1D, 0x76, 0x30, 0x00,
            // xL, xH
            bytesPerRow & 0xFF, (bytesPerRow >> 8) & 0xFF,
            // yL, yH
            height & 0xFF, (height >> 8) & 0xFF
        ]);

        let i = 0;
        for (let y = 0; y < height; y++) {
            const rowOffset = y * bytesPerRow + 8;
            for (let x = 0; x < width; x++, i += 4) {
                const a = pixels[i + 3];
                if (a < 128) {
                    continue;
                }

                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const luminance = (77 * r + 150 * g + 29 * b) >> 8;
                if (luminance >= 128) {
                    continue;
                }

                bitmap[rowOffset + (x >> 3)] |= (0x80 >> (x & 7));
            }
        }

        return bitmap;
    }
    protected bitImage(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const byteSize = ((height + 23) / 24 | 0) * (width * 3 + 8); // Math.ceil(height / 24) * (width * 3 + 8);
        const bytes = new Uint8Array(byteSize);
        let ix = 0;
        for (let y = 0; y < height; y += 24) {
            // ESC * m nL nH  (m=33 → 24-dot double density)
            bytes[ix++] = 0x1B;
            bytes[ix++] = 0x2A;
            bytes[ix++] = 33;
            bytes[ix++] = width & 0xFF;
            bytes[ix++] = (width >> 8) & 0xFF;

            for (let x = 0; x < width; x++) {
                for (let k = 0; k < 3; k++) { // 3 x 8 = 24 dots
                    let byte = 0;
                    for (let bp = 0; bp < 8; bp++) {
                        const yOffset = y + k * 8 + bp;
                        if (yOffset >= height) {
                            break;
                        }
                        const i = (yOffset * width + x) << 2; // << 2 = bitwise * 4
                        const a = pixels[i + 3];
                        if (a < 128) {
                            continue;
                        }

                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];
                        const luminance = (77 * r + 150 * g + 29 * b) >> 8;
                        if (luminance >= 128) {
                            continue;
                        }

                        byte |= 1 << (7 - bp);
                    }
                    bytes[ix++] = byte;
                }
            }
            // ESC J 24
            bytes[ix++] = 0x1B;
            bytes[ix++] = 0x4A;
            bytes[ix++] = Math.min(24, height - y);
        }

        return bytes;
    }
    // Equal ESC * 1. used by very old printer. no longer used.
    protected dotMatrixImage(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const byteSize = ((height + 7) >> 3) * (width + 6); // Math.ceil(height / 8) * (width + 6)
        const bytes = new Uint8Array(byteSize);

        let ix = 0;
        for (let y = 0; y < height; y += 8) {
            // ESC L nL nH
            bytes[ix++] = 0x1B;
            bytes[ix++] = 0x4C;
            bytes[ix++] = width;
            bytes[ix++] = width;

            const stripHeight = Math.min(8, height - y);
            for (let x = 0; x < width; x++) {
                let byte = 0;
                for (let bp = 0; bp < stripHeight; bp++) {
                    const yOffset = y + bp;
                    const i = (yOffset * width + x) << 2;
                    const a = pixels[i + 3];
                    if (a < 128) {
                        continue;
                    }

                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const luminance = (77 * r + 150 * g + 29 * b) >> 8;
                    if (luminance >= 128) {
                        continue;
                    }

                    byte |= 1 << bp;
                }
                bytes[ix++] = byte;
            }

            // ESC J 8
            bytes[ix++] = 0x1B;
            bytes[ix++] = 0x4A;
            bytes[ix++] = stripHeight;
        }

        return bytes;
    }
    protected ramRastarImage(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const bytesPerRow = (width + 7) >> 3; // Math.ceil(width/8)
        const bitmap = new Uint8Array(bytesPerRow * height);
        const pLength = bitmap.length + 10;

        const headers = [
            // GS 8 L p1 p2 p3 p4
            GS, 0x38, 0x4c, pLength & 0xFF, (pLength >> 8) & 0xFF, (pLength >> 16) & 0xFF, (pLength >> 24) & 0xFF,
            // m fn a bx by c (fn=112 → rastar image, a=48 → monochrome, c=49 → color 1)
            0x30, 0x70, 0x30, 0x01, 0x01, 0x31,
            // xL, xH
            bytesPerRow & 0xFF, (bytesPerRow >> 8) & 0xFF,
            // yL, yH
            height & 0xFF, (height >> 8) & 0xFF
        ];

        let i = 0;
        for (let y = 0; y < height; y++) {
            const rowOffset = y * bytesPerRow;
            for (let x = 0; x < width; x++, i += 4) {
                const a = pixels[i + 3];
                if (a < 128) {
                    continue;
                }

                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const luminance = (77 * r + 150 * g + 29 * b) >> 8;
                if (luminance >= 128) {
                    continue;
                }

                bitmap[rowOffset + (x >> 3)] |= (0x80 >> (x & 7));
            }
        }

        const footer = [
            // GS ( L pL pH m fn (m=48 → rastar image)
            GS, 0x28, 0x4C, 0x02, 0x00, 0x30, 50
        ];

        return concat(headers, bitmap, footer);
    }
}