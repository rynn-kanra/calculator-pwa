import { useState, useEffect, useRef } from 'preact/hooks';
import { CalculatorConfig, Layout0 } from '../Model/CalculatorConfig';
import { PrinterConfig, PrinterType } from '../Model/PrinterConfig';
import { BluetoothPrinterService } from '../PrinterService/BluetoothPrinterService';
import { IminPrinterService } from '../PrinterService/IminPrinterService';
import { FontMode, IPrinterService, TextAlign, TextStyle } from '../PrinterService/IPrinterService';
import { LogPrinterService } from '../PrinterService/LogPrinterService';
import { SerialPrinterService } from '../PrinterService/SerialPrinterService';
import { CalcParser } from '../Services/MathLanguageParser';
import { GutenyeOCRService } from '../Services/OCR/GutenyeOCRService';
import { IOCRService } from '../Services/OCR/OCRService';
import ScreenService from '../Services/ScreenService';
import { SpeechService } from '../Services/SpeechService';
import '../styles/button.css';
import { DeepPartial } from '../Utility/DeepPartial';
import { useLongPress } from '../Utility/useLongPress';
import BottomPopup from './BottomPopup';
import { SettingPopup } from './SettingPopup';
import { USBPrinterService } from '../PrinterService/USBPrinterService';
import { CheckPopup } from './CheckPopup';
import AuthenticationService from '../Services/AuthenticationService';
import LocalDBService from '../Services/LocalDBService';
import { LocalStorageService } from '../Services/LocalStorageService';

const exps: [string, number][] = [];
let temp: string = "";
let tempDisplay: string = "";
let input: string = "";

let listenKeyboard = true;

const settingService = new LocalStorageService(CalculatorConfig, "setting");
const oldsetting = settingService.get();
if (oldsetting) {
  await LocalDBService.set("setting", oldsetting);
  settingService.delete();
}

