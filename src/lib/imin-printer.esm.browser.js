/*!
  * imin-printer v1.4.0
  * (c) 2022 archiesong
  * @license MIT
  */
let _Vue;
const install = (Vue) => {
  if (install.installed && _Vue === Vue) return
  install.installed = true;
  _Vue = Vue;

  const isDef = (v) => v !== void 0;
  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode;
    if (
      isDef(i) &&
      isDef((i = i.data)) &&
      isDef((i = i.registerPrinterInstance))
    ) {
      i(vm, callVal);
    }
  };
  Vue.mixin({
    beforeCreate() {
      if (!this.print) this.print = {};
      if (isDef(this.$options.printer)) {
        this._printerRoot = this;
        this._printer = this.$options.printer;
      } else {
        this._printerRoot = (this.$parent && this.$parent._printerRoot) || this;
      }
      registerInstance(this, this);
    },
    destroyed() {
      registerInstance(this, void 0);
    },
  });
  Object.defineProperty(Vue.prototype, '$printer', {
    get () {
      return this._printerRoot._printer
    }
  });
};

/*  */
function assert (condition, message) {
  if (!condition) {
    throw new Error(`[imin-printer] ${message}`)
  }
}

function warn (condition, message) {
  if (!condition) {
    typeof console !== void 0 && console.warn(`[imin-printer] ${message}`);
  }
}

var PrinterType;
(function (PrinterType) {
    PrinterType["USB"] = "USB";
    PrinterType["SPI"] = "SPI";
    PrinterType["Bluetooth"] = "Bluetooth";
})(PrinterType || (PrinterType = {}));
var PrinterStatus;
(function (PrinterStatus) {
    PrinterStatus["NORMAL"] = "0";
    PrinterStatus["OPEN"] = "3";
    PrinterStatus["NOPAPERFEED"] = "7";
    PrinterStatus["PAPERRUNNINGOUT"] = "8";
    PrinterStatus["NOTCONNECTED"] = "-1";
    PrinterStatus["NOTPOWEREDON"] = "1";
    PrinterStatus["OTHERERRORS"] = "99";
})(PrinterStatus || (PrinterStatus = {}));
var TCPConnectProtocol;
(function (TCPConnectProtocol) {
    TCPConnectProtocol["WEBSOCKET_WS"] = "ws://";
    TCPConnectProtocol["WEBSOCKET_WSS"] = "wss://";
    TCPConnectProtocol["HTTP"] = "http://";
    TCPConnectProtocol["HTTPS"] = "https://";
})(TCPConnectProtocol || (TCPConnectProtocol = {}));
var TCPConnectPrefix;
(function (TCPConnectPrefix) {
    TCPConnectPrefix["WEBSOCKET"] = "/websocket";
    TCPConnectPrefix["HTTP"] = "/upload";
})(TCPConnectPrefix || (TCPConnectPrefix = {}));

/*  */
const stringify = (value) => {
  return JSON.stringify(value)
};
const parse = (value) => {
  return JSON.parse(value)
};

const dataURItoBlob = (base64Data) => {
  let byteString = '';
  if (base64Data.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(base64Data.split(',')[1]);
  else byteString = decodeURIComponent(base64Data.split(',')[1]);
  const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {
    type: mimeString,
  })
};

const compressImg = (source, mime) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const originWidth = source.width;
  const originHeight = source.height;
  canvas.width = originWidth;
  canvas.height = originHeight;
  context.clearRect(0, 0, originWidth, originHeight);
  context.drawImage(source, 0, 0, originWidth, originHeight);
  return canvas.toDataURL(mime || 'image/png')
};

const getPrinterStatusText = (key) => {
  switch (key.toString()) {
    case '0':
      return 'The printer is normal'
    case '3':
      return 'Print head open'
    case '7':
      return 'No Paper Feed'
    case '8':
      return 'Paper Running Out'
    case '99':
      return 'Other errors'
    default:
      return 'The printer is not connected or powered on'
  }
};

/*  */
const inBrowser = typeof window !== 'undefined';

/*  */
class PrinterWebSocket {
   // websocket链接IP地址
   // 回调函数
   // websocket链接TCP协议
   // websocket链接地址前缀
   // websocket端口
   // 心跳时间
   // 检查链接状态时间
   // 重连时间
   // websocket实例化对象
   // 心跳定时器
   // 检查链接定时器
   // 重连定时器
  
