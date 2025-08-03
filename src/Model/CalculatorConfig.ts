import { FontMode, IPrinterService, TextAlign } from "../PrinterService/IPrinterService";
import { PrinterConfig } from "./PrinterConfig"

export enum Layout0{
  mode1 = "0|000|.",
  mode2 = "0|00|.",
  mode3 = "0|00|000"
}
export class CalculatorConfig {
  public maxDecimal: number = 8;
  public maxDigit: number = 15;
  public deviceName: string = "";
  public printerType: string = "bluetooth";
  public keepScreenAwake: boolean = true;
  public align: TextAlign = TextAlign.right;
  public printOperator: boolean = false;
  public layout0: Layout0 = Layout0.mode1;
  public defaultConfig: PrinterConfig = new PrinterConfig();
  public printerConfig: { [key: string]: PrinterConfig } = {};

  public apply(printer: IPrinterService) {
    if (!(printer?.device)) {
      return;
    }

    printer.option = this.printerConfig[printer.device?.name ?? ""] ?? this.defaultConfig;
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