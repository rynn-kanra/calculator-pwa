import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Trash2 } from 'lucide-preact';
import { useSetting } from './SettingContext';

export default function Check() {
  const [inputs, setInputs] = useState<string[]>([]);
  const [, , hapticFeedback] = useSetting();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const data = params.get('data');
    if (data) {
      setInputs(data.split("+").filter(o => o));
    }
  }, []);

  const cancel = () => {
    hapticFeedback();

    document.startViewTransition(() => window.history.back());
  };
  const ok = () => {
    hapticFeedback();

    document.startViewTransition(() => route(`/?data=${encodeURIComponent(inputs.join('+') + '+')}`));
  };

  return (<div style={{ height: '100dvh', backgroundColor: '#f0f0f0', padding: '1rem 0 0 0', boxSizing: "border-box", viewTransitionName: "view-scale" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "1rem", margin: "0 1rem 1rem 1rem" }}>
      <div>
        <button class="btn-small" style={{ color: "slategrey", margin: 0 }} onClick={cancel}>CANCEL</button>
      </div>
      <h4 style={{ textAlign: 'center', margin: '0' }}>PREVIEW</h4>
      <div>
        <button class="btn-small" style={{ color: "white", backgroundColor: "#4caf50", borderColor: "#4caf50", margin: 0 }} onClick={ok}>OK</button>
      </div>
    </div>
    <div style={{ overflow: 'auto', height: 'calc(100% - 2.5rem)', padding: '0 1rem 1rem 1rem', boxSizing: "border-box" }}>
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
            <div style={{
              position: "relative", minWidth: "2rem",
              display: "flex", alignItems: "center"
            }}>
              <button class="float-btn" style={{
                color: "#f44336",
                fontSize: "1.2rem",
                right: 0
              }} onClick={() => setInputs(inputs.filter((_, ix) => ix !== i))}><Trash2 style={{ strokeWidth: 2 }} /></button>
            </div>
          </>)
        })}
      </div>
    </div>
  </div>);
}