  constructor(address) {
    this.address = address || '127.0.0.1';
    this.port = 8081;
    this.protocol = TCPConnectProtocol.WEBSOCKET_WS;
    this.prefix = TCPConnectPrefix.WEBSOCKET;
    this.isLock = false;
    this.heart_time = 3000;
    this.check_time = 3000;
    this.lock_time = 4000;
    this.callback = () => {
    };
  }
  connect() {
    return new Promise((resolve, reject) => {
      const Socket = window.MozWebSocket || window.WebSocket;
      if (!Socket) reject(assert(Socket, 'Browser does not support Websocket!'));
      try {
        const ws = new Socket(
          `${this.protocol}${this.address}:${this.port}${this.prefix}`
        );
        /* eslint-disable */
        ws.onopen = (e) => {
          this.heartCheck();
          if (ws.readyState === ws.OPEN) {
            resolve(true);
          } else {
            reject();
          }
        };
        ws.onclose = (e) => {
          this.reconnect();
        };
        ws.onerror = () => {
          this.reconnect();
        };
        ws.onmessage = (e) => {
          if (
            e.data === 'request' || (typeof e.data !== 'string' &&
            parse(e.data) &&
            parse(e.data).data &&
            parse(e.data).data.text === 'ping')
          ) {
            this.heartCheck();
          } else {
            this.callback(parse(e.data));
          }
        };
        this.ws = ws;
      } catch (error) {
        this.reconnect();
        reject(error);
      }
    })
  }
  sendParameter(
    text,
    type,
    value,
    object
  ) {
    return stringify({
      data: Object.assign(
        {},
        {
          text: text !== undefined ? text : '',
          value: value !== undefined ? value : -1,
        },
        object ? object : {}
      ),
      type: type !== undefined ? type : 0,
    })
  }
  heartCheck() {
    this.h_timer && clearTimeout(this.h_timer);
    this.c_timer && clearTimeout(this.c_timer);
    this.h_timer = setTimeout(() => {
      this.send(this.sendParameter('ping'));
      this.c_timer = setTimeout(() => {
        if (this.ws.readyState !== 1) {
          this.close();
        }
      }, this.check_time);
    }, this.heart_time);
  }
  reconnect() {
    if (this.isLock) return
    this.isLock = true;
    this.l_timer && clearTimeout(this.l_timer);
    this.l_timer = setTimeout(() => {
      this.connect();
      this.isLock = false;
    }, this.lock_time);
  }
  send(message) {
    this.ws.send(message);
  }
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/*  */
class IminPrinter extends PrinterWebSocket {
  
  
   // 打印机类型
   // 是否自动连接
  constructor(url) {
    {
      warn(
        `Printer must be called with the new operator.`
      );
    }
    super(url);
    IminPrinter.connect_type = PrinterType.SPI;
  }
  /**
   * Initialize the printer
   * @param {string} connectType   example: USB | SPI | Bluetooth
   */
  initPrinter(
    connectType = PrinterType.SPI
  ) {
    this.connect_type = connectType;
    this.send(this.sendParameter(connectType, 1));
  }
  /**
   * Get printer status
   * @param { string  } connectType  example: USB | SPI | Bluetooth
   */
  getPrinterStatus(connectType = PrinterType.SPI) {
    return new Promise((resolve) => {
      this.connect_type = connectType;
      this.send(this.sendParameter(connectType, 2));
      this.callback = (data) => {
        if (data.type === 2) {
          resolve(
            Object.assign({}, data.data, {
              text: getPrinterStatusText(data.data.value),
            })
          );
        }
      };
    })
  }
  /**
   * Print and feed paper
   */
  printAndLineFeed() {
    this.send(this.sendParameter('', 3));
  }
  /**
   * Print blank lines
   * @param {number} height  example: 0-255
   */
  printAndFeedPaper(height) {
    this.send(
      this.sendParameter('', 4, height <= 0 ? 0 : height >= 255 ? 255 : height)
    );
  }
  /**
   * Cutter (paper cutting) correlation
   */
  partialCut() {
    this.send(this.sendParameter('', 5));
  }
  partialCutPaper() {
    this.send(this.sendParameter('', 36));
  }
  /**
   * Set text alignment
   * @param {number} alignment  example: 0 = left / 1 = center / 2 = right / default = 0
   */
  setAlignment(alignment) {
    this.send(
      this.sendParameter(
        '',
        6,
        alignment <= 0 ? 0 : alignment >= 2 ? 2 : alignment
      )
    );
  }
  /**
   * Set text size
   * @param {number} size   example: 28
   */
  setTextSize(size) {
    this.send(this.sendParameter('', 7, size));
  }
  /**
   * Set font
   * @param {number} typeface
   */
  setTextTypeface(typeface) {
    this.send(this.sendParameter('', 8, typeface));
  }
  /**
   * Set font style
   * @param {number} style  example: NORMAL = 0 BOLD = 1 ITALIC = 2 BOLD_ITALIC = 3
   */
  setTextStyle(style) {
    this.send(
      this.sendParameter('', 9, style <= 0 ? 0 : style >= 3 ? 3 : style)
    );
  }
  /**
   * Set line spacing
   * @param {string} space
   */
  setTextLineSpacing(space) {
    this.send(this.sendParameter('', 10, space));
  }
  /**
   * Set print width
   * @param {number} width
   */
  setTextWidth(width) {
    this.send(
      this.sendParameter('', 11, width <= 0 ? 0 : width >= 576 ? 576 : width)
    );
  }
  /**
   * Print text
   * @param {string} text
   * @param {number} type
   */
  printText(text, type) {
    this.send(
      this.sendParameter(
        type !== void 0 && !type && text.charAt(text.length - 1) === 'n'
          ? text.slice(0, text.length - 1) + '\n'
          : (type !== void 0 ? text : text + '\n'),
        type !== void 0 ? 13 : 12,
        type !== void 0 ? (type <= 0 ? 0 : type >= 2 ? 2 : type) : void 0
      )
    );
  }
  /**
   * Print a row of the table (not support Arabic)
   * @param {Array} colTextArr
   * @param {Array} colWidthArr
   * @param {Array} colAlign
   * @param {number} width
   * @param {Array} size
   */
  printColumnsText(
    colTextArr,
    colWidthArr,
    colAlignArr,
    size,
    width
  ) {
    this.send(
      this.sendParameter('', 14, width < 0 ? 0 : width > 576 ? 576 : width, {
        colTextArr,
        colWidthArr,
        colAlign: colAlignArr.map((item) => {
          return item <= 0 ? 0 : item >= 2 ? 2 : item
        }),
        size,
      })
    );
  }
  /**
   * Set barcode width
   * @param {number} width
   */
  setBarCodeWidth(width) {
    this.send(
      this.sendParameter(
        '',
        15,
        width !== void 0 ? (width <= 1 ? 1 : width >= 6 ? 6 : width) : 3
      )
    );
  }
  /**
   * Set the height of the barcode
   * @param {number} height
   */
  setBarCodeHeight(height) {
    this.send(
      this.sendParameter('', 16, height <= 1 ? 1 : height >= 255 ? 255 : height)
    );
  }
  /**
   * When printing barcodes, select the printing position for HRI characters
   * @param {number} position
   */
  setBarCodeContentPrintPos(position) {
    this.send(
      this.sendParameter(
        '',
        17,
        position <= 0 ? 0 : position >= 3 ? 3 : position
      )
    );
  }
  /**
   * Print barcode
   * @param {number} barCodeType
   * @param {string} barCodeContent
   * @param {number} alignmentMode
   */
  printBarCode(
    barCodeType,
    barCodeContent,
    alignmentMode
  ) {
    this.send(
      this.sendParameter(
        barCodeContent,
        alignmentMode !== void 0 ? 19 : 18,
        barCodeType <= 0 ? 0 : barCodeType >= 6 ? 6 : barCodeType,
        alignmentMode !== void 0
          ? {
              alignmentMode:
                alignmentMode <= 0 ? 0 : alignmentMode >= 2 ? 2 : alignmentMode,
            }
          : {}
      )
    );
  }
  /**
   * Set the size of the QR code
   * @param {number} level
   */
  setQrCodeSize(level) {
    this.send(
      this.sendParameter('', 20, level <= 1 ? 1 : level >= 9 ? 9 : level)
    );
  }
  /**
   * Set QR code error correction
   * @param {number} level
   */
  setQrCodeErrorCorrectionLev(level) {
    this.send(
      this.sendParameter('', 21, level <= 48 ? 48 : level >= 51 ? 51 : level)
    );
  }
  /**
   * Set left margin of barcode and QR code
   * @param {number} marginValue
   */
  setLeftMargin(marginValue) {
    this.send(
      this.sendParameter(
        '',
        22,
        marginValue <= 0 ? 0 : marginValue >= 576 ? 576 : marginValue
      )
    );
  }
  /**
   * Printer QR code
   * @param {string} qrStr
   * @param {number} alignmentMode
   */
  printQrCode(qrStr, alignmentMode) {
    this.send(
      this.sendParameter(
        qrStr,
        alignmentMode !== void 0 ? 24 : 23,
        alignmentMode !== void 0
          ? alignmentMode <= 0
            ? 0
            : alignmentMode >= 2
            ? 2
            : alignmentMode
          : void 0
      )
    );
  }
  /**
   * Set paper specifications
   * @param {number} style
   */
  setPageFormat(style) {
    this.send(
      this.sendParameter('', 25, style >= 1 ? 1 : 0)
    );
  }
  /**
   *  Open cash box
   */
  openCashBox() {
    this.send(this.sendParameter('', 100));
  }

