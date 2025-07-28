import { PrinterConfig } from "../Model/PrinterConfig";
import { DeepPartial } from "../Utility/DeepPartial";

export enum TextAlign {
    left = 0,
    center = 1,
    right = 2
}
export enum FontMode {
    none = 0,
    bold = 1,
    italic = 2,
    underline = 4
}
export type FontStyle = {
    size: number;
    fontFaceType: number;
    fontStyle: FontMode;
};
export type TextStyle = {
    align: TextAlign;
    lineHeight: number;
    font: FontStyle;
};

export interface IDevice {
    id: string;
    name?: string;
}

export interface IPrinterService {
    option: PrinterConfig;
    device?: IDevice;

    setDefaultStyle(style: TextStyle): void;
    init(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    dispose(): Promise<void>;
    reset(): void;
    pause(): void;
    textAlign(align: TextAlign): void;
    cut(isFull?: boolean): void;
    lineFeed(n?: number): void;
    feed(pt?: number): void;
    print(text: string, style?: DeepPartial<FontStyle>): void;
    printSeparator(separator: string): void;
    printLine(text: string, style?: DeepPartial<TextStyle>): void;
    printImage(data: ArrayBufferLike, width: number, height: number): void;
    openCashdrawer(): void;
    printQR(data: string): void;
    printBarcode(data: string): void;
}