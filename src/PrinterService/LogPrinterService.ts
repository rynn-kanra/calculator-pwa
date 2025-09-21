import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { PrinterServiceBase } from "./PrinterServiceBase";
import { IGridOption, PrintImageData, TextAlign, TextStyle } from "./IPrinterService";

type MessageLog = {
    message: string,
    params?: any[]
};

const resolvedPromise = Promise.resolve();
export class LogPrinterService extends PrinterServiceBase<MessageLog> {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _imageCanvas?: HTMLCanvasElement;
    private _tempCanvas?: HTMLCanvasElement;

    public execute(command: MessageLog): Promise<void> {
        console.log(command.message, ...(command.params || []));
        return resolvedPromise;
    }

    public init(): Promise<void> {
        this.device = { id: "console", name: "CONSOLE" };
        return resolvedPromise;
    }
    public connect(): Promise<void> {
        return resolvedPromise;
    }
    public disconnect(): Promise<void> {
        return resolvedPromise;
    }
    public dispose(): Promise<void> {
        return resolvedPromise;
    }

    public printLine(text: string | PromiseLike<string>, textStyle?: DeepPartial<TextStyle>): void {
        if (this.option.textAsImage) {
            return super.printLine(text, textStyle);
        }

        textStyle = copy(textStyle, this.currentStyle);
        const p = Promise.resolve(text).then<MessageLog>(text => {
            switch (textStyle?.align) {
                case TextAlign.right: {
                    text = text.padStart(this.option.charPerLine);
                    break;
                }
                case TextAlign.center: {
                    text = ' '.repeat((this.option.charPerLine - text.length) / 2) + text;
                    break;
                }
            }

            return {
                message: text
            };
        });
        this.enqueue(p);
    }
    public printSeparator(separator: string): void {
        if (this.option.textAsImage) {
            return super.printSeparator(separator);
        }

        this.enqueue({
            message: separator.padStart(this.option.charPerLine, separator)
        });
    }

    public textAlign(align: TextAlign): void { }
    public cut(isFull?: boolean): void {
        this.enqueue({
            message: 'cut'
        });
    }
    public lineFeed(n: number = 1): void {
        for (let i = 0, len = n || 1; i < len; i++) {
            this.enqueue({
                message: ''
            });
        }
    }
    public feed(pt: number = 24): void {
        if (this.option.textAsImage) {
            return super.feed(pt);
        }

        this.lineFeed(Math.ceil(pt / 24));
    }

    public printImage(image: PrintImageData | PromiseLike<PrintImageData>): void {
        if (!this._imageCanvas) {
            this._imageCanvas = document.createElement('canvas');
        }
        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
        }

        const p = Promise.resolve(image).then<MessageLog>(image => {
            this._imageCanvas!.width = image.width;
            this._imageCanvas!.height = image.height;
            const ctx = this._imageCanvas!.getContext('2d')!;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, image.width, image.height);

            this._tempCanvas!.width = image.width;
            this._tempCanvas!.height = image.height;
            const tempCtx = this._tempCanvas!.getContext('2d')!;
            tempCtx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
            ctx.drawImage(this._tempCanvas!, 0, 0);

            const dataUrl = this._imageCanvas!.toDataURL();
            const style = [
                'font-size: 1px;',
                `background: url(${dataUrl}) no-repeat;`,
                'background-size: contain;',
                `padding: ${image.height}px ${image.width}px;`, // height:width
                'line-height: 0;',
            ].join(' ');

            return {
                message: '%c ',
                params: [style]
            };
        });

        this.enqueue(p);
    }
    public printGrid(data: string[][] | PromiseLike<string[][]>, option?: IGridOption): void {
        if (this.option.textAsImage) {
            return super.printGrid(data, option);
        }

        const commandPromise = Promise.resolve(data).then(data => {
            const charWidth = 1;
            if (!option) {
                option = {};
            }
            if (!Array.isArray(option.columns)) {
                option.columns = [];
            }

            const columns = Array.from(option.columns);
            const columnDefined = columns.length > 0;
            while (columns.length < data[0].length) {
                columns.push({ width: +columnDefined });
            }
            const totalGaps = (data[0].length - 1) * (option.gap?.[1] ?? 0);
            let availableWidth = this.option.charPerLine - totalGaps;
            let autoWidths: number[] = [];
            let partCount = columns.reduce((res, column, ix) => {
                if (!column.width) {
                    autoWidths.push(data.reduce((r, c) => Math.max(r, c?.[ix]?.length), 0));
                }
                return res + (column.width ?? 1);
            }, 0);
            const maxAutoWidth = Math.floor(availableWidth / partCount);
            autoWidths = autoWidths.map(o => Math.min(o, maxAutoWidth));
            partCount -= autoWidths.length;
            availableWidth -= autoWidths.reduce((a, b) => a + b, 0);
            const resolvedWidths = columns.map((o, i) => {
                const fontSize = 1;
                let curWidth = 0;
                if (i === columns.length - 1) {
                    curWidth = o.width ? availableWidth : availableWidth + autoWidths.shift()!;
                }
                else {
                    curWidth = o.width ? Math.floor(availableWidth * o.width / partCount) : autoWidths.shift()!;
                }
                const rw = Math.floor(curWidth / fontSize);
                availableWidth -= rw * fontSize;
                return rw;
            });
            const colGap = " ".repeat((option.gap?.[1] ?? 0) / charWidth);
            let ix = 0;
            const rowGap = option.gap?.[0];
            let rowCount = data.length;
            let message = "";
            while (ix < rowCount) {
                rowGap && ix && (message += "\n".repeat(Math.floor(rowGap / 24) - 1));
                const row = data[ix++];
                let hasNextItem = true;
                let warpCount = 0;
                while (hasNextItem) {
                    hasNextItem = false;
                    for (let i = 0, len = columns.length; i < len; i++) {
                        const width = resolvedWidths[i];
                        if (colGap && i > 0) {
                            message += colGap;
                        }
                        if (!hasNextItem) {
                            hasNextItem = (row[i] ?? "").length > (warpCount + 1) * width;
                        }
                        let text = (row[i] ?? "").substring(warpCount * width, width);
                        switch (columns[i].align ?? this.currentStyle.align) {
                            case TextAlign.right: {
                                text = text.padStart(width, ' ');
                                break;
                            }
                            case TextAlign.center: {
                                text = text.padStart(Math.floor(width / 2), ' ').padEnd(Math.ceil(width / 2), ' ');
                                break;
                            }
                            default: {
                                text = text.padEnd(width, ' ');
                                break;
                            }
                        }
                        message += text;
                    }
                    message += '\n';
                    warpCount++;
                }
            }

            return {
                message
            };
        });

        this.enqueue(commandPromise);
    }
    public openCashdrawer(): void { }
    public pause(): void { }
}