import { FontMode, IPrinterService, TextAlign } from "../PrinterService/IPrinterService";
import { copy } from "../Utility/copy";
import { PrinterConfig } from "./PrinterConfig"

export enum Layout0 {
  mode1 = "0|000|.",
  mode2 = "0|00|.",
  mode3 = "0|00|000"
}
export enum AutoUpdateMode {
  silent,
  checkDaily,
  never,
  alwaysOnline
}
export enum OCREngine {
  none,
  web,
  gutenye
}

export class CalculatorConfig {
  public maxDecimal: number = 8;
  public maxDigit: number = 15;
  public deviceName: string = "";
  public keepScreenAwake: boolean = true;
  public align: TextAlign = TextAlign.right;
  public printOperator: boolean = false;
  public lockSetting: boolean = false;
  public vibrate: boolean = true;
  public sound: boolean = true;
  public layout0: Layout0 = Layout0.mode1;
  public ocrEngine: OCREngine = OCREngine.none;
  public autoUpdate: AutoUpdateMode = AutoUpdateMode.silent;
  public defaultConfig: PrinterConfig = new PrinterConfig();
  public printerConfig: { [key: string]: PrinterConfig } = {};

  public apply(printer: IPrinterService) {
    if (!(printer?.device)) {
      return;
    }

    const id = printer.device?.id;
    if (id) {
      let pConfig = this.printerConfig[id];
      if (!((pConfig as any) instanceof PrinterConfig)) {
        pConfig = copy(new PrinterConfig(), pConfig ?? this.defaultConfig, true);
        if (!pConfig.name || pConfig.name == "DEFAULT") {
          pConfig.name = printer.device.name ?? `PRINTER ${this.defaultConfig.printerType}`.toUpperCase();
        }
        this.printerConfig[id] = pConfig;
      }
    }

    printer.option = this.printerConfig[id] ?? this.defaultConfig;
    printer.setDefaultStyle({
      align: this.align,
      lineHeight: this.defaultConfig.lineHeight ?? 1.2,
      font: {
        size: this.defaultConfig.fontSize,
        fontFaceType: this.defaultConfig.fontFace!,
        fontStyle: FontMode.none
      }
    });
  }
};