import { PrinterServiceBase } from "./PrinterServiceBase";
import { FontMode, FontStyle, PrintImageData, TextAlign, TextStyle } from "./IPrinterService";
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

const resolvedPromise = Promise.resolve();
// DOC: https://oss-sg.imin.sg/docs/en/JSPrinterSDK.html
export class IminPrinterService extends PrinterServiceBase<() => void> {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _instance: iminPrinter | null = null;
    public execute(command: () => void): Promise<void> {
        command();
        return resolvedPromise;
    }

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

    public reset(): void {
        this._instance?.initPrinter();
    }
    public async dispose(): Promise<void> {
        this._instance = null;
    }
    public textAlign(align: TextAlign): void {
        this.enqueue(() => this._instance?.setAlignment(align));
    }
    public cut(): void {
        this.enqueue(() => this._instance?.partialCut());
    }
    public lineFeed(n: number = 1): void {
        this.enqueue(() => {
            for (let i = 0; i < n; i++) {
                this._instance?.printAndLineFeed();
            }
        });
    }
    public feed(pt: number = 24): void {
        this.enqueue(() => this._instance?.printAndFeedPaper(pt));
    }
    public fontFace(faceId: number = 0): void {
        this.enqueue(() => this._instance?.setTextTypeface(faceId));
    }
    protected fontStyle(style: FontStyle): void {
        if (typeof style.fontFaceType == "number") {
            this.fontFace(style.fontFaceType);
        }
        if (typeof style.size == "number") {
            this.fontFace(style.size);
        }

        if (!style.fontStyle) {
            return;
        }

        if (style.fontStyle & (FontMode.bold & FontMode.italic)) {
            this.enqueue(() => this._instance?.setTextStyle(3));
        }
        else if (style.fontStyle & FontMode.italic) {
            this.enqueue(() => this._instance?.setTextStyle(2));
        }
        else if (style.fontStyle & FontMode.bold) {
            this.enqueue(() => this._instance?.setTextStyle(1));
        }
        else {
            this.enqueue(() => this._instance?.setTextStyle(0));
        }
    }
    public print(text: string | PromiseLike<string>, fontStyle?: FontStyle): void {
        if (this.option.textAsImage) {
            return super.print(text, fontStyle);
        }

        if (fontStyle) {
            this.fontStyle(fontStyle);
        }

        const p = Promise.resolve(text).then(text => (() => this._instance?.printText(text)))
        this.enqueue(p);

        if (fontStyle) {
            this.reset();
        }
    }
    public printLine(text: string | PromiseLike<string>, textStyle?: TextStyle): void {
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

        const p = Promise.resolve(text).then(text => (() => this._instance?.printText(text)))
        this.enqueue(p);

        if (textStyle) {
            this.reset();
        }
    }
    public printImage(image: PrintImageData | PromiseLike<PrintImageData>) {
        const p = Promise.resolve(image).then(image => {
            const binary = new Uint8Array(image.data).reduce((c, byte) => c + String.fromCharCode(byte), '');
            const base64 = btoa(binary);
            const dataUri = `data:image/png;base64,${base64}`;
            return () => this._instance?.printSingleBitmap(dataUri);
        });
        this.enqueue(p);
    }
    public openCashdrawer(): void {
        this._instance?.openCashBox();
    }
    public printBarcode(): void { }
    public pause(): void { }
}