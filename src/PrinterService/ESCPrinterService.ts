import { PrinterConfig } from "../Model/PrinterConfig";
import { DeepPartial } from "../Utility/DeepPartial";
import { PrinterServiceBase } from "./PrinterServiceBase";
import { FontMode, FontStyle, PrintImageData, TextAlign, TextStyle } from "./IPrinterService";

const ESC = '\x1B';
const GS = '\x1D';

const encoder = new TextEncoder();

// DOC: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/commands.html
export abstract class ESCPrinterService extends PrinterServiceBase<Uint8Array> {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    public addCommand(command: string | PromiseLike<string>, isTop: boolean = false): void {
        this.enqueue(Promise.resolve(command).then(command => encoder.encode(command)), isTop);
    }
    public reset(): void {
        super.reset();
        this.resetPrinter();
        this.textAlign(this.currentStyle.align!);
        this.lineHeight(this.currentStyle.lineHeight!);
        this.fontStyle(this.currentStyle.font!);
    }

    protected resetPrinter(): void {
        this.addCommand(`${ESC}@`, true);
    }
    public textAlign(align: TextAlign): void {
        this.addCommand(`${ESC}a` + String.fromCharCode(align));
        this.currentStyle.align = align;
    }
    public bold(isActive: boolean = true): void {
        this.addCommand(`${ESC}E` + String.fromCharCode(isActive ? 1 : 0));
        const mode = FontMode.bold;
        if (isActive) {
            this.currentStyle.font!.fontStyle! |= mode;
        }
        else {
            this.currentStyle.font!.fontStyle! &= mode;
        }
    }
    public underline(isActive: boolean = true): void {
        this.addCommand(`${ESC}-` + String.fromCharCode(isActive ? 1 : 0));
        const mode = FontMode.underline;
        if (isActive) {
            this.currentStyle.font!.fontStyle! |= mode;
        }
        else {
            this.currentStyle.font!.fontStyle! &= mode;
        }
    }
    public italic(isActive: boolean = true): void {
        this.addCommand(`${ESC}4` + String.fromCharCode(isActive ? 1 : 0));
        const mode = FontMode.italic;
        if (isActive) {
            this.currentStyle.font!.fontStyle! |= mode;
        }
        else {
            this.currentStyle.font!.fontStyle! &= mode;
        }
    }
    public cut(isFull: boolean = true): void {
        this.addCommand(`${GS}V` + String.fromCharCode(isFull ? 1 : 0));
    }
    public lineFeed(n: number = 1): void {
        this.addCommand(`${ESC}d` + String.fromCharCode(n));
    }
    public feed(pt: number = 24): void {
        if (this.option.textAsImage) {
            super.feed(pt);
            return;
        }
        
        this.addCommand(`${ESC}j` + String.fromCharCode(pt));
    }
    public fontFace(faceId: number = 0): void {
        this.addCommand(`${ESC}!` + String.fromCharCode(faceId));
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
        this.addCommand(`${GS}!${String.fromCharCode(sizeC)}`);
        this.currentStyle.font!.size = size;
    }
    public lineHeight(size: number): void {
        const ln = Math.ceil(this.currentStyle.font?.size! * size);
        this.addCommand(`${ESC}3${String.fromCharCode(ln)}`);
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
        this.addCommand(text);
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

        this.addCommand(`${text}\n`);

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

        this.enqueue(data.then(o => this.option.image === "bit"
            ? this.bitImage(new Uint8ClampedArray(o.data), o.width, o.height)
            : this.rastarImage(new Uint8ClampedArray(o.data), o.width, o.height)));
    }
    public openCashdrawer(): void {
        const pin: 0 | 1 | 48 | 49 = 48, on: number = 25, off: number = 200;
        this.addCommand(`${ESC}p${String.fromCharCode(pin)}${String.fromCharCode(on)}${String.fromCharCode(off)}`);
    }
    public printQR(): void {
        this.addCommand(``);
    }
    public printBarcode(): void {
        this.addCommand(``);
    }

    protected rastarImage(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const bytesPerRow = Math.ceil(width / 8);
        const bitmap = new Uint8Array(bytesPerRow * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                const luminance = (r + g + b) / 3;
                const black = a > 128 && luminance < 127;
                if (black) bitmap[y * bytesPerRow + (x >> 3)] |= (0x80 >> (x % 8));
            }
        }

        const header = new Uint8Array([
            0x1D, 0x76, 0x30, 0x00,
            bytesPerRow & 0xFF,
            (bytesPerRow >> 8) & 0xFF,
            height & 0xFF,
            (height >> 8) & 0xFF
        ]);

        const full = new Uint8Array(header.length + bitmap.length);
        full.set(header);
        full.set(bitmap, header.length);
        return full;
    }
    protected bitImage(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const bytes = [];
        bytes.push(
            0x1B, 0x33, 0  // ESC 3 24 - Set line spacing to 24 dots
        );

        for (let y = 0; y < height; y += 24) {
            bytes.push(0x1B, 0x2A, 33, width & 0xFF, (width >> 8) & 0xFF);

            for (let x = 0; x < width; x++) {
                for (let k = 0; k < 3; k++) { // 3 x 8 = 24 dots
                    let byte = 0;
                    for (let bp = 0; bp < 8; bp++) {
                        const yOffset = y + k * 8 + bp;
                        if (yOffset >= height) continue;
                        const i = (yOffset * width + x) * 4;
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];
                        const a = pixels[i + 3];
                        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                        const black = a > 128 && luminance < 127;
                        byte |= (black ? 1 : 0) << (7 - bp);
                    }
                    bytes.push(byte);
                }
            }
            bytes.push(0x0A); // Line feed
        }

        bytes.push(
            0x1B, 0x33, Math.ceil(this.currentStyle.font?.size! * this.currentStyle.lineHeight!)  // ESC 3 24 - Set line spacing to 30 dots
        );

        return new Uint8Array(bytes);
    }
}