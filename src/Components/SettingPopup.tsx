import { useEffect, useState } from 'preact/hooks';
import { CalculatorConfig, Layout0 } from '../Model/CalculatorConfig';
import { TextAlign } from '../PrinterService/IPrinterService';
import { IOCRService } from '../Services/OCR/OCRService';
import SettingService from '../Services/SettingService';
import { SpeechService } from '../Services/SpeechService';
import BottomPopup from './BottomPopup';
import './Form.css';

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
  const [data] = useState(settingData);
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
    navigator.serviceWorker.ready.then(async (swReg) => {
      const missingDepedencies = await Promise.all(
        setting.ocr.depedencies.map(o => caches.match(o).then(p => ({
          url: o,
          cache: p
        })))
      ).then(os => os.filter(p => !p.cache).map(p => p.url));
      if (missingDepedencies.length <= 0) {
        return;
      }

      const id = "ocr";
      const existing = await swReg.backgroundFetch.get(id);
      if (existing) {
        await existing.abort();
      }

      await swReg.backgroundFetch.fetch(id, missingDepedencies,
        {
          title: `OCR Models`,
          icons: [
            {
              sizes: "300x300",
              src: "./assets/images/icon.png",
              type: "image/png",
            },
          ],
          downloadTotal: 15_594_089 + 12_509_439
        },
      );
    });
  };
  const downloadONNX = () => {
    navigator.serviceWorker.ready.then(async (swReg) => {
      const missingDepedencies = await Promise.all(
        onnx_depedencies.map(o => caches.match(o).then(p => ({
          url: o,
          cache: p
        })))
      ).then(os => os.filter(p => !p.cache).map(p => p.url));
      if (missingDepedencies.length <= 0) {
        return;
      }

      const id = "onnx";
      const existing = await swReg.backgroundFetch.get(id);
      if (existing) {
        await existing.abort();
      }

      await swReg.backgroundFetch.fetch(id, missingDepedencies,
        {
          title: `ONNX Runtime`,
          icons: [
            {
              sizes: "300x300",
              src: "./assets/images/icon.png",
              type: "image/png",
            },
          ],
          downloadTotal: 21_872_216
        },
      );
    });
  };

  return (<BottomPopup isOpen={setting.isOpen} onClose={onClose} contentStyle={{ height: '100dvh', fontSize: '1rem', backgroundColor: '#f0f0f0', padding: '1rem 0' }}>
    <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>SETTING</h4>
    <div style={{ overflow: 'auto', height: 'calc(100% - 2rem)', padding: '0 1rem', boxSizing: 'border-box' }}>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem 0.5rem',
        }}>
        <div>Maks. desimal</div>
        <div>
          <input class='form' type='number' name="max-decimal" step="1" min="0" max="10" value={data.maxDecimal} onInput={(e) => { data.maxDecimal = parseInt(e.target.value); }} />
        </div>
        <div>Maks. digit</div>
        <div>
          <input class='form' type='number' name="max-digit" step="1" min="6" max="15" value={data.maxDigit} onInput={(e) => { data.maxDigit = parseInt(e.target.value); }} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          Nama device
          <div>
            <input class='form' type='text' name="device-name" value={data.deviceName} onInput={(e) => { data.deviceName = e.target.value; }} />
          </div>
        </div>
        <div>Berbagi printer</div>
        <div class="input-container">
          <label class="switch">
            <input
              type="checkbox"
              checked={data.defaultConfig.sharePrinter} onInput={(e) => { data.defaultConfig.sharePrinter = e.target.checked; }}
            />
            <span class="slider"></span>
          </label>
        </div>
        <div>Susanan 0</div>
        <div class="input-container">
          <select class='form' value={data.layout0} onInput={(e) => { data.layout0 = e.target?.value; }}>
          {[Layout0.mode1, Layout0.mode2, Layout0.mode3].map(o => (<option value={o}>{o}</option>))}
          </select>
        </div>
        <div>Ukuran kertas</div>
        <div>
          <select class='form' value={data.defaultConfig.paperWidth} onInput={(e) => { data.defaultConfig.paperWidth = parseInt(e.target.value); }}>
            {[58, 80].map(o => (<option value={o}>{o}mm</option>))}
          </select>
        </div>
        <div>DPI</div>
        <div>
          <select class='form' value={data.defaultConfig.dpi} onInput={(e) => { data.defaultConfig.dpi = parseInt(e.target.value); }}>
            {[203, 300, 600, 1200, 2400, 4800].map(o => (<option value={o}>{o}</option>))}
          </select>
        </div>
        <div>Ukuran huruf</div>
        <div>
          <input class='form' type='number' name="font-size" step="2" min="12" max="72" value={data.defaultConfig.fontSize} onInput={(e) => { data.defaultConfig.fontSize = parseInt(e.target.value); }} />
        </div>
        <div>Posisi cetakan</div>
        <div class="input-container">
          <select class='form' value={data.align} onInput={(e) => { data.align = parseInt(e.target.value); }}>
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
              checked={data.printOperator} onInput={(e) => { data.printOperator = e.target.checked; }}
            />
            <span class="slider"></span>
          </label>
        </div>
        <div>Tipe printer</div>
        <div>
          <select class='form' value={data.printerType} onInput={(e) => { data.printerType = e.target.value; }}>
            <option value={'bluetooth'}>Bluetooth</option>
            <option value={'imin'}>Imin Built-in</option>
          </select>
        </div>
        <div>MTU (Maximum Transmision Unit)</div>
        <div>
          <input class='form' type='number' name="max-digit" step="10" min="20" max="512" value={data.defaultConfig.mtu} onInput={(e) => { data.defaultConfig.mtu = Math.max(parseInt(e.target.value), 20); }} />
        </div>
        <div>Tipe cetakan text</div>
        <div>
          <select class='form' name="print-mode" value={data.defaultConfig.textAsImage?.toString()} onInput={(e) => { data.defaultConfig.textAsImage = e.target.value != "false"; }}>
            <option value={'true'}>Gambar</option>
            <option value={'false'}>Text</option>
          </select>
        </div>
        <div>Mode cetakan gambar</div>
        <div>
          <select class='form' name="image-mode" value={data.defaultConfig.image} onInput={(e) => { data.defaultConfig.image = e.target.value; }}>
            <option value={'rastar'}>Rastar</option>
            <option value={'bit'}>Bit</option>
          </select>
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <button class="btn" onClick={downloadONNX} disabled={(isONNXReady === true)}>Download ONNX Runtime</button>
        </div>
        <div style={{
          gridColumn: "span 2"
        }}>
          <button class="btn" onClick={downloadOCR} disabled={(setting.isOCRReady === true)}>Download OCR Dependencies</button>
        </div>
      </div>
    </div>
  </BottomPopup>);
}
