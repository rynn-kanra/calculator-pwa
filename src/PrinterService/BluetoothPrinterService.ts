import { PrinterConfig } from "../Model/PrinterConfig";
import { DeepPartial } from "../Utility/DeepPartial";
import { ESCPrinterService } from "./ESCPrinterService";
import { TextStyle } from "./IPrinterService";

export class BluetoothPrinterService extends ESCPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _connection?: BluetoothRemoteGATTCharacteristic;

    public async init(): Promise<void> {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{
                services: ['000018f0-0000-1000-8000-00805f9b34fb']
            }]
        });
        const server = await device.gatt?.connect();
        const service = await server?.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
        this._connection = await service?.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
        this.device = device;
        if (this.option.sharePrinter) {
            device.gatt?.disconnect();
            this._connection = undefined;
        }
    }
    public async connect(): Promise<void> {
        if (!this.device) {
            return;
        }

        if (this.device.gatt?.connected && this._connection) {
            return;
        }

        const server = await this.device.gatt?.connect();
        const service = await server?.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
        this._connection = await service?.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
        this.resetPrinter();
    }
    public async disconnect(): Promise<void> {
        if (!this._connection) {
            return;
        }

        this.device?.gatt?.disconnect();
        this._connection = undefined;
    }
    declare public device?: BluetoothDevice | undefined;
    declare public option: PrinterConfig;
    public async executeRaw(command: Uint8Array): Promise<void> {
        const delay = 0;
        const chunkSize = this.option.mtu; // 20-512, (232) - 20 for safe value but slower
        if (command.length <= chunkSize) {
            await this._connection?.writeValue(command);
            if (delay) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return;
        }

        let offset = 0;
        do {
            const chunk = command.slice(offset, offset + chunkSize);
            await this._connection?.writeValue(chunk);
            if (delay) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            offset += chunkSize;
        } while (offset < command.length);
    }
    public override async dispose(): Promise<void> {
        await super.dispose();
        this._connection = undefined;
    }
}