let setting = await LocalDBService.get("setting");
let ocrService: IOCRService;
let imageInput: HTMLInputElement | undefined;
let speechService: SpeechService;
let printer: IPrinterService | undefined = new LogPrinterService(setting.defaultConfig);
printer.init();
setting.apply(printer);
(globalThis as any).printer = printer;
export function Calculator() {
  const [isOCRReady, setOCRReady] = useState(false);
  const [isCheckView, openCheckView] = useState(false);
  const [showSetting, openSetting] = useState(false);
  const [isListening, setListening] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const clickRef = useRef((a: string) => { });
  const inAudioCtxRef = useRef<AudioContext | null>(null);
  const inBufferRef = useRef<AudioBuffer | null>(null);
  const [printerStatus, setPrinterStatus] = useState('offline');
  const [showAC, setShowAC] = useState(true);
  const [operator, setOperator] = useState('');
  const [display, setDisplay] = useState('');
  const [checkIndex, setCheckIndex] = useState(-1);
  const [checkDatas, setCheckDatas] = useState<string[]>([]);
  const [isCheckData, showCheckData] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  /*'△','▽','±', ' ', '00', '⚙' */
  const buttons = [
    '⎙', '⍐', 'CHECK', '📷︎', // '☊',
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
    Promise.all(
      ocrService.depedencies.map(o => caches.match(o))
    ).then(os => os.every(p => !!p))
      .then(o => {
        setOCRReady(o);
        if (o) {
          ocrService.init();
        }
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
        case PrinterType.Imin_Build_In: {
          printerCtor = IminPrinterService;
          break;
        }
        case PrinterType.Bluetooth:
        default: {
          printerCtor = BluetoothPrinterService;
          break;
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
      if (printer) {
        printer.dispose();
      }
      printer = d;
      (globalThis as any).printer = printer;
      setPrinterStatus("online");
      return true;
    }
    catch (e) {
      console.log("ini printer:" + e);
    }

    return false;
  };

  const processImage = async (file: File) => {
    try {
      listenKeyboard = false;
      setProcessing(true);
      const text = await ocrService.recognize(file);
      console.log(text);

      const replaceMap = new Map<RegExp, string>([
        [/([0-9])[B&](?=[0-9])/g, '$18'],
        [/([0-9])[Gb](?=[0-9])/g, '$11'],
        [/([0-9])[iIl](?=[0-9])/g, '$11'],
        [/([0-9])[q](?=[0-9])/g, '$19'],
        [/([0-9])[oO](?=[0-9])/g, '$10'],
        [/([0-9])[S](?=[0-9])/ig, '$15'],
        [/([0-9])[Zz](?=[0-9])/g, '$12'],
        [/([0-9])(?=[86]*0[86]*)[860][860][860]$/g, '$1000'],
        [/([0-9][5])(?=[86]*0[86]*)[860][860]$/g, '$1500']
      ]);
      const replaceMap2 = new Map<RegExp, string>([
        [/([0-9]).?[-]$/g, '$1000'],
        [/[^0-9.,](?=.*[0-9]$)/g, ''],
        [/([^50])(?=00$)/g, '$10'],
      ]);
      let ds = text.split('\n').map(o => {
        const ix = o.lastIndexOf(' ');
        return ix === -1 ? o : o.substring(ix + 1);
      }).map(o => {
        for (const d of replaceMap) {
          o = o.replaceAll(d[0], d[1]);
        }
        if (o.length <= 7) {
          for (const d of replaceMap2) {
            o = o.replaceAll(d[0], d[1]);
          }
        }
        else if (o.search(/[^0-9. -]/) >= 0) {
          return "";
        }
        return o;
      });

      if (ds.some(o => o.length > 3)) {
        ds = ds.map(o => o.length > 3 ? o : "");
      }

      const d = ds.join(' ');

      console.log(d);
      const commands = CalcParser(d);
      console.log(commands);
      setCheckDatas(commands.split("+"));
      showCheckData(true);
    }
    catch (e) {
      alert(e);
    }
    finally {
      listenKeyboard = true;
      setProcessing(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if ([...buttons, action].indexOf('📷︎') !== -1) {
      ocrService = new GutenyeOCRService();
      checkOCRDepedencies();
    }
    if ([...buttons, action].indexOf('☊') !== -1) {
      speechService = new SpeechService();
    }

    if (setting.sound) {
      inAudioCtxRef.current = new AudioContext();
      fetch('assets/audio/click-in.mp3')
        .then((res) => res.arrayBuffer())
        .then((arrayBuffer) => inAudioCtxRef.current!.decodeAudioData(arrayBuffer))
        .then((decoded) => {
          inBufferRef.current = decoded;
        });
    }

    if (setting.defaultConfig.autoConnect) {
      (async () => {
        for (const id in setting.printerConfig) {
          const printerConfig = setting.printerConfig[id];
          if (printerConfig?.autoConnect != true) {
            continue;
          }
          const isConnected = await requestPrinter(id);
          if (isConnected) break;
        }
      })();
    }

    navigator.serviceWorker.ready.then(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'ready' });
      }
    });
    navigator.serviceWorker.addEventListener('message', (ev) => {
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
          case "SHARE": {
            processImage(ev.data.image as File);
            break;
          }
        }
      }
    });

    if (window.launchQueue) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files.length) {
          for (const handle of launchParams.files) {
            const file = await handle.getFile();
            processImage(file);
          }
        }
      });
    }

    if (action) {
      handleClick(action);
    }

    divRef.current?.focus();
  }, []);


  const addResult = function (text: string, num: number) {
    const exp: [string, number] = [text, num];
    exps.push(exp);
    print(exp);
  }
  const isMultExp = (text: string) => text.indexOf("×") != -1 || text.indexOf("÷") != -1;
  const print = (exp: [string, number]) => {
    const index = exps.indexOf(exp);
    if (index === 0) {
      if (setting.deviceName) {
        printer?.printLine(setting.deviceName, {
          align: TextAlign.center
        });
        printer?.feed(printer.option.fontSize * 0.5);
      }
    }

    let text = exp[0];
    const sum = exp[1];
    if (text[0] === "+") {
      text = text.substring(1);
    }
    const isMult = isMultExp(text);
    if (isMult && index > 0 && !isMultExp(exps[index - 1][0])) {
      printer?.feed(printer.option.fontSize * 0.5);
    }

    if (setting.printOperator) {
      printer?.printGrid({
        columns: [{
          width: 1
        }, {
          align: TextAlign.right
        }],
        gap: [0, 5]
      }, [[text, isMult ? '' : '+']]);
    }
    else {
      printer?.printLine(text);
    }

    if (isMult) {
      let multSumText = "=" + formatNumber(sum || 0);
      if (setting.printOperator) {
        printer?.printGrid({
          columns: [{
            width: 1
          }, {
            align: TextAlign.right
          }],
          gap: [0, 5]
        }, [[multSumText, '+']]);
      }
      else {
        printer?.printLine(multSumText);
      }

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
    if (setting.vibrate) {
      try {
        navigator.vibrate?.(30); // vibrate for 30 milliseconds
      } catch { }
    }

    if (setting.keepScreenAwake !== false) {
      ScreenService.keepScreenAwake();
    }

    if (setting.sound) {
      // play click sound
      const ctx = inAudioCtxRef.current;
      const buffer = inBufferRef.current;
      if (ctx && buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    }

    switch (value) {
      case "📷︎": {
        if (!imageInput) {
          imageInput = document.createElement("input") as HTMLInputElement;
          imageInput.type = 'file';
          imageInput.multiple = true;
          imageInput.accept = "image/*";
          imageInput.capture = "environment";
          imageInput.style.display = "none";
          document.body.appendChild(imageInput);
          imageInput.onchange = async () => {
            if (!imageInput!.files) return;

            const file = imageInput?.files[0];
            if (!file) return;

            processImage(file);
          };
        }

        imageInput.value = '';
        imageInput.click();
        break;
      }
      case '☊': {
        if (speechService.isListening) {
          speechService.stop();
          return;
        }

        speechService.requestPermission().then(async () => {
          try {
            const rprom = speechService.recognize();
            setTimeout(() => {
              listenKeyboard = false;
              setListening(true);
            }, 100);
            const result = await rprom;
            if (!result) {
              return;
            }
            console.log(result);
            const commands = CalcParser(result);
            console.log(commands);
            setCheckDatas(commands.split("+"));
            showCheckData(true);
          }
          catch (e) {
            alert(e);
          }
          finally {
            listenKeyboard = true;
            setListening(false);
          }
        });
        break;
      }
      case " ": {
        break;
      }
      case "⎙": {
        if (!printer || printer instanceof LogPrinterService) {
          requestPrinter();
          return;
        }

        let result = 0;
        for (const exp of exps) {
          print(exp);
          result += exp[1];
        }
        printer?.printSeparator("-");
        let resultText = formatNumber(result);
        if (setting.printOperator) {
          printer.printGrid({
            columns: [{
              width: 1,
              font: { fontStyle: FontMode.bold }
            }, {
              align: TextAlign.right,
              font: { fontStyle: FontMode.bold }
            }],
            gap: [0, 5]
          }, [[resultText, '∗']]);
        }
        else {
          printer?.printLine(resultText, { font: { fontStyle: FontMode.bold } });
        }
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
          printer?.printSeparator("-");
          let resultText = formatNumber(resultNumb);
          if (setting.printOperator) {
            printer?.printGrid({
              columns: [{
                width: 1,
                font: { fontStyle: FontMode.bold }
              }, {
                align: TextAlign.right,
                font: { fontStyle: FontMode.bold }
              }],
              gap: [0, 5]
            }, [[resultText, '∗']]);
          }
          else {
            printer?.printLine(resultText, { font: { fontStyle: FontMode.bold } });
          }
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
        const fn = () => {
          listenKeyboard = false;
          openSetting(o => !o);
        };
        if (setting.lockSetting) {
          AuthenticationService.authenticate().then(o => {
            if (o) {
              fn();
            }
          });
        }
        else {
          fn();
        }
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
        fontFamily: 'sans-serif',
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
          switch (b) {
            case 'AC': {
              color = 'red';
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
            case '%':
            case '±': {
              fontSize = '1.5rem';
              break;
            }
            case '📷︎': {
              disabled = !isOCRReady;
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
            }}
            {...handlers}
          >
            {b}
          </button>);
        })}
      </div>

      {/* Check Popup */}
      <CheckPopup isOpen={isCheckData} onCancel={() => showCheckData(false)} onOK={(inputs) => { showCheckData(false); inputBatch(inputs.join('+') + '+') }} datas={checkDatas} />
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
      {/* setting Popup Area */}
      <SettingPopup isOpen={showSetting} isOCRReady={isOCRReady} ocr={ocrService} onClose={(set) => {
        if (printer) {
          set.apply(printer);
        }
        setting = set;
        openSetting(false);
        listenKeyboard = true;
      }} />
      {/* Listening Popup */}
      <BottomPopup isOpen={isListening} hideClose={true} onClose={() => { listenKeyboard = true; speechService.stop(); }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1rem' }}>Listening</h4>
      </BottomPopup>
      {/* Processing Popup */}
      <BottomPopup isOpen={isProcessing} hideClose={true}>
        <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1rem' }}>Processing</h4>
      </BottomPopup>
    </div>
  );
}