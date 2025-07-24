import { CalculatorConfig } from '../Model/CalculatorConfig';
import { TextAlign } from '../PrinterService/IPrinterService';
import SettingService from '../Services/SettingService';
import BottomPopup from './BottomPopup';
import './Form.css';

export interface SettingPopupProps {
  isOpen: boolean;
  onClose: (setting: CalculatorConfig) => void;
  setting?: CalculatorConfig;
  printerId?: string;
}

export function SettingPopup(setting: SettingPopupProps) {
  let data = setting.setting!;
  if (!data) {
    data = SettingService.get();
  }
  const onClose = () => {
    SettingService.set(data);
    setting.onClose && setting.onClose(data);
  };
  return (<BottomPopup isOpen={setting.isOpen} onClose={onClose} contentStyle={{ height: '100vh', fontSize: '1rem', backgroundColor: '#f0f0f0', padding: '1rem 0' }}>
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
          <input class='form' type='number' name="max-digit" step="1" min="6" max="50" value={data.maxDigit} onInput={(e) => { data.maxDigit = parseInt(e.target.value); }} />
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
        <div>Ukuran kertas</div>
        <div>
          <select class='form' value={data.defaultConfig.width} onInput={(e) => { data.defaultConfig.width = parseInt(e.target.value); }}>
            <option value={358}>58mm</option>
            <option value={576}>80mm</option>
          </select>
        </div>
        <div>Ukuran huruf</div>
        <div>
          <input class='form' type='number' name="font-size" step="2" min="12" max="72" value={data.defaultConfig.fontSize} onInput={(e) => { data.defaultConfig.fontSize = parseInt(e.target.value); }} />
        </div>
        <div>Posisi cetakan</div>
        <div>
          <select class='form' value={data.align} onInput={(e) => { data.align = parseInt(e.target.value); }}>
            <option value={TextAlign.left}>Kiri</option>
            <option value={TextAlign.center}>Tengah</option>
            <option value={TextAlign.right}>Kanan</option>
          </select>
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
      </div>
    </div>
  </BottomPopup>);
}
