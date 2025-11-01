import { useEffect, useRef, useState } from 'preact/hooks';
import { SpeechService } from '../Services/SpeechService';
import { Circle, Pause, Play, Square, X } from 'lucide-preact';
import { CalcParser } from '../Services/MathLanguageParser';
import { route } from 'preact-router';
import { useSetting } from './SettingContext';
import WorkerService from '../Services/WorkerService';
import { transfer } from '@leoc11/comlink';

let speechService: SpeechService | undefined = undefined;

export default function ASR() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, , hapticFeedback] = useSetting();
  const visualize = useRef<(p?: boolean) => void>(null);
  const [isReady, setReady] = useState<boolean>(false);
  const [isListening, setListening] = useState<boolean>(false);
  const [isPause, setPause] = useState<boolean>(false);
  const stopRef = useRef<boolean>(false);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array<ArrayBuffer>;
    let source;
    let intervalId: number | undefined;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(async stream => {
      speechService = new SpeechService();
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      source = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const bufferLength = analyser.fftSize;
      dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);

      const voiceThreshold = 0.02;
      const isVoiceActive = (dataArray: Uint8Array) => {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sum += norm * norm;
        }
        return Math.sqrt(sum / dataArray.length) > voiceThreshold;
      };

      let isSilent = true;

      const offCanvas = canvasRef.current!.transferControlToOffscreen();
      const audioVisualizer = await new WorkerService.canvas.AudioVisual(transfer(offCanvas, [offCanvas]));
      visualize.current = (isStart?: boolean) => {
        if (!isStart) {
          if (typeof intervalId !== "number") {
            return;
          }

          clearInterval(intervalId);
          intervalId = undefined;
          return;
        }

        if (typeof intervalId === "number") {
          return;
        }

        intervalId = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          if (isVoiceActive(dataArray)) {
            isSilent = false;
            audioVisualizer.draw(transfer(dataArray, [dataArray.buffer]));
          }
          else if (!isSilent) {
            isSilent = true;
            audioVisualizer.drawSilent();
          }
        }, 1000 / 15) as unknown as number; // 15 FPS
      };
      setReady(true);
    }).catch(err => {
      console.error(err);
      alert('Microphone access denied or unavailable.');
    });

    return () => {
      clearInterval(intervalId);
      if (audioContext) audioContext.close();
    };
  }, []);


  const onPlay = async () => {
    if (!isReady) {
      return;
    }

    hapticFeedback();
    if (isListening && !isPause) {
      speechService!.stop();
      return;
    }

    try {
      const rprom = speechService!.recognize();
      setListening(true);
      setPause(false);
      visualize.current?.(true);
      const text = await rprom;
      console.log(text);
      if (!text && !stopRef.current) {
        return;
      }
      const commands = CalcParser(text);
      console.log(commands);
      if (!commands && !stopRef.current) {
        return;
      }

      const n = result + commands + "+";
      if (stopRef.current) {
        stopRef.current = false;
        document.startViewTransition(() => route(`/check?data=${encodeURIComponent(n)}`));
      }
      else {
        console.log(n);
        setResult(n);
      }
    }
    catch (e) {
      alert(e);
    }
    finally {
      visualize.current?.();
      setPause(true);
    }
  }
  const onStop = () => {
    if (!isListening) {
      return;
    }

    hapticFeedback();
    stopRef.current = true;
    speechService!.stop();
    visualize.current?.();
    setListening(false);
    if (isPause) {
      stopRef.current = false;
      document.startViewTransition(() => route(`/check?data=${encodeURIComponent(result)}`));
    }
  };
  const onCancel = () => {
    hapticFeedback();
    document.startViewTransition(() => {
      route("/");
    });
  };
  return (
    <div style={{ height: '100dvh', width: "100dvw", position: "relative", viewTransitionName: "view-scale" }}>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight / 2}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          border: 'none', background: 'transparent', width: "100%", height: "50%"
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '0',
          width: '100%',
          height: '60%',
          fontSize: '1rem',
          padding: '0.5rem 1rem',
          textAlign: 'center'
        }}
      >
        {result}
      </div>
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '0',
          width: '100%',
          height: '50%',
          background: 'linear-gradient(to top, #fff, #ffff)'
        }}
      >
      </div>
      {isListening && (<button class="float-btn" style={{
        position: "absolute",
        left: "15%", top: 'auto', bottom: "10px", opacity: 0.5,
        fontSize: '2rem',
        transform: 'translate(-50%,-25%)',
        transition: 'opacity 0.3s ease',
      }} onClick={onCancel}><X /></button>)}
      <button class="float-btn" disabled={!isReady} style={{
        position: "absolute",
        left: "50%", top: 'auto', bottom: "10px", opacity: 0.5,
        fontSize: '3rem',
        color: "#f44336",
        transform: 'translateX(-50%)',
        transition: 'opacity 0.3s ease',
      }} onClick={onPlay}>{!isListening ? <Circle fill="#f44336" /> : isPause ? <Play fill="#f44336" /> : <Pause fill="#f44336" />}</button>
      {isListening && (<button class="float-btn" disabled={!result} style={{
        position: "absolute",
        right: "15%", top: 'auto', bottom: "10px", opacity: 0.5,
        fontSize: '2rem',
        color: !result ? "#ccc" : "#f44336",
        transform: 'translate(50%,-25%)',
        transition: 'opacity 0.3s ease',
      }} onClick={onStop}><Square fill={!result ? "#ccc" : "#f44336"} /></button>)}
    </div>
  );
}