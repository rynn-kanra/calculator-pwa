export enum PrinterType {
  Bluetooth = "bluetooth",
  Serial = "serial",
  USB = "usb",
  WebSocket = "websocket",
  // Network = "network", // NOT SUPPORTED
  Imin_Build_In = "imin",
  Debug = "debug"
}
export enum ImagePrintMode {
  Rastar = "rastar",
  Bit = "bit",
  RamRastar = "ram-rastar",
  DotMatrix = "dot-matrix"
}

type BluetoothPrinterOptions = {
  mtu: number;  // 20-512, (232) - 20 for safe value but slower
  delayTime?: number;
};
type USBPrinterOptions = {
  delayTime?: number;
  vendorId?: string;
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
  public image: ImagePrintMode = ImagePrintMode.Rastar;
  public sharePrinter: boolean = false;
  public fontSize: number = 30;
  public fontFace: number = 0;
  public lineHeight: number = 1;
  public paperWidth: number = 58;
  public dpi: number = 203;
  public serialOption?: SerialOptions;
  public bluetoothOption?: BluetoothPrinterOptions;
  public usbOption?: USBPrinterOptions;
};
