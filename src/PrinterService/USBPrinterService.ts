import { PrinterConfig } from "../Model/PrinterConfig";
import { DeepPartial } from "../Utility/DeepPartial";
import { ESCPrinterService } from "./ESCPrinterService";
import { IDevice, TextStyle } from "./IPrinterService";

type DeviceProfile = {
    vendorId: number,
    productId?: number,
    configuration: number,
    interface: number
};
const DEFAULT_PROFILE: DeviceProfile = {
    vendorId: 0x04B8, // EPSON
    configuration: 1,
    interface: 0
};
const DEVICE_PROFILES: DeviceProfile[] = [
    // Caysn
    {
        vendorId: 0x4B43,
        productId: 0x3830,
        configuration: 1,
        interface: 0
    },

    /* POS-8022 and similar printers */
    {
        vendorId: 0x0483,
        productId: 0x5743,
        configuration: 1,
        interface: 0
    },

    /* POS-5805, POS-8360 and similar printers */
    {
        vendorId: 0x0416,
        productId: 0x5011,
        configuration: 1,
        interface: 0
    },

    /* MPT-II and similar printers */
    {
        vendorId: 0x0483,
        productId: 0x5840,
        configuration: 1,
        interface: 0
    },

    /* Samsung SRP */
    {
        vendorId: 0x0419,
        configuration: 1,
        interface: 0
    },
    {
        vendorId: 0x1504,
        configuration: 1,
        interface: 0
    },

    /* Star */
    {
        vendorId: 0x0519,
        configuration: 1,
        interface: 0
    },

    /* Citizen */
    {
        vendorId: 0x1d90,
        configuration: 1,
        interface: 0
    },

    /* HP */
    {
        vendorId: 0x05d9,
        configuration: 1,
        interface: 0
    },

    /* Fujitsu */

    {
        vendorId: 0x04c5,
        configuration: 1,
        interface: 0
    },

    /* Dtronic */
    {
        vendorId: 0x0fe6,
        productId: 0x811e,
        configuration: 1,
        interface: 0
    },

    /* Xprinter */
    {
        vendorId: 0x1fc9,
        productId: 0x2016,
        configuration: 1,
        interface: 0
    },
    DEFAULT_PROFILE
];

function getDeviceId(device: USBDevice) {
    return JSON.stringify({
        sn: device.serialNumber,
        v: device.vendorId,
        p: device.productId
    });
}
export class USBPrinterService extends ESCPrinterService {
    constructor(option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) {
        super(option, style);
    }

    private _profile?: DeviceProfile;
    private _connection?: USBEndpoint;

    public async init(id?: string): Promise<void> {
        let device: USBDevice | undefined = undefined;
        if (id) {
            const devices = await navigator.usb.getDevices();
            device = devices.find(o => getDeviceId(o) == id);
            if (!device) {
                throw new Error("USB Device not found");
            }
        }
        else {
            const filters = DEVICE_PROFILES.map(o => ({
                vendorId: o.vendorId,
                productId: o.productId
            }));
            if (this.option.usbOption?.vendorId) {
                filters.push({
                    vendorId: parseInt(this.option.usbOption?.vendorId, 16),
                    productId: undefined
                });
            }

            device = await navigator.usb.requestDevice({
                filters: DEVICE_PROFILES.map(o => ({
                    vendorId: o.vendorId,
                    productId: o.productId
                }))
            });
        }

        this._profile = DEVICE_PROFILES.find(o => {
            let found = o.vendorId == device.vendorId;
            if (found && o.productId) {
                found = o.productId == device.productId;
            }
            return found;
        }) ?? DEFAULT_PROFILE;
        await device.open();
        if (!device.configuration) {
            await device.selectConfiguration(1);
        }
        await device.selectConfiguration(this._profile.configuration);
        await device.claimInterface(this._profile.interface);

        const interf = device.configuration?.interfaces.find(i => i.interfaceNumber == this._profile?.interface);
        this._connection = interf?.alternate.endpoints.find(e => e.direction == 'out');
        // NOTE: some device don't allow reset
        try { await device.reset(); } catch { }

        this.device = {
            id: getDeviceId(device),
            name: device.productName ?? device.manufacturerName ?? device.serialNumber ?? "usb",
            usb: device
        };
    }
    public async connect(): Promise<void> {
        if (!this.device?.usb) {
            return;
        }

        if (this._connection && this.device.usb.opened) {
            return;
        }

        if (!this.device.usb.opened) {
            await this.device.usb.open();
            await this.device.usb.selectConfiguration(this._profile!.configuration);
            await this.device.usb.claimInterface(this._profile!.interface);
        }

        const interf = this.device.usb.configuration?.interfaces.find(i => i.interfaceNumber == this._profile!.interface);
        this._connection = interf?.alternate.endpoints.find(e => e.direction == 'out');
        try { await this.device.usb.reset(); } catch { }
        this.resetPrinter();
    }

    public async disconnect(): Promise<void> {
        if (!this._connection) {
            return;
        }

        if (this.device?.usb?.opened) {
            await this.device.usb.close();
        }

        this._connection = undefined;
    }
    declare public device?: IDevice & { usb?: USBDevice };
    declare public option: PrinterConfig;
    public async execute(command: Uint8Array<ArrayBuffer>): Promise<void> {
        if (!this._connection || !this.device?.usb || !this.device?.usb?.opened) {
            throw new Error("Device not connected");
        }

        await this.device.usb.transferOut(this._connection.endpointNumber, command);
    }
}