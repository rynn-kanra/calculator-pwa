import { useState, useEffect } from 'preact/hooks';
import IminPrinter from "../lib/imin-printer.esm.browser";
import { printerConfig } from "../config";

const exps: [string, number][] = [];
let temp: string = "";
let tempDisplay: string = "";
let input: string = "";
function isNumber(c: string) {
  return "1234567890".indexOf(c) > -1;
}

type iminPrinter = {
  reconnect: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  initPrinter: () => void;
  printAndLineFeed: () => void;
  printAndFeedPaper: (height: number) => void;
  getPrinterStatus: () => Promise<{ value: number }>;
  printText: (str: string, type?: number) => void;
  printColumnsText: (colTextArr: string[], colWidthArr: number[], colAlign: number[], fontSize: number[], width: number) => void;
  setTextSize: (size?: number) => void;
  setTextTypeface: (size?: number) => void;
  setTextStyle: (size?: number) => void;
  setTextWidth: (size?: number) => void;
  ws?: any;
} | null;

let printer: iminPrinter = null;
export function Calculator() {
  const [printerStatus, setPrinterStatus] = useState('offline');
  const [operator, setOperator] = useState('');
  const [display, setDisplay] = useState('');
  const [checkIndex, setCheckIndex] = useState(-1);

  const print = (text: string, sum?: number) => {
    if (text[0] === "+") {
      text = text.substring(1);
    }
    const isMult = text.indexOf("×") != -1 || text.indexOf("÷") != -1;
    if (isMult) {
      printer?.printAndFeedPaper(printerConfig.fontSize * 0.5);
    }
    if (!printer) {
      console.log(text);
    }
    else {
      printer.printText(text, printerConfig.alignment);
    }
    if (isMult) {
      print("=" + formatNumber(sum || 0));
      printer?.printAndFeedPaper(printerConfig.fontSize * 0.5);
    }
  }
  const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  const formatNumber = (number: number) => {
    return numberFormat.format(number);
  }
  const result = () => {
    let result = 0;
    for (const d of exps) {
      result += d[1];
    }
    return result;
  };
  const handleClick = (value: string) => {
    switch (value) {
      case "⎙": {
        let result = 0;
        for (const exp of exps) {
          print(exp[0], exp[1]);
          result += exp[1];
        }
        printer?.setTextSize(20);
        print("-".repeat(32));
        printer?.setTextSize(printerConfig.fontSize);
        print(formatNumber(result));
        break;
      }
      case "⍐": {
        if (printer) {
          printer.printAndLineFeed();
        }
        break;
      }
      case "C": {
        input = "";
        setDisplay(formatNumber(Number(input)));
        break;
      }
      case "CA": {
        temp = tempDisplay = input = "";
        setDisplay(formatNumber(Number(input)));
        exps.length = 0;
        setCheckIndex(exps.length);
        setOperator("");
        break;
      }
      case "=": {
        if (input) {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          exps.push([formatted, eval(temp + input)]);
          setCheckIndex(exps.length);
          print(formatted, eval(temp + input));
          temp = tempDisplay = input = "";
        }
        setOperator(value);
        const resultNumb = result();
        setDisplay(formatNumber(resultNumb));

        if (exps.length > 0) {
          temp = tempDisplay = input = "";
          printer?.setTextSize(20);
          print("-".repeat(32));
          printer?.setTextSize(printerConfig.fontSize);
          print(formatNumber(resultNumb));
        }
        break;
      }
      case "⌫": {
        if (input) {
          input = input.substring(0, input.length - 1);
        }
        setDisplay(formatNumber(Number(input)));
        break;
      }
      case "÷": {
        if (!input && temp.length <= 1) {
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
        if (!input && temp.length <= 1) {
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
      case "−": {
        if (input) {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          const rExp: [string, number] = [formatted, eval(temp + input)];
          exps.push(rExp);
          print(rExp[0], rExp[1]);
          input = "";
          temp = tempDisplay = "-";
          setDisplay(formatNumber(result()));
        }
        else {
          input = "-";
          setDisplay("-0");
        }
        setCheckIndex(exps.length);
        setOperator(value);
        break;
      }
      case "+": {
        if (input) {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          const rExp: [string, number] = [formatted, eval(temp + input)];
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

      // 0-9
      default: {
        if (operator === "=") {
          exps.length = 0;
          setCheckIndex(exps.length);
          temp = tempDisplay = "";
          setOperator("");
        }
        input += value;
        setDisplay(formatNumber(Number(input)));
        break;
      }
    }
  };

  const buttons = [
    '⎙', '⍐', '△', '▽',
    'CA', 'C', '⌫', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+',
    '0', '000', '.', '='
  ];

  useEffect(() => {
    
    const iminPrinter: iminPrinter = new IminPrinter();
    iminPrinter?.connect().then(async (isConnect) => {
      debugger;
      let reconnectNum = 0;
      let initNum = 0;
      if (isConnect) {
        iminPrinter.initPrinter();
        const checkStatus = setInterval(async () => {
          const status = await iminPrinter.getPrinterStatus();
          if (status.value === 0) {
            clearInterval(checkStatus);
            iminPrinter.setTextSize(printerConfig.fontSize);
            iminPrinter.setTextTypeface(printerConfig.fontFace);
            iminPrinter.setTextStyle(printerConfig.fontStyle);
            iminPrinter.setTextWidth(printerConfig.width);
            printer = iminPrinter;
            setPrinterStatus("online");
          }
          else if (status.value < 0) {
            reconnectNum++;
            if (reconnectNum > 3) {
              initNum++;
              if (initNum > 3) {
                clearInterval(checkStatus);
                return;
              }
              reconnectNum = 0;
              iminPrinter.initPrinter();
            }
          }
          else {
            clearInterval(checkStatus);
            alert(JSON.stringify(status));
          }
        }, 2000);
      } else {
        alert("Error, The print service cannot be connected");
      }
    }).catch((error) => {
      debugger;
      alert(error);
    });
    if (iminPrinter?.ws) {
      const onOpen = iminPrinter.ws.onopen;
      iminPrinter.ws.onopen = () => {
        onOpen();
        iminPrinter.ws.onclose = iminPrinter.ws.onerror = () => {
          iminPrinter?.reconnect();
        };
      };
      iminPrinter.ws.onclose = iminPrinter.ws.onerror = (event) => {
        console.log(event);
      };
    }
  }, []);

  return (
    <div
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
        style={{
          padding: '1rem 1.5rem 1rem 1rem',
          fontSize: '2.5rem',
          minHeight: '4rem',
          lineHeight: '4rem',
          textAlign: 'right',
          backgroundColor: '#f0f0f0',
          position: 'relative',
          borderBottom: '1px solid #ccc',
        }}
      >
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
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: '0.5fr repeat(4, 1fr)',
          gridAutoRows: '1fr',
          gap: '1px',
          background: '#ccc',
        }}
      >
        {buttons.map((b) => {
          let isDisabled = false;
          if (b === '⎙' || b === '⍐') {
            if (printerStatus != "online") {
              isDisabled = true;
            }
          }
          return (<button
            key={b}
            disabled={isDisabled}
            style={{
              fontSize: b.length == 1 && !isNaN(parseInt(b)) ? '2.5rem' : '2rem',
              fontWeight: isNumber(b[0]) ? "bold" : "normal",
              padding: 0,
              border: 'none',
              background: '#fff',
              color: isDisabled ? 'red' : 'black',
              height: '100%',
              width: '100%',
            }}
            onClick={() => handleClick(b)}
          >
            {b}
          </button>);
        })}
      </div>
    </div>
  );
}