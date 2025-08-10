import { useEffect, useState } from 'preact/hooks';
import BottomPopup from './BottomPopup';
import { position } from 'html2canvas/dist/types/css/property-descriptors/position';
import { color } from 'bun';

export interface SettingPopupProps {
  isOpen: boolean;
  onOK: (data: string[]) => void;
  onCancel: () => void;
  datas: string[];
}

export function CheckPopup({ isOpen, onOK, onCancel, datas }: SettingPopupProps) {
  const [inputs, setInputs] = useState(datas);
  useEffect(() => {
    setInputs(datas);
  }, [datas]);
  return (<BottomPopup isOpen={isOpen} onClose={() => onCancel()} hideClose={true} contentStyle={{ height: 'calc(100dvh - 6rem)', backgroundColor: '#f0f0f0', padding: '1rem 0' }}>
    <div style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1rem' }}>
      <button class="btn-small" style={{ color: "#f44336", borderColor: "#f44336" }} onClick={onCancel}>CANCEL</button>
      <button class="btn-small" style={{ color: "white", backgroundColor: "#4caf50", border: "none" }} onClick={() => onOK(inputs)}>OK</button>
    </div>
    <div style={{ overflow: 'auto', height: 'calc(100% - 2rem)', padding: '0 1rem' }}>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: '1.5rem 0.5rem',
          fontSize: '2rem',
          textAlign: 'right'
        }}>
        {inputs.map((input, i) => {
          return (<>
            <div style={{
              color: '#888',
              fontSize: '1rem',
              lineHeight: '2.2rem'
            }}>{i + 1}</div>
            <input class="form" type="tel" inputmode="decimal" pattern="[0-9,-]*" value={input} onInput={(e) => { inputs[i] = e.currentTarget.value; }} />
            <div style={{ position: "relative", minWidth: "2rem" }}>
              <button class="float-btn" style={{
                backgroundColor: "#f44336",
                color: "white"
              }} onClick={() => setInputs(inputs.filter((_, ix) => ix !== i))}>×</button>
            </div>
          </>)
        })}
      </div>
    </div>
  </BottomPopup>);
}
