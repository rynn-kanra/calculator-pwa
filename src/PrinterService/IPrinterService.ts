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
export type ColumnOption = {
    width?: number;
} & DeepPartial<TextStyle>;
export interface IGridOption {
    columns?: ColumnOption[];
    gap?: [number, number];
}
export type PrintImageData = {
    data: ArrayBuffer;
    width: number;
    height: number;
}

export enum BarcodeType {
    UPC_A = 65,
    UPC_E = 66,
    EAN13 = 67,
    EAN8 = 68,
    CODE39 = 69,
    ITF = 70,
    CODABAR = 71,
    CODE93 = 72,
    CODE128 = 79,
    // CODE128_RAW = 73,
    // GS1_128 = 74,
    // GS1_OMNI = 75,
    // GS1_TRUNCATED = 76,
    // GS1_LIMITED = 77,
    // GS1_EXPANDED = 78,

    // 2D
    PDF417 = 48,
    QRCODE = 49,
    AZTEC = 53,
    DATA_MATRIX = 54,
    // MAXICODE = 50,
    // GS1_DATABAR_2D = 51,
    // GS1_DATABAR_2D_COMPOSITE = 52,
};
export enum BarcodeTextPosition {
    None = 0,
    Above = 1,
    Below = 2,
    Both = 3,
}
export type Barcode1DOption = {
    type: BarcodeType.UPC_A | BarcodeType.UPC_E | BarcodeType.EAN13 | BarcodeType.EAN8 | BarcodeType.CODE39 | BarcodeType.ITF | BarcodeType.CODABAR | BarcodeType.CODE93 | BarcodeType.CODE128;
    height: number;
    width: number; // 2-6, d:3
    textPosition?: BarcodeTextPosition;
    textFont?: number;
};
export type PDF417Option = {
    type: BarcodeType.PDF417;
    column: number; //0-30. d: 0
    row: number; //0,3-90. d:0
    width: number; //2-8. d:3
    height: number; //2-8. d:3
    truncated: boolean;
    correctionLevel: number; // 1-40
};
export type QRCodeOption = {
    type: BarcodeType.QRCODE;
    mode: 49 | 50 | 51;
    size: number; // 1-8
    correctionLevel: 48 | 49 | 50 | 51;
};
export type AztecOption = {
    type: BarcodeType.AZTEC;
    compact: boolean; // full | compact
    layer: number; // 0: auto, 1-32
    size: number; // 2-16, d: 3
    correctionLevel: number; // 5-95. d:23
};
export type DataMatrixOption = {
    type: BarcodeType.DATA_MATRIX;
    column: number; //0-30. d: 0
    row: number; //0,3-90. d:0
    size: number; // 2-16, d: 3
};
export type Barcode2DOption = QRCodeOption | AztecOption | PDF417Option | DataMatrixOption;

export interface IPrinterService {
    option: PrinterConfig;
    device?: IDevice;

    setDefaultStyle(style: TextStyle): void;
    init(id?: string): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    dispose(): Promise<void>;
    reset(): void;
    pause(): void;
    textAlign(align: TextAlign): void;
    cut(isFull?: boolean): void;
    lineFeed(n?: number): void;
    feed(pt?: number): void;
    print(text: string | PromiseLike<string>, style?: DeepPartial<FontStyle>): void;
    printSeparator(separator: string): void;
    printLine(text: string | PromiseLike<string>, style?: DeepPartial<TextStyle>): void;
    printImage(image: PrintImageData | PromiseLike<PrintImageData>): void;
    printHtml(html: string | PromiseLike<string>): void;
    printGrid(data: string[][] | PromiseLike<string[][]>, option?: IGridOption): void;
    openCashdrawer(): void;
    printBarcode(data: string | PromiseLike<string>, option?: DeepPartial<Barcode1DOption | Barcode2DOption>): void;
}