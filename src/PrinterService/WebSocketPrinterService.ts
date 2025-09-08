import { PrinterConfig } from "../Model/PrinterConfig";
import { DeepPartial } from "../Utility/DeepPartial";
import { ESCPrinterService } from "./ESCPrinterService";
import { IDevice, TextStyle } from "./IPrinterService";

export class WebSocketPrinterService extends ESCPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _connection?: WebSocket;

    public async init(id?: string): Promise<void> {
        if (!id) {
            const ip = prompt("Printer Address", "127.0.0.1");
            let port: string | null = null;
            if (ip) {
                port = prompt("Port", "8081");
            }
            let protocol: string | null = null;
            if (port) {
                protocol = prompt("Protocol (ws/wss)", "ws");
            }
            if (protocol) {
                id = `${protocol}://${ip}:${port}`;
            }
        }

        if (!id) {
            throw new Error("Socket device not found");
        }

        this.device = {
            id: id,
            name: id.substring(0, id.lastIndexOf(":")).replaceAll("/", "")
        };

        const ws = new WebSocket(id);
        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });
        this._connection = ws;

        if (this.option.sharePrinter) {
            this._connection.close();
            this._connection = undefined;
        }
    }
    public async connect(): Promise<void> {
        if (!this.device) {
            return;
        }

        if (this._connection?.readyState == WebSocket.OPEN) {
            return;
        }

        const ws = new WebSocket(this.device.id);
        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });
        this._connection = ws;

        this.resetPrinter();
    }
    public async disconnect(): Promise<void> {
        if (!this._connection) {
            return;
        }

        this._connection.close();
        this._connection = undefined;
    }
    declare public device?: IDevice & { port?: SerialPort };
    public execute(command: Uint8Array): Promise<void> {
        return Promise.resolve(this._connection?.send(command));
    }
    public override async dispose(): Promise<void> {
        await super.dispose();
        this._connection = undefined;
    }
}