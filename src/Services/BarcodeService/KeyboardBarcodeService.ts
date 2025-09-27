import { parseAIM } from "../../Utility/barcode-parser";
import { copy } from "../../Utility/copy";
import { DeepPartial } from "../../Utility/DeepPartial";
import { defer, DeferPromise } from "../../Utility/defer";
import { BarcodeData, IBarcodeService } from "./IBarcodeService";

type KeyboardBarcodeOption = {
    target: HTMLElement,
    timeout: number
};

type KeyboardBarcodeInternal = KeyboardBarcodeOption & {
    buffer: string,
    first: number,
    last: number,
    defer?: DeferPromise<BarcodeData>;
}

const KEY_MAPPING: Record<string, string> = {
    'Enter': '\n',
    'Tab': '\t',
    'Escape:': '\x1B'
};

export class KeyboardBarcodeService implements IBarcodeService {
    #option: KeyboardBarcodeInternal;
    #isConnected: boolean = false;
    constructor(option?: DeepPartial<KeyboardBarcodeOption>) {
        this.#option = copy<KeyboardBarcodeInternal>(option, {
            target: document.body,
            timeout: 60,
            buffer: "",
            first: 0,
            last: 0,
        });

        this.keydown = this.keydown.bind(this);
    }
    async init(id?: string): Promise<void> {
        this.connect();
    }
    async connect(): Promise<void> {
        if (this.#isConnected) {
            return;
        }

        this.#option.target.addEventListener("keydown", this.keydown as any);
        this.#isConnected = true;
    }
    async disconnect(): Promise<void> {
        if (!this.#isConnected) {
            return;
        }

        this.#option.target.removeEventListener("keydown", this.keydown as any);
        this.#isConnected = false;
        this.#option.defer?.reject("disconnected");
    }
    async dispose(): Promise<void> {
        this.disconnect();
        return;
    }
    async *[Symbol.asyncIterator](): AsyncIterator<BarcodeData, any, any> {
        if (!this.#option.defer) {
            this.#option.defer = defer();
        }

        try {
            while (true) {
                yield await this.#option.defer;
                this.#option.defer = defer();
            }
        }
        catch {
            // barcode disconnect
            this.#option.defer = undefined;
        }
        finally {
            // user cancel or end
        }
    }
    private keydown(e: KeyboardEvent & { currentTarget: HTMLElement, target: HTMLElement }) {
        if (e.target?.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            this.clear();
            return;
        }

        if (e.key === 'Clear' && e.code === 'NumLock') {
            this.clear();
            return;
        }

        if (e.ctrlKey && !this.#option.buffer) {
            this.clear();
            return;
        }

        const now = Date.now();
        const dif = this.#option.first ? now - this.#option.last : 0;
        if (dif > this.#option.timeout) {
            this.clear();
            this.#option.first = 0;
        }

        this.#option.last = now;
        if (!this.#option.first) {
            this.#option.first = this.#option.last;
        }
        else {
            /* Prevent this keydown from reaching the browser */
            e.stopPropagation();
            e.preventDefault();
        }

        let char = e.key;
        if (e.key.length === 1) {
            if (e.ctrlKey) {
                const value = e.key.toUpperCase().charCodeAt(0) - 0x40;
                char = String.fromCharCode(value);
            }
            else if (e.shiftKey) {
                char = char.toLocaleUpperCase();
            }
        }
        else {
            const key = KEY_MAPPING[e.key];
            if (key) {
                char = key
            }
            else {
                return;
            }
        }

        /* Append char to buffer */
        this.#option.buffer += char;

        if (char === "\n") {
            let format: string | undefined = undefined;
            let data = this.#option.buffer.substring(0, this.#option.buffer.length - 1);
            /* remove leading linefeed and tab character */
            while (data.endsWith('\r') || data.endsWith('\t')) {
                data = data.slice(0, -1);
            }

            // detect AIM
            const aimResult = parseAIM(data);
            if (aimResult.aim) {
                data = aimResult.value;
                format = aimResult.aim.format;
            }

            this.#option.defer?.resolve({
                rawValue: this.#option.buffer,
                value: data,
                format: format
            });
            this.clear();
            return;
        }
    }
    private clear() {
        this.#option.buffer = "";
        this.#option.first = this.#option.last = 0;
    }
}