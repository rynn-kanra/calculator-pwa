declare class IminPrinter {
    connected: boolean;
    reconnect: () => Promise<boolean>;
    connect: () => Promise<boolean>;
    close: () => void;
    initPrinter: () => void;
    printAndLineFeed: () => void;
    printAndFeedPaper: (height: number) => void;
    getPrinterStatus: () => Promise<{ value: number }>;
    printText: (str: string, type?: number) => void;
    printColumnsText: (colTextArr: string[], colWidthArr: number[], colAlign: number[], fontSize: number[], width: number) => void;
    setTextSize: (size?: number) => void;
    setTextTypeface: (size?: number) => void;
    setTextStyle: (size?: number) => void;
    setTextWidth: (size?: number) => void;
    setAlignment: (alignment: number) => void;
    partialCut: () => void;
    printSingleBitmap: (data: string) => void;
    openCashBox: () => void;
    ws?: WebSocket;
}

export { IminPrinter as default };