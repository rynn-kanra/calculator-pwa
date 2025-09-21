import { useState, useEffect, useRef } from 'preact/hooks';
import { Layout0 } from '../Model/CalculatorConfig';
import { PrinterConfig, PrinterType } from '../Model/PrinterConfig';
import { BluetoothPrinterService } from '../PrinterService/BluetoothPrinterService';
import { IminPrinterService } from '../PrinterService/IminPrinterService';
import { FontMode, IPrinterService, TextAlign, TextStyle } from '../PrinterService/IPrinterService';
import { LogPrinterService } from '../PrinterService/LogPrinterService';
import { SerialPrinterService } from '../PrinterService/SerialPrinterService';
import { WebSocketPrinterService } from '../PrinterService/WebSocketPrinterService';
import { GutenyeOCRService } from '../Services/OCR/GutenyeOCRService';
import { IOCRService } from '../Services/OCR/OCRService';
import { DeepPartial } from '../Utility/DeepPartial';
import { useLongPress } from '../Utility/useLongPress';
import BottomPopup from './BottomPopup';
import { USBPrinterService } from '../PrinterService/USBPrinterService';
import { route } from 'preact-router';
import { ArchiveRestore, Camera, Delete, Printer, PrinterCheck, ReceiptText } from 'lucide-preact';
import type { JSX } from 'preact/jsx-runtime';
import { useSetting } from './SettingContext';
import shared from "../Services/Shared";
import ScreenService from '../Services/ScreenService';

const exps: [string, number][] = [];
let temp: string = "";
let tempDisplay: string = "";
let input: string = "";

let listenKeyboard = true;

