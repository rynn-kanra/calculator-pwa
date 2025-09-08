import { useEffect, useRef, useState } from 'preact/hooks';
import { useSetting } from './SettingContext';

const BarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const playRef = useRef<() => void>(null);
  const [result, setResult] = useState<DetectedBarcode>();
  const [isCameraOn, setCameraOn] = useState<boolean>(false);
  const [, , hapticFeedback] = useSetting();

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
    if (!('BarcodeDetector' in window)) {
      alert('BarcodeDetector is not supported.');
      return;
    }

    let animationFrame: number;
    const detector = new BarcodeDetector();
    const detectBarcode = async () => {
      let continueDetect = true;
      try {
        if (!videoRef.current) return;
        if (!canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

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

        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code) {
            hapticFeedback();
            setResult(barcodes[0]);
            modalRef.current?.showModal();
            videoRef.current?.pause();
            setCameraOn(false);
            continueDetect = false;
            return;
          }
        }
      } catch (err) {
        console.error('Barcode detection failed', err);
      }
      finally {
        if (continueDetect) {
          playRef.current?.();
        }
      }
    }
    playRef.current = () => {
      if (videoRef.current?.paused) {
        videoRef.current.play();
      }

      setCameraOn(true);
      setTimeout(function () {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => detectBarcode());
      }, 300);
    };
    const stopScanner = () => {
      cancelAnimationFrame(animationFrame);
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
    // Start video stream on mount
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        zoom: {
          ideal: 1
        },
        focusMode: "continuous"
      }
    })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraOn(true);
          detectBarcode();
        }
      })
      .catch(err => {
        console.error('Error accessing camera:', err);
      });

    return () => {
      stopScanner();
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
    playRef.current?.();
    modalRef.current?.close();
  }

  const edgeSize = Math.round(size / 10);
  return (
    <div style={{ height: '100dvh', width: "100dvw", position: "relative", viewTransitionName: "view-scale" }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
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
          <p style={{ margin: 0, overflowWrap: "break-word" }}>{result?.rawValue}</p>
        </div>
        <div style={{ textAlign: "right", marginTop: '1rem' }}>
          <button class="btn-small" style={{ color: "white", backgroundColor: "#4caf50", borderColor: "#4caf50", margin: 0 }} onClick={onContinue}>CONTINUE</button>
        </div>
      </dialog>
    </div>
  );
};

export default BarcodeScanner;