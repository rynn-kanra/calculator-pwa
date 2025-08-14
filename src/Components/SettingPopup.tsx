import { useEffect, useState } from 'preact/hooks';
import { CalculatorConfig, Layout0 } from '../Model/CalculatorConfig';
import { ImageType, PrinterType } from '../Model/PrinterConfig';
import { TextAlign } from '../PrinterService/IPrinterService';
import DownloadService from '../Services/DownloadService';
import { IOCRService } from '../Services/OCR/OCRService';
import SettingService from '../Services/SettingService';
import BottomPopup from './BottomPopup';
import '../Styles/Form.css';
import TabView, { Tab } from './TabView';
import IndexedDBService from '../Services/IndexedDBService';
import AuthenticationService from '../Services/AuthenticationService';

export interface SettingPopupProps {
  isOpen: boolean;
  onClose: (setting: CalculatorConfig) => void;
  setting?: CalculatorConfig;
  printerId?: string;
  ocr: IOCRService;
  isOCRReady: boolean;
}

const onnx_depedencies = ["./workers/ort-wasm-simd-threaded.jsep.wasm"];
export function SettingPopup(setting: SettingPopupProps) {
  let settingData = setting.setting!;
  if (!settingData) {
    settingData = SettingService.get();
  }

  const [isONNXReady, setONNXReady] = useState(false);
  const [data, setData] = useState(settingData);
  const [printerSettings, setPrinterSettings] = useState([] as Tab[]);
  const [printerType, setPrinterType] = useState(data.defaultConfig.printerType);

  useEffect(() => {
    Promise.all(
      onnx_depedencies.map(o => caches.match(o))
    ).then(os => os.every(p => !!p))
      .then(o => {
        setONNXReady(o);
      });
  }, []);

  const onClose = () => {
    SettingService.set(data);
    setting.onClose && setting.onClose(data);
  };

  const downloadOCR = () => {
    DownloadService.download("ocr", setting.ocr.depedencies, {
      title: `OCR Models`,
      icons: [
        {
          sizes: "300x300",
          src: "./assets/images/icon.png",
          type: "image/png",
        },
      ],
      downloadTotal: 15_594_089 + 12_509_439
    });
  };
  const downloadONNX = () => {
    DownloadService.download("onnx", onnx_depedencies, {
      title: `ONNX Runtime`,
      icons: [
        {
          sizes: "300x300",
          src: "./assets/images/icon.png",
          type: "image/png",
        },
      ],
      downloadTotal: 21_872_216
    });
  };

  useEffect(() => {
    const printerSettings = [data.defaultConfig].concat(Object.values(data.printerConfig)).map((o, ix) => {
      const isDefault = o == data.defaultConfig;
      switch (o.printerType) {
        case PrinterType.Bluetooth: {
          if (!o.bluetoothOption) {
            o.bluetoothOption = {
              mtu: 50
            };
          }
          break;
        }
        case PrinterType.Serial: {
          if (!o.serialOption) {
            o.serialOption = {
              baudRate: 9600,
              bufferSize: 255,
              dataBits: 8,
              flowControl: "none",
              stopBits: 1
            };
          }
          break;
        }
      }
      return {
        title: o.name?.toUpperCase(),
        content: (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1rem 0.5rem',
            }}>
            <div>Tipe printer</div>
            <div>
              <select class='form' disabled={!isDefault} value={o.printerType} onInput={(e) => { o.printerType = e.currentTarget.value as PrinterType; setPrinterType(o.printerType) }}>
                {Object.entries(PrinterType).map(([name, value]) => (<option value={value}>{name.replaceAll('_', ' ')}</option>))}
              </select>
            </div>
            <div>Auto konek</div>
            <div class="input-container">
              <label class="switch">
                <input
                  type="checkbox"
                  checked={o.autoConnect} onInput={(e) => { o.autoConnect = e.currentTarget.checked; }}
                />
                <span class="slider"></span>
              </label>
            </div>
            <div>Ukuran kertas</div>
            <div>
              <select class='form' value={data.defaultConfig.paperWidth} onInput={(e) => { data.defaultConfig.paperWidth = parseInt(e.currentTarget.value); }}>
                {[58, 80].map(o => (<option value={o}>{o}mm</option>))}
              </select>
            </div>
            <div>DPI</div>
            <div>
              <select class='form' value={data.defaultConfig.dpi} onInput={(e) => { data.defaultConfig.dpi = parseInt(e.currentTarget.value); }}>
                {[203, 300, 600, 1200, 2400, 4800].map(o => (<option value={o}>{o}</option>))}
              </select>
            </div>
            <div>Ukuran huruf</div>
            <div>
              <input class='form' type='number' name="font-size" step="2" min="12" max="72" value={data.defaultConfig.fontSize} onInput={(e) => { data.defaultConfig.fontSize = parseInt(e.currentTarget.value); }} />
            </div>
            <div>Tipe cetakan text</div>
            <div>
              <select class='form' name="print-mode" value={o.textAsImage?.toString()} onInput={(e) => { o.textAsImage = e.currentTarget.value != "false"; }}>
                <option value={'true'}>Gambar</option>
                <option value={'false'}>Text</option>
              </select>
            </div>
            <div>Mode cetakan gambar</div>
            <div>
              <select class='form' name="image-mode" value={o.image} onInput={(e) => { o.image = e.currentTarget.value as ImageType; }}>
                <option value={'rastar'}>Rastar</option>
                <option value={'bit'}>Bit</option>
              </select>
            </div>
            <div>Berbagi printer</div>
            <div class="input-container">
              <label class="switch">
                <input
                  type="checkbox"
                  checked={o.sharePrinter} onInput={(e) => { o.sharePrinter = e.currentTarget.checked; }}
                />
                <span class="slider"></span>
              </label>
            </div>
            {o.printerType == PrinterType.Bluetooth && (
              <>
                <div style={{ gridColumn: 'span 2', textTransform: "uppercase", fontWeight: "bold" }}>Setting Bluetooth</div>
                <div>MTU (Maximum Transmision Unit)</div>
                <div>
                  <input class='form' type='number' name="max-digit" step="10" min="20" max="512" value={o.bluetoothOption!.mtu} onInput={(e) => { o.bluetoothOption!.mtu = Math.max(parseInt(e.currentTarget.value), 20); }} />
                </div>
              </>
            )}
            {o.printerType == PrinterType.Serial && (
              <>
                <div style={{ gridColumn: 'span 2', textTransform: "uppercase", fontWeight: "bold" }}>Setting Serial</div>
                <div>Baud Rate</div>
                <div>
                  <select class='form' value={o.serialOption!.baudRate} onInput={(e) => { o.serialOption!.baudRate = parseInt(e.currentTarget.value); }}>
                    {[9600, 19200, 38400, 57600, 115200].map(o => (<option value={o}>{o}</option>))}
                  </select>
                </div>
                <div>Data Bits</div>
                <div>
                  <select class='form' value={o.serialOption!.dataBits} onInput={(e) => { o.serialOption!.dataBits = parseInt(e.currentTarget.value); }}>
                    {[8, 7].map(o => (<option value={o}>{o}</option>))}
                  </select>
                </div>
                <div>Stop Bits</div>
                <div>
                  <select class='form' value={o.serialOption!.stopBits} onInput={(e) => { o.serialOption!.stopBits = parseInt(e.currentTarget.value); }}>
                    {[1, 2].map(o => (<option value={o}>{o}</option>))}
                  </select>
                </div>
                <div>Buffer Size</div>
                <div>
                  <input class='form' type='number' name="buffer-size" step="10" min="64" max="2048" value={o.serialOption!.bufferSize} onInput={(e) => { o.serialOption!.bufferSize = Math.max(parseInt(e.currentTarget.value), 64); }} />
                </div>
                <div>Flow Control</div>
                <div>
                  <select class='form' value={o.serialOption!.flowControl} onInput={(e) => { o.serialOption!.flowControl = e.currentTarget.value as FlowControlType; }}>
                    {[["none", "none"], ["hardware", "RTS/CTS hardware handshake"]].map(([value, name]) => (<option value={value}>{name}</option>))}
                  </select>
                </div>
              </>
            )}
          </div>
        )
      };
    });
    setPrinterSettings(printerSettings);
  }, [data, printerType]);

  return (<BottomPopup isOpen={setting.isOpen} onClose={onClose} contentStyle={{ height: '100dvh', fontSize: '1rem', backgroundColor: '#f0f0f0', padding: '1rem 0' }}>
    <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>SETTING</h4>
    <div style={{ overflow: 'auto', height: 'calc(100% - 2rem)', padding: '0 1rem', boxSizing: 'border-box' }}>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem 0.5rem',
        }}>
        <div>Maks. desimal</div>
        <div>
          <input class='form' type='number' name="max-decimal" step="1" min="0" max="10" value={data.maxDecimal} onInput={(e) => { data.maxDecimal = parseInt(e.currentTarget.value); }} />
        </div>
        <div>Maks. digit</div>
        <div>
          <input class='form' type='number' name="max-digit" step="1" min="6" max="15" value={data.maxDigit} onInput={(e) => { data.maxDigit = parseInt(e.currentTarget.value); }} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          Nama device
          <div>
            <input class='form' type='text' name="device-name" placeholder="contoh: DEVICE #001" value={data.deviceName} onInput={(e) => { data.deviceName = e.currentTarget.value; }} />
          </div>
        </div>
        <div>Susanan 0</div>
        <div class="input-container">
          <select class='form' value={data.layout0} onInput={(e) => { data.layout0 = e.currentTarget.value as Layout0; }}>
            {[Layout0.mode1, Layout0.mode2, Layout0.mode3].map(o => (<option value={o}>{o}</option>))}
          </select>
        </div>
        <div>Posisi cetakan</div>
        <div class="input-container">
          <select class='form' value={data.align} onInput={(e) => { data.align = parseInt(e.currentTarget.value); }}>
            <option value={TextAlign.left}>Kiri</option>
            <option value={TextAlign.center}>Tengah</option>
            <option value={TextAlign.right}>Kanan</option>
          </select>
        </div>
        <div>Cetak operator</div>
        <div class="input-container">
          <label class="switch">
            <input
              type="checkbox"
              checked={data.printOperator} onInput={(e) => { data.printOperator = e.currentTarget.checked; }}
            />
            <span class="slider"></span>
          </label>
        </div>
        <div>Kunci setting biometrik</div>
        <div class="input-container">
          <label class="switch">
            <input
              type="checkbox"
              checked={data.lockSetting} onInput={async (e) => {
                const el = e.currentTarget;
                try {
                  if (el.checked) {
                    let isRegistered = await AuthenticationService.isRegistered();
                    if (!isRegistered) {
                      isRegistered = await AuthenticationService.register();
                    }
                    el.checked = isRegistered;
                  }

                  data.lockSetting = el.checked;
                }
                catch {
                  data.lockSetting = el.checked = !el.checked;
                }
              }}
            />
            <span class="slider"></span>
          </label>
        </div>
        <div>Suara ketik</div>
        <div class="input-container">
          <label class="switch">
            <input
              type="checkbox"
              checked={data.sound} onInput={(e) => { data.sound = e.currentTarget.checked; }}
            />
            <span class="slider"></span>
          </label>
        </div>
        <div>Bergetaran saat ditekan</div>
        <div class="input-container">
          <label class="switch">
            <input
              type="checkbox"
              checked={data.vibrate} onInput={(e) => { data.vibrate = e.currentTarget.checked; }}
            />
            <span class="slider"></span>
          </label>
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>SETTING PRINTER</h4>
          <TabView tabs={printerSettings}></TabView>
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>DOWNLOAD</h4>
          <button class="btn" onClick={downloadONNX} disabled={(isONNXReady === true)}>Download ONNX Runtime</button>
          <button class="btn" onClick={downloadOCR} disabled={(setting.isOCRReady === true)}>Download OCR Dependencies</button>
        </div>
      </div>
    </div>
  </BottomPopup>);
}