let ocrService: IOCRService;
shared.printer = undefined;
export default function Calculator() {
  const [setting, setSetting, hapticFeedback] = useSetting();
  const [isOCRReady, setOCRReady] = useState(false);
  const [isCheckView, openCheckView] = useState(false);
  const clickRef = useRef((a: string) => { });
  const [printerStatus, setPrinterStatus] = useState<'offline' | 'online' | 'inactive'>(shared.printer ? 'online' : 'offline');
  const [showAC, setShowAC] = useState(true);
  const [operator, setOperator] = useState('');
  const [display, setDisplay] = useState('');
  const [checkIndex, setCheckIndex] = useState(-1);
  const divRef = useRef<HTMLDivElement>(null);

  /*'△','▽','±', ' ', '00', '⚙', '⍐','☊', '📷︎' */
  const buttons = [
    '⎙', 'REPRINT', 'CHECK', '📷︎',
    'AC', 'CE', '%', '÷', '⌫',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+'
  ];
  switch (setting.layout0) {
    case Layout0.mode2: {
      buttons.push(...['0', '00', '.', '=']);
      break;
    }
    case Layout0.mode3: {
      buttons.push(...['0', '00', '000', '=']);
      break;
    }
    default: {
      buttons.push(...['0', '000', '.', '=']);
      break;
    }
  }

  const checkOCRDepedencies = () => {
    if (!ocrService) {
      ocrService = new GutenyeOCRService();
    }

    Promise.all(
      ocrService.depedencies.map(o => caches.match(o))
    ).then(os => os.every(p => !!p))
      .then(o => {
        setOCRReady(o);
      });
  };

  const requestPrinter = async (id?: string) => {
    try {
      const printerConfig = setting.printerConfig[id ?? ""] ?? setting.defaultConfig;
      let printerCtor: (new (option?: DeepPartial<PrinterConfig>, style?: DeepPartial<TextStyle>) => IPrinterService);
      switch (printerConfig.printerType) {
        case PrinterType.Serial: {
          printerCtor = SerialPrinterService;
          break;
        }
        case PrinterType.USB: {
          printerCtor = USBPrinterService;
          break;
        }
        case PrinterType.WebSocket: {
          printerCtor = WebSocketPrinterService;
          break;
        }
        case PrinterType.Imin_Build_In: {
          printerCtor = IminPrinterService;
          break;
        }
        case PrinterType.Bluetooth: {
          printerCtor = BluetoothPrinterService;
          break;
        }
        case PrinterType.Debug:
        default: {
          printerCtor = LogPrinterService;
        }
      }
      const d = new printerCtor(printerConfig, {
        align: setting.align,
        font: {
          size: printerConfig.fontSize,
          fontFaceType: printerConfig.fontFace
        }
      });

      await d.init(id);
      setting.apply(d);
      setSetting(setting);
      if (shared.printer) {
        shared.printer.dispose();
      }
      shared.printer = d;
      (globalThis as any).printer = shared.printer;
      setPrinterStatus("online");
      return true;
    }
    catch (e) {
      console.log("ini printer:" + e);
    }

    return false;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    if (buttons.indexOf('📷︎') !== -1) {
      checkOCRDepedencies();
    }

    const messageHandler = (ev: MessageEvent) => {
      if (ev.data) {
        switch (ev.data.type) {
          case "DOWNLOAD": {
            if (ev.data.status) {
              switch (ev.data.id) {
                case "ocr":
                case "onnx": {
                  checkOCRDepedencies();
                  break;
                }
              }
            }
            break;
          }
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', messageHandler);

    setTimeout(() => {
      const data = params.get('data');
      if (data) {
        inputBatch(data);
      }
      else if (exps.length > 0) {
        inputBatch("+");
      }
    }, 100);

    divRef.current?.focus();
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, []);
  useEffect(() => {
    if (!setting || buttons.indexOf('⎙') === -1)
      return;

    if (!shared.printer) {
      if (setting.defaultConfig.autoConnect) {
        (async () => {
          const configs = Object.keys(setting.printerConfig)
            .map(o => ({
              id: o,
              config: setting.printerConfig[o]
            }))
            .filter(o => o.config?.autoConnect === true)
            .sort((a, b) => (b.config.printerType === setting.defaultConfig.printerType ? 1 : 0) - (a.config.printerType === setting.defaultConfig.printerType ? 1 : 0));
          for (const config of configs) {
            const isConnected = await requestPrinter(config.id);
            if (isConnected) break;
          }
        })();
      }
    }
    else {
      setting.apply(shared.printer);
    }

    if (setting.keepScreenAwake !== false) {
      ScreenService.wakeLock();
    }
    else {
      ScreenService.releaseWakeLock();
    }

    return () => {
      ScreenService.releaseWakeLock();
    };
  }, [setting]);

  const addResult = function (text: string, num: number) {
    const exp: [string, number] = [text, num];
    exps.push(exp);
    print(exp);
  }
  const isMultExp = (text: string) => text.indexOf("×") != -1 || text.indexOf("÷") != -1;
  const print = (exp: [string, number]) => {
    if (printerStatus !== "online") {
      return;
    }

    const index = exps.indexOf(exp);
    if (index === 0) {
      if (setting.deviceName) {
        shared.printer?.printLine(setting.deviceName, {
          align: TextAlign.center
        });
        shared.printer?.feed(shared.printer.option.fontSize * 0.5);
      }
    }

    let text = exp[0];
    const sum = exp[1];
    if (text[0] === "+") {
      text = text.substring(1);
    }
    const isMult = isMultExp(text);
    if (isMult && index > 0 && !isMultExp(exps[index - 1][0])) {
      shared.printer?.feed(shared.printer.option.fontSize * 0.5);
    }

    if (setting.printOperator) {
      shared.printer?.printGrid([[text, isMult ? '' : '+']], {
        columns: [{
          width: 1
        }, {
          align: TextAlign.right
        }],
        gap: [0, 5]
      });
    }
    else {
      shared.printer?.printLine(text);
    }

    if (isMult) {
      let multSumText = "=" + formatNumber(sum || 0);
      if (setting.printOperator) {
        shared.printer?.printGrid([[multSumText, '+']], {
          columns: [{
            width: 1
          }, {
            align: TextAlign.right
          }],
          gap: [0, 5]
        });
      }
      else {
        shared.printer?.printLine(multSumText);
      }

      shared.printer?.feed(shared.printer.option.fontSize * 0.5);
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
    hapticFeedback();

    switch (value) {
      case "📷︎": {
        document.startViewTransition(() => route("/ocr"));
        break;
      }
      case '☊': {
        document.startViewTransition(() => route("/asr"));
      }
      case " ": {
        break;
      }
      case "⎙": {
        switch (printerStatus) {
          case "offline": {
            requestPrinter();
            break;
          }
          case "inactive": {
            setPrinterStatus("online");
            break;
          }
          case "online": {
            setPrinterStatus("inactive");
            break;
          }
        }
        break;
      }
      case 'REPRINT': {
        if (printerStatus !== "online" || exps.length <= 0) {
          return;
        }

        let result = 0;
        for (const exp of exps) {
          print(exp);
          result += exp[1];
        }
        shared.printer?.printSeparator("-");
        let resultText = formatNumber(result);
        if (setting.printOperator) {
          shared.printer?.printGrid([[resultText, '∗']], {
            columns: [{
              width: 1,
              font: { fontStyle: FontMode.bold }
            }, {
              align: TextAlign.right,
              font: { fontStyle: FontMode.bold }
            }],
            gap: [0, 5]
          });
        }
        else {
          shared.printer?.printLine(resultText, { font: { fontStyle: FontMode.bold } });
        }
        shared.printer?.lineFeed(1);
        shared.printer?.printSeparator("=");
        shared.printer?.lineFeed(1);
        if (shared.printer?.option.sharePrinter) {
          shared.printer?.pause();
        }
        break;
      }
      case "⍐": {
        if (printerStatus !== "online") {
          return;
        }

        if (shared.printer) {
          shared.printer?.lineFeed();
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
        if (printerStatus === "online" && shared.printer?.option.sharePrinter) {
          shared.printer?.pause();
        }
        break;
      }
      case "=": {
        let ncheckIndex = checkIndex;
        if (input && input !== "-") {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          addResult(formatted, eval(temp + input));
          ncheckIndex = exps.length;
          temp = tempDisplay = input = "";
        }
        setOperator(value);
        const resultNumb = result();
        setDisplay(formatNumber(resultNumb));

        if (ncheckIndex >= exps.length && exps.length > 0) {
          temp = tempDisplay = input = "";
          if (printerStatus === "online") {
            shared.printer?.printSeparator("-");
            let resultText = formatNumber(resultNumb);
            if (setting.printOperator) {
              shared.printer?.printGrid([[resultText, '∗']], {
                columns: [{
                  width: 1,
                  font: { fontStyle: FontMode.bold }
                }, {
                  align: TextAlign.right,
                  font: { fontStyle: FontMode.bold }
                }],
                gap: [0, 5]
              });
            }
            else {
              shared.printer?.printLine(resultText, { font: { fontStyle: FontMode.bold } });
            }
            shared.printer?.printSeparator("=");
            shared.printer?.lineFeed(1);
            if (shared.printer?.option.sharePrinter) {
              shared.printer?.pause();
            }
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
        if (input === "-") {
          input = '';
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

        if (!input) {
          setTimeout(() => { setShowAC(true); }, 100);
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
          addResult(formatted, eval(`(${temp + input}) * ${r}/100`));
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
        if (temp === '-') {
          temp = tempDisplay = '';
          setOperator('+');
        }
        else if (input[0] !== '-') {
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
          addResult(formatted, eval(temp + input));
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
          addResult(formatted, eval(temp + input));
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
        openCheckView(true);
        break;
      }
      case "⚙": {
        hapticFeedback();
        document.startViewTransition(() => route('/setting'));
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
        if (isZero && (!input || input === "-")) {
          input = "";
          setDisplay("");
          setShowAC(false);
          return;
        }

        const numbParts = input.split('.');
        const isDecimal = input.indexOf('.') != -1;
        if (isDecimal) {
          if ((numbParts[1].length + value.length + (isZero ? 1 : 0)) > setting.maxDecimal) {
            return;
          }
        }
        else {
          if ((numbParts[0].length + value.length) > setting.maxDigit) {
            return;
          }
        }
        input += value;
        let display = '';
        let inputn = Number(input);
        if (isZero && isDecimal) {
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

  useEffect(() => {
    const container = divRef.current?.querySelector(".result-container") as HTMLElement;
    if (container && container.scrollWidth > container.clientWidth) {
      container.scrollLeft = container.scrollWidth;
    }
  }, [display]);

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
        height: '100dvh',
        display: 'flex',
        userSelect: 'none',
        touchAction: 'manipulation',
        overflow: 'hidden',
        flexDirection: 'column',
        viewTransitionName: "view-scale"
      }}
    >
      {/* Display Area */}
      <div {...rHandlers}
        style={{
          fontSize: '2.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1.5rem',
          minHeight: '4rem',
          lineHeight: '4rem',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #ccc',
        }}
      >
        <div class='result-container' style={{
          textAlign: 'right',
          overflow: "auto",
          padding: '1rem 0 1rem 1rem',
        }}>
          {display || '0'}
        </div>
        <div style={{
          textAlign: "center",
          color: '#888',
          fontSize: '1.5rem',
          lineHeight: '4'
        }}>
          {operator}
        </div>
      </div>
      <span
        style={{
          position: 'absolute',
          left: '4px',
          top: '4px',
          color: '#888',
          fontSize: '1rem'
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
          let disabled = false;
          let color = 'black';
          let gridRow = '';
          let isNumber = '0123456789.'.includes(b[0]);
          let fontSize = isNumber && b.length < 3 ? '2.5rem' : '2rem';
          let handlers = {
            onClick: () => clickRef.current(b)
          } as any;
          let icon: string | JSX.Element = b;
          switch (b) {
            case 'AC': {
              color = '#f44336';
              show = showAC;
              fontSize = '1.5rem';
              break;
            }
            case 'CE': {
              show = !showAC;
              fontSize = '1.5rem';
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
              switch (printerStatus) {
                case "inactive": {
                  icon = (<PrinterCheck />);
                  break;
                }
                case "offline": {
                  icon = (<Printer />);
                  color = '#f44336';
                  break;
                }
                case "online": {
                  icon = (<PrinterCheck />);
                  color = '#4caf50';
                  break;
                }
              }

              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => {
                  hapticFeedback();
                  if (shared.printer) {
                    const d = shared.printer;
                    shared.printer = undefined;
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
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 100,
              });
              icon = (<Delete />);
              break;
            }
            case 'REPRINT': {
              if (printerStatus == "offline") {
                color = '#f44336';
              }
              icon = (<ReceiptText />);
              break;
            }
            case '⍐': {
              if (printerStatus == "offline") {
                color = '#f44336';
              }
              handlers = useLongPress({
                onClick: () => handleClick(b),
                onHold: () => handleClick(b),
                repeat: true,
                delay: 400,
                interval: 100,
              });
              icon = (<ArchiveRestore />);
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
            case '%':
            case '±': {
              fontSize = '1.5rem';
              break;
            }
            case '📷︎': {
              disabled = !isOCRReady;
              icon = (<Camera />);
              break;
            }
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 100,
              });
              break;
            }
          }

          return (show && <button
            class="press-button"
            key={b}
            disabled={disabled}
            style={{
              fontSize: fontSize,
              gridColumn: gridRow,
              fontWeight: isNumber ? "bold" : "normal",
              padding: 0,
              border: 'none',
              color: color,
              height: '100%',
              width: '100%',
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            {...handlers}
          >
            {icon}
          </button>);
        })}
      </div>

      {/* Check Popup Area */}
      <BottomPopup isOpen={isCheckView} hideClose={true} contentStyle={{ height: 'calc(100dvh - 6rem)', backgroundColor: '#f0f0f0', padding: '1rem 0' }} onClose={() => { openCheckView(false); }}>
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
    </div>
  );
};