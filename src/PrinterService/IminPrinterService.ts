import { ImagePrinterService } from "./ImagePrinterService";
import { FontMode, FontStyle, TextAlign, TextStyle } from "./IPrinterService";
import IminPrinter from "../lib/imin-printer.esm.browser";
import { DeepPartial } from "../Utility/DeepPartial";
import { PrinterConfig } from "../Model/PrinterConfig";

type iminPrinter = {
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
} | null;

// DOC: https://oss-sg.imin.sg/docs/en/JSPrinterSDK.html
export class IminPrinterService extends ImagePrinterService {
    constructor(option: DeepPartial<PrinterConfig>, style?: TextStyle) {
        super(option, style);
    }

    private _instance: iminPrinter | null = null;
    public async init(): Promise<void> {
        if (!this._instance) {
            this._instance = new IminPrinter();
            this.device = {
                id: "imin",
                name: "iMin InnerPrinter"
            };
        }
    }

    public async connect(): Promise<void> {
        if (!this._instance) {
            this._instance = new IminPrinter();
        }

        if (this._instance!.connected) {
            return;
        }

        const isConnectedPromise = this._instance!.connect();
        if (this._instance?.ws) {
            const onOpen = this._instance.ws.onopen!;
            this._instance.ws.onclose = this._instance.ws.onerror = (event) => {
                this._instance!.connected = false;
                console.log(event);
            };
            this._instance.ws.onopen = (ev) => {
                onOpen.call(this._instance!.ws!, ev);
                this._instance!.connected = true;
                this._instance!.ws!.onerror = () => {
                    this._instance!.connected = false;
                    this.connect();
                };
            };
        }

        const isConnected = await isConnectedPromise;
        if (isConnected) {
            throw new Error("not connected");
        }

        this._instance?.initPrinter();
        const status = await this._instance!.getPrinterStatus();
        if (status.value === 0) {
            await this.reset();
        }
    }

    public async disconnect(): Promise<void> {
        if (!this._instance) {
            return;
        }

        this._instance.close();
    }

    public async reset(): Promise<void> {
        this._instance?.initPrinter();
    }
    public async dispose(): Promise<void> {
        this._instance = null;    
    }
    public async textAlign(align: TextAlign): Promise<void> {
        this._instance?.setAlignment(align);
    }
    public async cut(): Promise<void> {
        this._instance?.partialCut();
    }
    public async lineFeed(n: number = 1): Promise<void> {
        for (let i = 0; i < n; i++) {
            this._instance?.printAndLineFeed();
        }
    }
    public async feed(pt: number = 24): Promise<void> {
        this._instance?.printAndFeedPaper(pt);
    }
    public async fontFace(faceId: number = 0): Promise<void> {
        this._instance?.setTextTypeface(faceId);
    }
    protected async fontStyle(style: FontStyle): Promise<void> {
        if (typeof style.fontFaceType == "number") {
            await this.fontFace(style.fontFaceType);
        }
        if (typeof style.size == "number") {
            await this.fontFace(style.size);
        }

        if (!style.fontStyle) {
            return;
        }

        if (style.fontStyle & (FontMode.bold & FontMode.italic)) {
            this._instance?.setTextStyle(3);
        }
        else {
            if (style.fontStyle & FontMode.italic) {
                this._instance?.setTextStyle(2);
            }
            if (style.fontStyle & FontMode.bold) {
                this._instance?.setTextStyle(1);
            }
            else {
                this._instance?.setTextStyle(0);
            }
        }
    }
    public async print(text: string, fontStyle?: FontStyle): Promise<void> {
        if (this.option.textAsImage) {
            return await super.print(text, fontStyle);
        }

        if (fontStyle) {
            await this.fontStyle(fontStyle);
        }
        this._instance?.printText(text);
        if (fontStyle) {
            await this.reset();
        }
    }
    public async printLine(text: string, textStyle?: TextStyle): Promise<void> {
        if (this.option.textAsImage) {
            return await super.printLine(text, textStyle);
        }

        if (textStyle) {
            if (textStyle.font) {
                await this.fontStyle(textStyle.font);
            }
            if (textStyle.align) {
                await this.textAlign(textStyle.align);
            }
        }

        this._instance?.printText(text);

        if (textStyle) {
            await this.reset();
        }
    }
    public async printImage(data: ArrayBufferLike, width: number, height: number): Promise<void> {
        const binary = new Uint8Array(data).reduce((c, byte) => c + String.fromCharCode(byte), '');
        const base64 = btoa(binary);
        const dataUri = `data:image/png;base64,${base64}`;
        this._instance?.printSingleBitmap(dataUri);
    }
    public async openCashdrawer(): Promise<void> {
        this._instance?.openCashBox();
    }
    public async printQR(): Promise<void> { }
    public async printBarcode(): Promise<void> { }
}