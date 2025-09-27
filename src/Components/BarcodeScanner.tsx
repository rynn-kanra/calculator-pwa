import { useEffect, useRef, useState } from 'preact/hooks';
import { useSetting } from './SettingContext';
import { BarcodeData, IBarcodeService } from '../Services/BarcodeService/IBarcodeService';
import { KeyboardBarcodeService } from '../Services/BarcodeService/KeyboardBarcodeService';
import { CameraBarcodeService } from '../Services/BarcodeService/CameraBarcodeService';
import { BarcodeScannerEngine } from '../Model/CalculatorConfig';

const BarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const barcodeScannerRef = useRef<IBarcodeService>(null);
  const [result, setResult] = useState<BarcodeData>();
  const [isCameraOn, setCameraOn] = useState<boolean>(false);
  const [setting, , hapticFeedback] = useSetting();

  // Define box dimensions (in % relative to video)
  const box = {
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8
  };
  let size = 0;
  // square box
  if (window.innerWidth < window.innerHeight) {
    size = window.innerWidth * box.width;
    box.height = Math.round(size * 100 / window.innerHeight) / 100;
    box.y = (1 - box.height) / 2;
  }
  else if (window.innerWidth > window.innerHeight) {
    size = window.innerHeight * box.height;
    box.width = Math.round(size * 100 / window.innerWidth) / 100;
    box.x = (1 - box.width) / 2;
  }
  else {
    size = window.innerWidth * box.width;
  }

  box.y = box.y * 0.5;

  useEffect(() => {
    switch (setting.barcodeScannerEngine) {
      case BarcodeScannerEngine.keyboard_mode: {
        barcodeScannerRef.current = new KeyboardBarcodeService({
          target: document.body
        });
        break;
      }
      case BarcodeScannerEngine.camera:
      default: {
        barcodeScannerRef.current = new CameraBarcodeService({
          video: videoRef.current!,
          box: box
        });
      }
    }

    barcodeScannerRef.current.connect().then(() => {
      setCameraOn(true);
      (async () => {
        for await (const data of barcodeScannerRef.current!) {
          hapticFeedback();
          barcodeScannerRef.current?.disconnect();
          setResult(data);
          modalRef.current?.showModal();
          setCameraOn(false);
        }
      })();
    });

    return () => {
      barcodeScannerRef.current?.dispose();
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('pause', function () {
        this.style.filter = 'blur(5px)';
      });
      videoRef.current.addEventListener('play', function () {
        this.style.filter = '';
      });
    }
  }, [videoRef]);

  const onContinue = () => {
    hapticFeedback();
    barcodeScannerRef.current?.connect();
    modalRef.current?.close();
    setCameraOn(true);
  }

  const edgeSize = Math.round(size / 10);
  return (
    <div style={{ height: '100dvh', width: "100dvw", position: "relative", viewTransitionName: "view-scale" }}>
      <video ref={videoRef} autoPlay playsInline style={{
        width: '100%',
        backgroundColor: 'black',
        height: '100%',
        objectFit: "cover",
        transition: "filter 0.3s ease"
      }} />

      {/* Capture Box Overlay */}
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
        borderColor: isCameraOn ? "#f44336" : "#666",
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
        borderColor: isCameraOn ? "#f44336" : "#666",
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
        borderColor: isCameraOn ? "#f44336" : "#666",
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
        borderColor: isCameraOn ? "#f44336" : "#666",
        top: `calc(${(box.y + box.height) * 100}% - ${(edgeSize - 3 + 1)}px)`,
        left: `calc(${box.x * 100}% - 2px)`,
        borderStyle: "none none solid solid",
        transition: "border-color 0.3s ease"
      }} />

      <dialog ref={modalRef} style={{ margin: "0 auto", top: `${(box.y + box.height / 4) * 100}%`, maxWidth: `${(box.width - 0.1) * 100}%` }}>
        <div>
          <p style={{ margin: 0, textTransform: "uppercase" }}>FORMAT: {result?.format}</p>
          <p style={{ margin: 0, overflowWrap: "break-word" }}>{result?.value}</p>
        </div>
        <div style={{ textAlign: "right", marginTop: '1rem' }}>
          <button class="btn-small" style={{ color: "white", backgroundColor: "#4caf50", borderColor: "#4caf50", margin: 0 }} onClick={onContinue}>CONTINUE</button>
        </div>
      </dialog>
    </div>
  );
};

export default BarcodeScanner;