export enum PrinterType {
  Bluetooth = "bluetooth",
  Serial = "serial",
  USB = "usb",
  // Socket = "socket",
  // Network = "network", // NOT SUPPORTED
  Imin_Build_In = "imin"
}
export type ImageType = "rastar" | "bit";

type BluetoothPrinterOptions = {
  mtu: number;  // 20-512, (232) - 20 for safe value but slower
  delayTime?: number;
};

export class PrinterConfig {
  // typical paper width (58mm printer ≈ 384px)
  public get width(): number {
    return Math.ceil(this.printableWidth * this.dpi / 25.4);
  };
  public get printableWidth(): number {
    switch (this.paperWidth) {
      case 80: return 72;
      case 58: return 48;
      default: return this.paperWidth - 10;
    }
  };
  public name: string = "DEFAULT";
  public autoConnect: boolean = true;
  public printerType: PrinterType = PrinterType.Bluetooth;
  public textAsImage: boolean = true;
  public image: ImageType = "rastar";
  public sharePrinter: boolean = false;
  public fontSize: number = 30;
  public fontFace: number = 0;
  public lineHeight: number = 1;
  public paperWidth: number = 58;
  public dpi: number = 203;
  public serialOption?: SerialOptions;
  public bluetoothOption?: BluetoothPrinterOptions;
};
