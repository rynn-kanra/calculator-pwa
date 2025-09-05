import { PrinterConfig } from "../Model/PrinterConfig";
import { copy } from "../Utility/copy";
import { DeepPartial } from "../Utility/DeepPartial";
import { ESCPrinterService } from "./ESCPrinterService";
import { TextStyle } from "./IPrinterService";

type DeviceProfile = {
    service: BluetoothServiceUUID;
    namePrefix?: string,
    characteristics: {
        print: BluetoothCharacteristicUUID;
        status?: BluetoothCharacteristicUUID;
    }
}

const DEFAULT_PROFILE: DeviceProfile = {
    service: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristics: {
        print: '00002af1-0000-1000-8000-00805f9b34fb',
        status: '00002af0-0000-1000-8000-00805f9b34fb'
    }
};
const DEVICE_PROFILES: DeviceProfile[] = [
    /* Epson TM-P series, for example the TM-P20II */
    {
        service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        namePrefix: 'TM-P',
        characteristics: {
            print: '49535343-8841-43f4-a8d4-ecbe34729bb3',
            status: '49535343-1e4d-4bd9-ba61-23c647249616'
        }
    },

    /* Star SM-L series, for example the SM-L200 */
    {
        service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        namePrefix: 'STAR L',
        characteristics: {
            print: '49535343-8841-43f4-a8d4-ecbe34729bb3',
            status: '49535343-1e4d-4bd9-ba61-23c647249616'
        }
    },

    /* Generic printer */
    DEFAULT_PROFILE
];

export class BluetoothPrinterService extends ESCPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
        copy(this.option, {
            bluetoothOption: {
                mtu: 50
            }
        });
    }

    private _profile?: DeviceProfile;
    private _connection?: BluetoothRemoteGATTCharacteristic;

    public async init(id?: string): Promise<void> {
        let device: BluetoothDevice | undefined = undefined;
        if (id) {
            const devices = await navigator.bluetooth.getDevices();
            device = devices.find(o => o.id == id);
            if (!device) {
                throw new Error("Bluetooth Device not found");
            }
        }
        else {
            device = await navigator.bluetooth.requestDevice({
                filters: DEVICE_PROFILES.map(o => ({
                    services: [o.service],
                }))
            });
        }

        device.addEventListener("gattserverdisconnected", (e) => {
            this._connection = undefined;
        });

        const server = await device.gatt?.connect()!;
        const serviceIds = await server.getPrimaryServices().then(o => o.map(p => p.uuid as BluetoothServiceUUID));
        this._profile = DEVICE_PROFILES.find(o => {
            let found = serviceIds.includes(o.service);
            if (found && o.namePrefix) {
                found = device!.name?.startsWith(o.namePrefix) ?? false;
            }

            return found;
        }) ?? DEFAULT_PROFILE;
        const service = await server?.getPrimaryService(this._profile.service);
        this._connection = await service?.getCharacteristic(this._profile.characteristics.print);
        this.device = device;
        if (this.option.sharePrinter) {
            device.gatt?.disconnect();
            this._connection = undefined;
        }
    }
    public async connect(): Promise<void> {
        if (!this.device || !this._profile) {
            return;
        }

        if (this.device.gatt?.connected && this._connection) {
            return;
        }

        const server = await this.device.gatt?.connect();
        const service = await server?.getPrimaryService(this._profile.service);
        this._connection = await service?.getCharacteristic(this._profile.characteristics.print);
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
    public async execute(command: Uint8Array<ArrayBuffer>): Promise<void> {
        const chunkSize = this.option.bluetoothOption!.mtu;
        if (command.length <= chunkSize) {
            await this._connection?.writeValue(command);
            if (this.option.bluetoothOption?.delayTime) {
                await new Promise(resolve => setTimeout(resolve, this.option.bluetoothOption!.delayTime));
            }
            return;
        }

        let offset = 0;
        do {
            const chunk = command.slice(offset, offset + chunkSize);
            await this._connection?.writeValue(chunk);
            if (this.option.bluetoothOption?.delayTime) {
                await new Promise(resolve => setTimeout(resolve, this.option.bluetoothOption!.delayTime));
            }

            offset += chunkSize;
        } while (offset < command.length);
    }
    public override async dispose(): Promise<void> {
        await super.dispose();
        this._connection = undefined;
    }
}