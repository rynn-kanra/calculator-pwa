export class PrinterConfig {
  // typical paper width (58mm printer ≈ 384px)
  public width: number = 358;
  public textAsImage: boolean = true;
  public mtu: number = 50;
  public image: "rastar" | "bit" = "bit";
  public sharePrinter: boolean = false;
  public fontSize: number = 30;
  public fontFace: number = 0;
  public lineHeight: number = 1.2;
};
