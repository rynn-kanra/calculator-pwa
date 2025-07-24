import { useState, useEffect, useRef } from 'preact/hooks';
import { BluetoothPrinterService } from '../PrinterService/BluetoothPrinterService';
import { TextAlign } from '../PrinterService/IPrinterService';
import { CalcParser } from '../Services/MathLanguageParser';
import ScreenService from '../Services/ScreenService';
import SettingService from '../Services/SettingService';
import SpeechService from '../Services/SpeechService';
import '../styles/button.css';
import { useLongPress } from '../Utility/useLongPress';
import BottomPopup from './BottomPopup';
import { SettingPopup } from './SettingPopup';

const exps: [string, number][] = [];
let temp: string = "";
let tempDisplay: string = "";
let input: string = "";

let listenKeyboard = true;
let setting = SettingService.get();
if (setting.keepScreenAwake !== false) {
  ScreenService.keepScreenAwake();
}

let printer: BluetoothPrinterService | undefined;
export function Calculator() {
  const [isCheckView, openCheckView] = useState(false);
  const [showSetting, openSetting] = useState(false);
  const [isListening, setListening] = useState(false);
  const clickRef = useRef((a: string) => { });
  const inAudioCtxRef = useRef<AudioContext | null>(null);
  const inBufferRef = useRef<AudioBuffer | null>(null);
  const [printerStatus, setPrinterStatus] = useState('offline');
  const [showAC, setShowAC] = useState(true);
  const [operator, setOperator] = useState('');
  const [display, setDisplay] = useState('');
  const [checkIndex, setCheckIndex] = useState(-1);

  const requestPrinter = async () => {
    try {
      const d = new BluetoothPrinterService(setting.defaultConfig, {
        align: setting.align,
        font: {
          size: setting.defaultConfig.fontSize,
          fontFaceType: setting.defaultConfig.fontFace
        }
      });
      await d.init();
      setting.apply(d);
      if (printer) {
        printer.dispose();
      }
      printer = d;
      (globalThis as any).printer = printer;
      setPrinterStatus("online");
    }
    catch (e) {
      console.log("ini printer:" + e);
    }
  }
  const print = (text: string, sum?: number) => {
    if (text[0] === "+") {
      text = text.substring(1);
    }
    const isMult = text.indexOf("×") != -1 || text.indexOf("÷") != -1;
    if (!printer) {
      switch (setting.align) {
        case TextAlign.right: {
          text = text.padStart(50);
          break;
        }
        case TextAlign.center: {
          text = ' '.repeat((50 - text.length) / 2) + text;
          break;
        }
      }
      console.log(text);
    }
    else {
      printer?.printLine(text);
    }
    if (isMult) {
      printer?.printLine("=" + formatNumber(sum || 0));
      printer?.feed(printer.option.fontSize * 0.5);
    }
  }
  const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: setting.maxDecimal });
  const formatNumber = (number: number) => {
    return numberFormat.format(number).replaceAll('-', '−');
  }
  const result = () => {
    let result = 0;
    for (const d of exps) {
      result = fixFloat(result + d[1]);
    }
    return result;
  };
  const fixFloat = (n: number) => {
    return Number((n + Number.EPSILON).toFixed(15));
  }
  const handleClick = (value: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(100); // vibrate for 10 milliseconds
    }

    // play click sound
    const ctx = inAudioCtxRef.current;
    const buffer = inBufferRef.current;
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }

    switch (value) {
      case " ": {
        break;
      }
      case "⎙": {
        if (!printer) {
          requestPrinter();
          return;
        }

        let result = 0;
        if (exps.length > 1 && setting.deviceName) {
          printer?.printLine(setting.deviceName, {
            align: TextAlign.center
          });
          printer?.feed(15);
        }

        for (const exp of exps) {
          print(exp[0], exp[1]);
          result += exp[1];
        }
        printer?.printSeparator("-");
        print(formatNumber(result));
        printer?.lineFeed(1);
        printer?.printSeparator("=");
        printer?.lineFeed(1);
        if (printer?.option.sharePrinter) {
          printer?.pause();
        }
        break;
      }
      case "⍐": {
        if (!printer) {
          return;
        }

        if (printer) {
          printer?.lineFeed();
        }
        break;
      }
      case "CE": {
        if (input) {
          input = "";
          setDisplay(input);
        }
        setTimeout(() => { setShowAC(true); }, 100);
        break;
      }
      case "AC": {
        temp = tempDisplay = input = "";
        setDisplay(formatNumber(Number(input)));
        exps.length = 0;
        setCheckIndex(exps.length);
        setOperator("");
        setShowAC(true);
        if (printer?.option.sharePrinter) {
          printer?.pause();
        }
        break;
      }
      case "=": {
        let ncheckIndex = checkIndex;
        if (input) {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          exps.push([formatted, eval(temp + input)]);
          setCheckIndex(exps.length);
          ncheckIndex = exps.length;
          print(formatted, eval(temp + input));
          temp = tempDisplay = input = "";
        }
        setOperator(value);
        const resultNumb = result();
        setDisplay(formatNumber(resultNumb));

        if (ncheckIndex >= exps.length && exps.length > 0) {
          temp = tempDisplay = input = "";
          printer?.printSeparator("-");
          print(formatNumber(resultNumb));
          printer?.printSeparator("=");
          printer?.lineFeed(1);
          if (printer?.option.sharePrinter) {
            printer?.pause();
          }
        }
        setCheckIndex(exps.length);
        setShowAC(true);
        break;
      }
      case "⌫": {
        if (input) {
          input = input.substring(0, input.length - 1);
        }
        let display = '';
        let inputn = Number(input);
        const isZero = '0.'.includes(input[input.length - 1]);
        if (isZero && input.indexOf('.') != -1) {
          inputn = Number(input + '1');
          display = formatNumber(inputn);
          display = display.substring(0, display.length - 1);
        }
        else {
          display = formatNumber(inputn);
        }

        setDisplay(display);
        break;
      }
      case "%": {
        if (!input || input === "-") {
          return;
        }

        const numb = Number(input);
        if (isNaN(numb) || numb === 0) {
          return;
        }

        if (exps.length > 0) {
          const r = result();
          const formatted = `${r}×${tempDisplay}${formatNumber(parseFloat(input))}%`;
          const rExp: [string, number] = [formatted, eval(`(${temp + input}) * ${r}/100`)];
          exps.push(rExp);
          print(rExp[0], rExp[1]);
          setCheckIndex(exps.length);
          input = temp = tempDisplay = "";
          setOperator('+');
          setDisplay(formatNumber(result()));
        }
        else {
          const decimal = input.split('.')[1];
          if (decimal && (decimal.length + 2) > setting.maxDecimal) {
            return;
          }

          input = "" + fixFloat(parseFloat(input) / 100).toFixed(setting.maxDecimal).replace(/0+$/, '');
          setDisplay(formatNumber(Number(input)));
        }
        break;
      }
      case "÷": {
        if ((!input || input === "-") && temp.length <= 1) {
          return;
        }
        if (temp.length > 0 && temp[temp.length - 1] == "*") {
          tempDisplay = tempDisplay.substring(0, tempDisplay.length - 1) + value;
          temp = temp.substring(0, temp.length - 1) + "/";
        }
        if (input) {
          setDisplay(formatNumber(Number(input)));
          tempDisplay += formatNumber(Number(input)) + "÷";
          temp += input + "/";
        }

        input = "";
        setOperator(value);
        break;
      }
      case "×": {
        if ((!input || input === "-") && temp.length <= 1) {
          return;
        }
        if (temp.length > 0 && temp[temp.length - 1] == "/") {
          tempDisplay = tempDisplay.substring(0, tempDisplay.length - 1) + value;
          temp = temp.substring(0, temp.length - 1) + "*";
        }

        if (input) {
          setDisplay(formatNumber(Number(input)));
          tempDisplay += formatNumber(Number(input)) + "×";
          temp += input + "*";
        }

        input = "";
        setOperator(value);
        break;
      }
      case "±": {
        if (!input) return;
        if (input[0] !== '-') {
          input = "-" + input;
          setDisplay("−" + display);
        }
        else {
          input = input.substring(1);
          setDisplay(display.substring(1));
        }
        break;
      }
      case "−": {
        if (input && input !== "-") {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          const rExp: [string, number] = [formatted, eval(temp + input)];
          
          if (exps.length <= 0 && setting.deviceName) {
            printer?.printLine(setting.deviceName, {
              align: TextAlign.center
            });
            printer?.feed(15);
          }
          exps.push(rExp);
          print(rExp[0], rExp[1]);
          input = "";
          temp = '-';
          tempDisplay = "−";
          setDisplay(formatNumber(result()));
          setOperator(value);
        }
        else {
          if (temp == '-') {
            temp = tempDisplay = '';
          }

          input = "-";
          setDisplay("−");
          if (operator === '−') {
            setOperator('+');
          }
        }
        setCheckIndex(exps.length);
        break;
      }
      case "+": {
        if (input && input !== "-") {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          const rExp: [string, number] = [formatted, eval(temp + input)];
          
          if (exps.length <= 0 && setting.deviceName) {
            printer?.printLine(setting.deviceName, {
              align: TextAlign.center
            });
            printer?.feed(15);
          }
          exps.push(rExp);
          print(rExp[0], rExp[1]);
          input = "";
        }
        setCheckIndex(exps.length);
        temp = tempDisplay = "";
        setOperator(value);
        setDisplay(formatNumber(result()));
        break;
      }
      case "△": {
        if (exps.length === 0) return;

        let dIndex = checkIndex;
        if (dIndex === 0) {
          dIndex = exps.length - 1;
          setCheckIndex(dIndex);
        }
        else {
          dIndex--;
          setCheckIndex(dIndex);
        }
        let d = exps[dIndex][0];
        if (d[0] === "+") {
          d = d.substring(1);
        }
        input = "";
        setOperator("");
        setDisplay(d);
        break;
      }
      case "▽": {
        if (exps.length === 0) return;

        let dIndex = checkIndex;
        if (checkIndex >= exps.length - 1) {
          dIndex = 0;
          setCheckIndex(dIndex);
        }
        else {
          dIndex++;
          setCheckIndex(dIndex);
        }
        let d = exps[dIndex][0];
        if (d[0] === "+") {
          d = d.substring(1);
        }
        input = "";
        setOperator("");
        setDisplay(d);
        break;
      }
      case ".": {
        if (operator === "=") {
          exps.length = 0;
          setCheckIndex(exps.length);
          temp = tempDisplay = "";
          setOperator("");
        }
        if (input.indexOf(".") != -1) {
          return;
        }
        if (!input || input === "-") {
          value = "0" + value;
        }
        input += value;
        let display = formatNumber(Number(input + '1'));
        display = display.substring(0, display.length - 1);
        setDisplay(display);
        setShowAC(false);
        break;
      }
      case "CHECK": {
        openCheckView(o => !o);
        break;
      }
      case "⚙": {
        listenKeyboard = false;
        openSetting(o => !o);
        break;
      }
      // 0-9
      default: {
        if (operator === "=") {
          exps.length = 0;
          setCheckIndex(exps.length);
          temp = tempDisplay = "";
          setOperator("");
        }
        const isZero = value[0] === '0';
        const decimal = input.split('.')[1];
        if (decimal && (decimal.length + value.length + (isZero ? 1 : 0)) > setting.maxDecimal) {
          return;
        }

        input += value;
        let display = '';
        let inputn = Number(input);
        if (isZero && input.indexOf('.') != -1) {
          inputn = Number(input + '1');
          display = formatNumber(inputn);
          display = display.substring(0, display.length - 1);
        }
        else {
          display = formatNumber(inputn);
        }

        setDisplay(display);
        setShowAC(false);
        break;
      }
    }
  };
  clickRef.current = handleClick;
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName == "INPUT" || !listenKeyboard) {
      return;
    }

    let key = e.key;
    if (e.shiftKey) {
      switch (key) {
        case 'Backspace': {
          key = showAC ? 'AC' : 'CE';
          break;
        }
        case 'ArrowUp': {
          key = '⍐';
          break;
        }
      }
    }

    switch (key) {
      case '*': {
        key = '×';
        break;
      }
      case "/": {
        key = '÷';
        break;
      }
      case "-": {
        key = '−';
        break;
      }
      case 'Enter': {
        key = '=';
        break;
      }
      case 'Backspace': {
        key = '⌫';
        break;
      }
      case 'ArrowUp': {
        key = '△';
        break;
      }
      case 'ArrowDown': {
        key = '▽';
        break;
      }
    }

    if (buttons.includes(key)) {
      handleClick(key);
    }
  };
  const inputBatch = (tokens?: string) => {
    if (!tokens) return;

    for (let token of tokens) {
      switch (token) {
        case '*': {
          token = '×';
          break;
        }
        case "/": {
          token = '÷';
          break;
        }
        case "-": {
          token = '−';
          break;
        }
      }
      if ("0123456789.+−×÷%=".includes(token)) {
        clickRef.current(token);
      }
    }
  }
  const handlePaste = (e: ClipboardEvent) => {
    if ((e.target as HTMLElement)?.tagName == "INPUT") {
      return;
    }
    const pastedText = e.clipboardData?.getData("text");
    inputBatch(pastedText);
  };


  /*'△','▽','±', ' ', '00', '⚙' */
  const buttons = [
    '⎙', '⍐', 'CHECK', '☊',
    'AC', 'CE', '%', '÷', '⌫',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+',
    '0', '000', '.', '='
  ];

  useEffect(() => {
    inAudioCtxRef.current = new AudioContext();

    fetch('/assets/audio/click-in.mp3')
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => inAudioCtxRef.current!.decodeAudioData(arrayBuffer))
      .then((decoded) => {
        inBufferRef.current = decoded;
      });
  }, []);
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    divRef.current?.focus();
  }, []);

  const rHandlers = useLongPress({
    onClick: () => { },
    onHold: () => clickRef.current('⚙'),
    repeat: false,
    delay: 800,
  });

  return (
    <div
      ref={divRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{
        height: '100vh',
        display: 'flex',
        userSelect: 'none',
        touchAction: 'manipulation',
        overflow: 'hidden',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Display Area */}
      <div
        class='result-container'
        {...rHandlers}
        style={{
          padding: '1rem 1.5rem 1rem 1rem',
          fontSize: '2.5rem',
          minHeight: '4rem',
          lineHeight: '4rem',
          textAlign: 'right',
          overflow: "auto",
          backgroundColor: '#f0f0f0',
          position: 'relative',
          borderBottom: '1px solid #ccc',
        }}
      >
        <span>{display || '0'}</span>
        {operator && (
          <span
            style={{
              position: 'absolute',
              right: '0.25rem',
              top: '1rem',
              color: '#888',
              fontSize: '1.5rem',
            }}>
            {operator}
          </span>
        )}
      </div>
      <span
        style={{
          position: 'absolute',
          left: '4px',
          top: '4px',
          color: '#888',
          fontSize: '1rem',
          lineHeight: '1.2rem'
        }}>
        {checkIndex < exps.length && exps.length > 0 && (<span>{checkIndex + 1}/</span>)}{exps.length}
      </span>

      {/* Button Area */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: '0.5fr 0.5fr repeat(4, 1fr)',
          gridAutoRows: '1fr',
          gap: '1px',
          background: '#ccc',
        }}
      >
        {buttons.map((b, index) => {
          let show = true;
          let color = 'black';
          let gridRow = '';
          let isNumber = '0123456789.'.includes(b[0]);
          let fontSize = isNumber && b.length < 3 ? '2.5rem' : '2rem';
          let handlers = {
            onClick: () => handleClick(b)
          } as any;
          switch (b) {
            case 'AC': {
              color = 'red';
              show = showAC;
              fontSize = '1.5rem';
              break;
            }
            case 'CE': {
              show = !showAC;
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current('AC'),
                repeat: false,
                delay: 400,
                interval: 400,
              });
              break;
            }
            case '⎙': {
              fontSize = '1.5rem';
              if (printerStatus != "online") {
                color = 'red';
              }
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => {
                  if (printer) {
                    const d = printer;
                    printer = undefined;
                    d.disconnect();
                    setPrinterStatus('offline');
                  }
                  else {
                    requestPrinter();
                  }
                },
                repeat: false,
                delay: 1000
              });
              break;
            }
            case '⌫': {
              fontSize = '1.5rem';
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 100,
              });
              break;
            }
            case '⍐': {
              fontSize = '1.5rem';
              if (printerStatus != "online") {
                color = 'red';
              }
              handlers = useLongPress({
                onClick: () => handleClick(b),
                onHold: () => handleClick(b),
                repeat: true,
                delay: 400,
                interval: 100,
              });
              break;
            }
            case '▽': {
              fontSize = '1.5rem';
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 800,
              });
              break;
            }
            case '△': {
              fontSize = '1.5rem';
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 800,
              });
              break;
            }
            case 'CHECK': {
              fontSize = '1rem';
              //gridRow = 'span 2';
              break;
            }
            case '%': {
              fontSize = '1.5rem';
              break;
            }
            case '☊': {
              handlers = {
                onClick: async () => {
                  if (SpeechService.isListening) {
                    SpeechService.stop();
                    return;
                  }

                  try {
                    await SpeechService.requestPermission();
                    const rprom = SpeechService.recognize();
                    setTimeout(() => {
                      listenKeyboard = false;
                      setListening(true);
                    }, 100);
                    const result = await rprom;
                    if (!result) {
                      return;
                    }
                    console.log(result);
                    const calcCommand = CalcParser(result);
                    console.log(calcCommand);
                    if (input) {
                      clickRef.current("+");
                    }
                    inputBatch(calcCommand);
                  }
                  catch { }
                  finally {
                    listenKeyboard = true;
                    setListening(false);
                  }
                }
              }
              break;
            }
          }

          return (show && <button
            class="press-button"
            key={b}
            style={{
              fontSize: fontSize,
              gridColumn: gridRow,
              fontWeight: isNumber ? "bold" : "normal",
              padding: 0,
              border: 'none',
              color: color,
              height: '100%',
              width: '100%',
            }}
            {...handlers}
          >
            {b}
          </button>);
        })}
      </div>

      {/* Check Popup Area */}
      <BottomPopup isOpen={isCheckView} hideClose={true} contentStyle={{ height: 'calc(100vh - 6rem)', backgroundColor: '#f0f0f0', padding: '1rem 0' }} onClose={() => { openCheckView(false); }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1rem' }}>CHECK</h4>
        <div style={{ overflow: 'auto', height: 'calc(100% - 2rem)', padding: '0 1rem' }}>
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1.5rem 0.5rem',
              fontSize: '2rem',
              textAlign: 'right'
            }}>
            {exps.map((exp, i) => {
              const isMult = exp[0].indexOf("×") != -1 || exp[0].indexOf("÷") != -1;
              return (<>
                <div>
                  {exp[0]}
                  {isMult && (<span><br />={formatNumber(exp[1])}</span>)}
                </div>
                <div style={{
                  color: '#888',
                  fontSize: '1rem',
                  lineHeight: '2.2rem'
                }}>{i + 1}</div>
              </>)
            })}
          </div>
        </div>
      </BottomPopup>
      {/* setting Popup Area */}
      <SettingPopup isOpen={showSetting} onClose={(set) => {
        if (printer) {
          set.apply(printer);
        }
        setting = set;
        openSetting(false);
        debugger;
        listenKeyboard = true;
      }} />
      {/* Listening Popup */}
      <BottomPopup isOpen={isListening} hideClose={true} onClose={() => { listenKeyboard = true; SpeechService.stop(); }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1rem' }}>Listening</h4>
      </BottomPopup>
    </div>
  );
}