  /**
   *  print single image
   * @param {string} bitmap
   * @param {number} alignmentMode
   */
  printSingleBitmap(bitmap, alignmentMode) {
    const image = new Image();
    const regex =
      /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
    if (!regex.test(bitmap)) {
      image.crossOrigin = '*';
      image.src = `${bitmap}?v=${new Date().getTime()}`;
    } else {
      image.src = bitmap;
    }
    image.onload = () => {
      const formData = new FormData();
      formData.append(
        'file',
        dataURItoBlob(compressImg(image, dataURItoBlob(bitmap).type))
      );
      let XHR = null;
      if (window.XMLHttpRequest) {
        XHR = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        XHR = new ActiveXObject('Microsoft.XMLHTTP');
      } else {
        XHR = null;
      }
      if (XHR) {
        XHR.open(
          'POST',
          `${TCPConnectProtocol.HTTP}${this.address}:${this.port}${TCPConnectPrefix.HTTP}`
        );
        XHR.onreadystatechange = async () => {
          if (XHR.readyState === 4 && XHR.status === 200) {
            const resultValue = XHR.responseText;
            if (resultValue) {
              this.send(
                this.sendParameter(
                  '',
                  alignmentMode !== void 0 ? 27 : 26,
                  alignmentMode !== void 0 ? alignmentMode : void 0
                )
              );

              const callbackPromise = () => {
                return new Promise((resolve) => {
                  this.partialCutPaper();
                  resolve();
                 // this.callback = (data) => {
                 // resolve(data.data.value)
                 // }
                });
              };
              await callbackPromise({ type: 'someType' })
            }
            XHR = null;
          }
        };
        XHR.send(formData);
      }
    };
  }
  /**
   * set double QR size
   * @param { number} size
   */
  setDoubleQRSize(size) {
    this.send(this.sendParameter('', 28, size));
  }
  /**
   * set double QR1 level
   * @param {number} level
   */
  setDoubleQR1Level(level) {
    this.send(this.sendParameter('', 29, level));
  }
  /**
   * set double QR1 margin left
   * @param {number} marginValue
   */
  setDoubleQR1MarginLeft(marginValue) {
    this.send(this.sendParameter('', 31, marginValue));
  }
  /**
   * set double QR1 version
   * @param {number} version
   */
  setDoubleQR1Version(version) {
    this.send(this.sendParameter('', 33, version));
  }
  /**
   * set double QR2 level
   * @param {number} level
   */
  setDoubleQR2Level(level) {
    this.send(this.sendParameter('', 30, level));
  }
  /**
   * set double QR2 margin left
   * @param {number} marginValue
   */
  setDoubleQR2MarginLeft(marginValue) {
    this.send(this.sendParameter('', 32, marginValue));
  }
  /**
   * set double QR2 version
   * @param {number} version
   */
  setDoubleQR2Version(version) {
    this.send(this.sendParameter('', 34, version));
  }
  /**
   * print double QR
   * @param {Array} colTextArr
   */
  printDoubleQR(colTextArr) {
    this.send(
      this.sendParameter('', 35, void 0, {
        colTextArr,
      })
    );
  }
}
IminPrinter.install = install;
IminPrinter.version = '1.4.0';
if (inBrowser && window.Vue) {
  window.Vue.use(IminPrinter);
}

export { IminPrinter as default };
