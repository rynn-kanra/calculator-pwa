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

    public async init(): Promise<void> {
        const serialPort = await navigator.serial.requestPort();
        await serialPort.open(this.option.serialOption);

        const info = serialPort.getInfo();
        this.device = {
            id: info.serialNumber ?? info.productId ?? info.usbProductId?.toString() ?? info.vendorId ?? info.usbVendorId?.toString() ?? info.usbProductId?.toString() ?? info.locationId ?? "serial",
            name: info.manufacturer,
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
            await this.device.port.open(this.option.serialOption);
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