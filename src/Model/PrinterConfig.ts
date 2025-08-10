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
  public textAsImage: boolean = true;
  public mtu: number = 50;
  public image: "rastar" | "bit" = "rastar";
  public sharePrinter: boolean = false;
  public fontSize: number = 30;
  public fontFace: number = 0;
  public lineHeight: number = 1.2;
  public paperWidth: number = 58;
  public dpi: number = 203;
  public serialOption?: SerialOptions;
};
