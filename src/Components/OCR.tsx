import { useEffect, useRef, useState } from 'preact/hooks';
import { GutenyeOCRService } from '../Services/OCR/GutenyeOCRService';
import { CalcParser } from '../Services/MathLanguageParser';
import { Circle, FileImage, X } from 'lucide-preact';
import { route } from 'preact-router';
import { useSetting } from './SettingContext';
import { WebOCRService } from '../Services/OCR/WebOCRService';
import { OCREngine } from '../Model/CalculatorConfig';
import { OCRServiceBase } from '../Services/OCR/OCRService';

let ocrService: OCRServiceBase;
const OCR = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCameraOn, setCameraOn] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);
  const [setting, , hapticFeedback] = useSetting();

  // Define box dimensions (in % relative to video)
  const box = {
    x: 0.5,
    y: 0.05,
    width: 0.40,
    height: 0.8
  };

  useEffect(() => {
    if (window.launchQueue) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files.length) {
          const handle = launchParams.files[0]
          const file = await handle.getFile();
          processImage(file);
        }
      });
    }

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

    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    if (params.get("share")) {
      ocrService.init();
      navigator.serviceWorker.ready.then(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ action: 'handleShare' });
        }
      });
    }
    else {
      // Start video stream on mount
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: window.innerWidth * window.devicePixelRatio },
          height: { ideal: window.innerHeight * window.devicePixelRatio }
        }
      })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraOn(true);
            ocrService.init();
          }
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
        });
    }

    const messageHandler = (ev: MessageEvent) => {
      if (ev.data) {
        switch (ev.data.type) {
          case "SHARE": {
            processImage(ev.data.image as File);
            break;
          }
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', messageHandler);
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
      stopVideo();
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.onchange = async () => {
        if (!inputRef.current!.files) return;

        const file = inputRef.current?.files[0];
        if (!file) return;

        processImage(file);
      };
    }

    if (videoRef.current) {
      videoRef.current.addEventListener('pause', function () {
        this.style.filter = 'brightness(0)';
      });
      videoRef.current.addEventListener('play', function () {
        this.style.filter = '';
      });
    }
  }, [inputRef, videoRef]);

  const stopVideo = () => {
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }
  const processImage = async (file: Blob) => {
    try {
      videoRef.current?.pause();
      let text = await ocrService.recognize(file);
      console.log("RAW OCR:");
      console.log(text);
      if (true) {
        const replaceMap = new Map<RegExp, string>([
          [/([0-9])[B&](?=[0-9])/g, '$18'],
          [/([0-9])[Gb](?=[0-9])/g, '$11'],
          [/([0-9])[iIl](?=[0-9])/g, '$11'],
          [/([0-9])[q](?=[0-9])/g, '$19'],
          [/([0-9])[oO](?=[0-9])/g, '$10'],
          [/([0-9])[S](?=[0-9])/ig, '$15'],
          [/([0-9])[Zz](?=[0-9])/g, '$12'],
          [/([0-9])(?=[86]*0[86]*)[860][860][860]$/g, '$1000'],
          [/([0-9][5])(?=[86]*0[86]*)[860][860]$/g, '$1500'],
          [/Rp(?= *[0-9])/g, ''],
          [/\(([0-9. ]+)\)/g, '-$1'],
        ]);
        const replaceMap2 = new Map<RegExp, string>([
          [/([0-9]).?[-]$/g, '$1000'],
          [/[^0-9.,-](?=.*[0-9]$)/g, ''],
          [/([^50])(?=00$)/g, '$10'],
        ]);
        let ds = text.split('\n').map(o => {
          o = o.replaceAll(/([0-9]) (?=[.,][0-9.,]*$)/ig, "$1");
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

        text = ds.join(' ');
        console.log("CLEANED TEXT:");
        console.log(text);
      }

      let commands = CalcParser(text);
      console.log("CALC COMMAND");
      console.log(commands);
      if (!commands) {
        throw new Error("no numbers");
      }

      stopVideo();
      document.startViewTransition(() => {
        route(`/check?data=${encodeURIComponent(commands)}`);
      });
    }
    catch (e) {
      alert(e);
      videoRef.current?.play();
    }
  }

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      hapticFeedback();

      const videoRect = video.getBoundingClientRect();
      const videoAspect = video.videoWidth / video.videoHeight;
      const visibleAspect = videoRect.width / videoRect.height;

      let width, height, offsetX = 0, offsetY = 0;
      if (visibleAspect > videoAspect) {
        width = video.videoWidth;
        height = video.videoWidth / visibleAspect;
        offsetY = (video.videoHeight - height) / 2;
      }
      else {
        height = video.videoHeight;
        width = video.videoHeight * visibleAspect;
        offsetX = (video.videoWidth - width) / 2;
      }

      // Coordinates in pixels
      const sx = width * box.x + offsetX;
      const sy = height * box.y + offsetY;
      const sw = width * box.width;
      const sh = height * box.height;

      canvas.width = sw;
      canvas.height = sh;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

      const data = await new Promise<Blob>((r, e) => {
        canvas.toBlob(function (data) {
          if (data) {
            r(data);
          }
          e("no data");
        }, "image/png");
      });

      const objectURL = URL.createObjectURL(data);
      setImage(objectURL);
      await processImage(data);
      URL.revokeObjectURL(objectURL);
      setImage("");
    }
  };
  const selectImage = async () => {
    if (!inputRef.current) {
      return;
    }
    hapticFeedback();

    inputRef.current.value = '';
    inputRef.current.click();
  };
  const cancel = () => {
    hapticFeedback();

    stopVideo();
    document.startViewTransition(() => {
      route("/");
    });
  };

  const edgeSize = Math.round(Math.min(box.width * window.innerWidth, box.height * window.innerHeight) * 0.1);
  return (
    <div style={{ height: '100dvh', width: "100dvw", position: "relative", viewTransitionName: "view-scale" }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input type="file" multiple={false} accept="image/*" ref={inputRef} style={{ display: 'none' }} />
      <video ref={videoRef} autoPlay playsInline style={{
        width: '100%',
        backgroundColor: 'black',
        height: '100%',
        objectFit: "cover",
        transition: "filter 0.3s ease"
      }} />

      {/* Capture Box Overlay */}
      {isCameraOn && (<>
        <div style={{
          position: 'absolute',
          background: 'rgba(0, 0, 0, 0.4)',
          left: 0,
          top: 0,
          width: `100%`,
          height: `100%`,
          pointerEvents: 'none',
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% 0%,
            ${box.x * 100}% ${box.y * 100}%, ${box.x * 100}% ${(box.y + box.height) * 100}%, ${(box.x + box.width) * 100}% ${(box.y + box.height) * 100}%, ${(box.x + box.width) * 100}% ${box.y * 100}%, ${box.x * 100}% ${box.y * 100}%
          )`
        }}></div>
        <div style={{
          position: "absolute",
          width: `${edgeSize}px`,
          height: `${edgeSize}px`,
          borderWidth: "3px",
          borderColor: "#f44336",
          top: `calc(${box.y * 100}% - 2px)`,
          left: `calc(${box.x * 100}% - 2px)`,
          borderStyle: "solid none none solid",
          transition: "border-color 0.3s ease"
        }} />
        <div style={{
          position: "absolute",
          width: `${edgeSize}px`,
          height: `${edgeSize}px`,
          borderWidth: "3px",
          borderColor: "#f44336",
          top: `calc(${box.y * 100}% - 2px)`,
          left: `calc(${(box.x + box.width) * 100}% - ${(edgeSize - 3 + 1)}px)`,
          borderStyle: "solid solid none none",
          transition: "border-color 0.3s ease"
        }} />
        <div style={{
          position: "absolute",
          width: `${edgeSize}px`,
          height: `${edgeSize}px`,
          borderWidth: "3px",
          borderColor: "#f44336",
          top: `calc(${(box.y + box.height) * 100}% - ${(edgeSize - 3 + 1)}px)`,
          left: `calc(${(box.x + box.width) * 100}% - ${(edgeSize - 3 + 1)}px)`,
          borderStyle: "none solid solid none",
          transition: "border-color 0.3s ease"
        }} />
        <div style={{
          position: "absolute",
          width: `${edgeSize}px`,
          height: `${edgeSize}px`,
          borderWidth: "3px",
          borderColor: "#f44336",
          top: `calc(${(box.y + box.height) * 100}% - ${(edgeSize - 3 + 1)}px)`,
          left: `calc(${box.x * 100}% - 2px)`,
          borderStyle: "none none solid solid",
          transition: "border-color 0.3s ease"
        }} />
      </>)}

      {image && (
        <div style={{ height: '100%', position: "absolute", top: 0 }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1rem' }}>Processing...</h4>
          <img src={image} alt="Screenshot" style={{ width: 'auto', height: 'auto', transform: "scale(0.5,0.5)", transformOrigin: "top left" }} />
        </div>
      )}
      <button class="float-btn" disabled={!isCameraOn} style={{
        position: "absolute",
        left: "15%", top: 'auto', bottom: "10px", opacity: 0.5,
        fontSize: '2rem',
        transform: 'translate(-50%,-25%)',
        transition: 'opacity 0.3s ease',
      }} onClick={cancel}><X /></button>
      <button class="float-btn" disabled={!isCameraOn} style={{
        position: "absolute",
        left: "50%", top: 'auto', bottom: "10px", opacity: 0.5,
        fontSize: '3rem',
        transform: 'translateX(-50%)',
        transition: 'opacity 0.3s ease',
      }} onClick={captureImage}><Circle /></button>
      <button class="float-btn" disabled={!isCameraOn} style={{
        position: "absolute",
        right: "15%", top: 'auto', bottom: "10px", opacity: 0.5,
        fontSize: '2rem',
        transform: 'translate(50%,-25%)',
        transition: 'opacity 0.3s ease',
      }} onClick={selectImage}><FileImage /></button>
    </div>
  );
};

export default OCR;