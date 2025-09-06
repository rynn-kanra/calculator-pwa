import { useEffect, useState } from 'preact/hooks';
import { AutoUpdateMode, Layout0, OCREngine } from '../Model/CalculatorConfig';
import { ImagePrintMode, PrinterType } from '../Model/PrinterConfig';
import { TextAlign } from '../PrinterService/IPrinterService';
import DownloadService from '../Services/DownloadService';
import { OCRServiceBase } from '../Services/OCR/OCRService';
import TabView, { Tab } from './TabView';
import AuthenticationService from '../Services/AuthenticationService';
import PushService from '../Services/PushService';
import { useSetting } from './SettingContext';
import { GutenyeOCRService } from '../Services/OCR/GutenyeOCRService';
import { route } from 'preact-router';
import shared from "../Services/Shared";
import { WebOCRService } from '../Services/OCR/WebOCRService';
import ScreenService from '../Services/ScreenService';
import type { EventSubscription } from '../Utility/eventHandler';

let ocrService: OCRServiceBase;
const onnx_depedencies = ["./workers/ort-wasm-simd-threaded.jsep.wasm"];
export default function Setting() {
  const [setting, setSetting, hapticFeedback] = useSetting();
  const [isOCRReady, setOCRReady] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isONNXReady, setONNXReady] = useState(true);
  const [data, setData] = useState(structuredClone(setting));
  const [printerSettings, setPrinterSettings] = useState([] as Tab[]);
  const [printerType, setPrinterType] = useState(data?.defaultConfig?.printerType);

  useEffect(() => {
    let idleListener: EventSubscription<IdleDetector, Event>;
    if (setting.lockSetting) {
      (async () => {
        const authorize = async () => {
          return AuthenticationService.authenticate().then(o => {
            setAuthorized(o);
            if (!o) {
              document.startViewTransition(() => route(`/`));
            }

            return o;
          });
        }
        const a = await authorize();
        if (!a) {
          return;
        }

        let requireAuthenticate = false;
        idleListener = await ScreenService.idleEvent();
        idleListener.subscribe((e) => {
          const t = e.currentTarget;
          if (t.screenState === "locked" || t.userState === "idle") {
            requireAuthenticate = true;
            setAuthorized(false);
          }
          else if (requireAuthenticate) {
            requireAuthenticate = false;
            authorize();
          }
        });
      })();
    }
    else {
      setAuthorized(true);
    }
    Promise.all(
      onnx_depedencies.map(o => caches.match(o))
    ).then(os => os.every(p => !!p))
      .then(o => {
        setONNXReady(o);
      });

    switch (setting.ocrEngine) {
      case OCREngine.web: {
        ocrService = new WebOCRService();
        break;
      }
      case OCREngine.gutenye:
      default: {
        ocrService = new GutenyeOCRService();
        break;
      }
    }

    Promise.all(
      ocrService.depedencies.map(o => caches.match(o))
    ).then(os => os.every(p => !!p))
      .then(o => {
        setOCRReady(o);
      });

    return () => {
      idleListener?.unsubscribe();
    };
  }, []);

  const onCancel = () => {
    hapticFeedback();
    document.startViewTransition(() => route(`/`));
  };
  const onSave = () => {
    hapticFeedback();
    setSetting(data);
    document.startViewTransition(() => route(`/`));
  };

  const downloadOCR = () => {
    hapticFeedback();
    DownloadService.download("ocr", ocrService.depedencies, {
      title: `OCR Models`,
      icons: [
        {
          sizes: "192x192",
          src: "./assets/images/icon.192.png",
          type: "image/png",
        },
      ],
      downloadTotal: 15_594_089 + 12_509_439
    });
  };
  const downloadONNX = () => {
    hapticFeedback();
    DownloadService.download("onnx", onnx_depedencies, {
      title: `ONNX Runtime`,
      icons: [
        {
          sizes: "192x192",
          src: "./assets/images/icon.192.png",
          type: "image/png",
        },
      ],
      downloadTotal: 21_872_216
    });
  };
  const updateVersion = async () => {
    hapticFeedback();
    const p = await Notification.requestPermission();
    if (p !== "granted") {
      alert("Permission denied");
      return
    }
    navigator.serviceWorker.controller?.postMessage({ action: "UPDATE:CHECK", params: [true] });
  };

  useEffect(() => {
    if (!data || !data.defaultConfig)
      return;

    const printerSettings = [data.defaultConfig].concat(Object.values(data.printerConfig)).map((o, ix) => {
      const isDefault = o == data.defaultConfig;
      switch (o.printerType) {
        case PrinterType.Bluetooth: {
          if (!o.bluetoothOption) {
            o.bluetoothOption = {
              mtu: 50,
              delayTime: 0
            };
          }
          break;
        }
        case PrinterType.USB: {
          if (!o.usbOption) {
            o.usbOption = {};
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
            <div>Tipe printer
              {o.printerType === PrinterType.USB && (<div style={{ color: "#888", fontSize: "0.8em" }}>(zadig.exe - change usb driver to WinUSB)</div>)}
            </div>
            <div>
              <select class='form' disabled={!isDefault} value={o.printerType} onInput={(e) => { o.printerType = e.currentTarget.value as PrinterType; setPrinterType(o.printerType) }}>
                {Object.entries(PrinterType).map(([name, value]) => (<option value={value}>{name.replaceAll('_', ' ')}</option>))}
              </select>
            </div>
            <div>Auto konek
              {o.printerType === PrinterType.Bluetooth && (<div style={{ color: "#888", fontSize: "0.8em" }}>(chrome://flags/#enable-web-bluetooth-new-permissions-backend)</div>)}
            </div>
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
              <select class='form' value={o.paperWidth} onInput={(e) => { o.paperWidth = parseInt(e.currentTarget.value); }}>
                {[58, 80].map(o => (<option value={o}>{o}mm</option>))}
              </select>
            </div>
            <div>DPI</div>
            <div>
              <select class='form' value={o.dpi} onInput={(e) => { o.dpi = parseInt(e.currentTarget.value); }}>
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
              <select class='form' name="image-mode" value={o.image} onInput={(e) => { o.image = e.currentTarget.value as ImagePrintMode; }}>
                {[
                  ["Raster Image in RAM (GS 8 L)", ImagePrintMode.RamRastar],
                  ["Raster Image (GS v 0)", ImagePrintMode.Rastar],
                  ["Bit Image (ESC *)", ImagePrintMode.Bit],
                  ["Dot Matrix Image (ESC L)", ImagePrintMode.DotMatrix],
                ].map(o => (<option value={o[1]}>{o[0]}</option>))}
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
            {o.printerType == PrinterType.USB && (
              <>
                <div style={{ gridColumn: 'span 2', textTransform: "uppercase", fontWeight: "bold" }}>Setting USB</div>
                <div>VendorId
                  <div style={{ color: "#888", fontSize: "0.8em" }}>(check driver or manual)</div>
                </div>
                <div>
                  <input class='form' type='text' name="vendor" value={o.usbOption!.vendorId} onInput={(e) => { o.usbOption!.vendorId = e.currentTarget.value; }} />
                </div>
                <div>Waktu delay</div>
                <div>
                  <input class='form' type='number' name="delay" step="10" min="0" max="1000" value={o.bluetoothOption!.delayTime} onInput={(e) => { o.bluetoothOption!.delayTime = Math.max(parseInt(e.currentTarget.value), 0); }} />
                </div>
              </>
            )}
            {o.printerType == PrinterType.Bluetooth && (
              <>
                <div style={{ gridColumn: 'span 2', textTransform: "uppercase", fontWeight: "bold" }}>Setting Bluetooth</div>
                <div>MTU (Maximum Transmision Unit)</div>
                <div>
                  <input class='form' type='number' name="max-digit" step="10" min="20" max="512" value={o.bluetoothOption!.mtu} onInput={(e) => { o.bluetoothOption!.mtu = Math.max(parseInt(e.currentTarget.value), 20); }} />
                </div>
                <div>Waktu delay</div>
                <div>
                  <input class='form' type='number' name="delay" step="10" min="0" max="1000" value={o.bluetoothOption!.delayTime} onInput={(e) => { o.bluetoothOption!.delayTime = Math.max(parseInt(e.currentTarget.value), 0); }} />
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

  return (<div style={{ height: '100dvh', visibility: authorized ? '' : 'hidden', fontSize: '1rem', backgroundColor: '#f0f0f0', padding: '1rem 0 0', boxSizing: "border-box", viewTransitionName: "view-scale" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "1rem", margin: "0 1rem 1rem 1rem" }}>
      <div>
        <button class="btn-small" style={{ color: "slategrey", margin: 0 }} onClick={onCancel}>CANCEL</button>
      </div>
      <h4 style={{ textAlign: 'center', margin: '0' }}>SETTING</h4>
      <div>
        <button class="btn-small" style={{ color: "white", backgroundColor: "#4caf50", borderColor: "#4caf50", margin: 0 }} onClick={onSave}>SAVE</button>
      </div>
    </div>
    <div style={{ overflow: 'auto', height: 'calc(100% - 2rem)', padding: '0 1rem 1rem 1rem', boxSizing: 'border-box' }}>
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
                    await IdleDetector.requestPermission();
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
        <div>Auto Update</div>
        <div class="input-container">
          <select class='form' name="autoUpdate" value={data.autoUpdate} onInput={async (e) => {
            try {
              const newValue = parseInt(e.currentTarget.value);
              if (newValue === AutoUpdateMode.checkDaily) {
                const isSuccess = await PushService.subscribe();
                if (!isSuccess) {
                  throw new Error("Permission denied");
                }
              }
              data.autoUpdate = newValue;
            }
            catch (er) {
              alert(er);
              e.currentTarget.value = data.autoUpdate.toString();
            }
          }}>
            <option value={AutoUpdateMode.silent}>Silent</option>
            <option value={AutoUpdateMode.checkDaily}>Cek setiap hari</option>
            <option value={AutoUpdateMode.never}>Manual</option>
            <option value={AutoUpdateMode.alwaysOnline}>Selalu Online</option>
          </select>
        </div>
        <div>OCR Engine</div>
        <div class="input-container">
          <select class='form' name="ocr-engine" value={data.ocrEngine} onInput={(e) => data.ocrEngine = parseInt(e.currentTarget.value)}>
            {Object.entries(OCREngine).filter(([, value]) => value !== OCREngine.none && typeof value === "number").map(([name, value]) => (<option value={value}>{name.replaceAll('_', ' ').toLocaleUpperCase()}</option>))}
          </select>
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>SETTING PRINTER</h4>
          <TabView tabs={printerSettings} initialIndex={Math.max(0, Object.keys(data.printerConfig).indexOf(shared.printer?.device?.id || "") + 1)}></TabView>
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>DOWNLOAD</h4>
          <button class="btn" onClick={updateVersion}>Check Update</button>
          {!isONNXReady && (<button class="btn" onClick={downloadONNX}>Download ONNX Runtime</button>)}
          {!isOCRReady && (<button class="btn" onClick={downloadOCR}>Download OCR Dependencies</button>)}
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>TOOLS</h4>
          <button class="btn" onClick={() => document.startViewTransition(() => route("/barcode"))}>Barcode Scanner</button>
        </div>
      </div>
    </div>
  </div>);
}
