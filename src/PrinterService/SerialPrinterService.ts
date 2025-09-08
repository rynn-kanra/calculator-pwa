import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { ESCPrinterService } from "./ESCPrinterService";
import { IDevice, TextStyle } from "./IPrinterService";

export class SerialPrinterService extends ESCPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
        copy(this.option, {
            serialOption: {
                baudRate: 9600,
                bufferSize: 255,
                dataBits: 8,
                flowControl: "none",
                parity: "none",
                stopBits: 1
            }
        });
    }

    private _connection?: WritableStreamDefaultWriter;

    public async init(id?: string): Promise<void> {
        let serialPort: SerialPort | undefined = undefined;
        if (id) {
            const ports = await navigator.serial.getPorts();
            serialPort = ports.find(o => JSON.stringify(o.getInfo()) == id);
            if (!serialPort) {
                throw new Error("Serial Device not found");
            }
        }
        else {
            serialPort = await navigator.serial.requestPort();
        }
        await serialPort.open(this.option.serialOption!);

        const info = serialPort.getInfo();
        this.device = {
            id: JSON.stringify(info) ?? "serial",
            name: info.product ?? info.vendor ?? info.manufacturer ?? "serial",
            port: serialPort
        };

        if (this.option.sharePrinter) {
            await serialPort.close();
        }
        else {
            this._connection = this.device.port!.writable.getWriter();
        }
    }
    public async connect(): Promise<void> {
        if (!this.device?.port) {
            return;
        }

        if (this._connection) {
            return;
        }

        if (!this.device.port.readable && !this.device.port.writable) {
            await this.device.port.open(this.option.serialOption!);
        }

        this._connection = this.device.port.writable.getWriter();
        this.resetPrinter();
    }
    public async disconnect(): Promise<void> {
        if (!this._connection) {
            return;
        }

        this._connection.releaseLock();
        this._connection = undefined;
        await this.device?.port?.close();
    }
    declare public device?: IDevice & { port?: SerialPort };
    declare public option: PrinterConfig;
    public async execute(command: Uint8Array): Promise<void> {
        await this._connection?.ready;
        await this._connection?.write(command);
    }
    public override async dispose(): Promise<void> {
        await super.dispose();
        this._connection = undefined;
    }
}