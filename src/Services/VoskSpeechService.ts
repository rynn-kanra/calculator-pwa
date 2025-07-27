import { SpeechService } from "./SpeechService";
import Vosk, { KaldiRecognizer } from "vosk-browser";
import { RecognizerMessage, ServerMessagePartialResult, ServerMessageResult } from "vosk-browser/dist/interfaces";

// pocketsphinx.js
// https://github.com/k2-fsa/sherpa-onnx/tree/master
// https://huggingface.co/bookbot/sherpa-onnx-pruned-transducer-stateless7-streaming-id

const DB_NAME = 'vosk-model-store';
const STORE_NAME = 'model-files';
const MODEL_URL_PREFIX = 'https://yourserver.com/vosk-model-small-en-us-0.15/';

// CMUdict
class VoskSpeechService extends SpeechService {
    private _recognizer?: Vosk.KaldiRecognizer;
    private _grammar: string;
    private _sampleRate: number;
    private _isVListening: boolean;
    private _audioCtx?: AudioContext;
    private _audioNode?: AudioWorkletNode;
    private _streamNode?: MediaStreamAudioSourceNode;
    private _resultMessages: string[] = [];
    private _resolver?: (value: string | PromiseLike<string>) => void;
    private _rejector?: (reason?: any) => void;
    public get isListening(): boolean {
        return this._isVListening;
    }
    constructor(grammar: string[], sampleRate: number = 16000) {
        super()
        this._grammar = JSON.stringify(grammar);
        this._sampleRate = sampleRate;
        this._isVListening = false;
    }
    public async requestPermission(): Promise<void> {
        if (this._recognizer) {
            return;
        }

        const model = await Vosk.createModel('./assets/models/vosk-model-small-en-us-0.15.zip');
        this._recognizer = new model.KaldiRecognizer(this._sampleRate, this._grammar);
        this._recognizer.acceptWaveformFloat = function (this: KaldiRecognizer, buffer: Float32Array, sampleRate: number) {
            (model as any).postMessage({
                action: "audioChunk",
                data: buffer,
                recognizerId: this.id,
                sampleRate: sampleRate
            }, {
                transfer: [buffer.buffer]
            });
        };
        this._recognizer.on("result", (message: ServerMessageResult) => {
            console.log(message.result);
            if (message.result?.text) {
                this._resultMessages.push(message.result.text);
            }
        });
        // recognizer.on("partialresult", (message: ServerMessagePartialResult) => {
        //     if (message.result.partial) {
        //         console.log(message.result);
        //     }
        //     // console.log(`Partial result: ${message.result.partial}`);
        // });
        this._recognizer.on("error", (message) => {
            this._rejector && this._rejector(message);
            this.stop();
        });

        this._audioCtx = new AudioContext({ sampleRate: this._sampleRate });
        await this._audioCtx.audioWorklet.addModule('./workers/VoskAudioProcessor.js');
        this._audioNode = new AudioWorkletNode(this._audioCtx, 'recognizer-processor', { channelCount: 1, numberOfInputs: 1, numberOfOutputs: 1 });
        this._audioNode.connect(this._audioCtx.destination);
        this._audioNode.port.onmessage = (event) => {
            this._recognizer?.acceptWaveformFloat(event.data, this._sampleRate);
        };
    }
    public async recognize(lang: string = 'id-ID'): Promise<string> {
        if (this.isListening) {
            throw new Error("listening");
        }
        if (!this._recognizer || !this._audioCtx || !this._audioNode) {
            throw new Error("require permission");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
                sampleRate: this._sampleRate
            },
        });
        this._streamNode = this._audioCtx.createMediaStreamSource(mediaStream);
        this._streamNode.connect(this._audioNode);

        return new Promise((resolve, reject) => {
            this._resolver = resolve;
            this._rejector = reject;
        })
    }
    public stop() {
        this._isVListening = false;
        if (!this._recognizer || !this._streamNode) {
            return;
        }

        this._recognizer.retrieveFinalResult();
        this._streamNode.mediaStream.getTracks().forEach((track) => track.stop());
        this._streamNode.disconnect();
        setTimeout(() => {
            this._resolver && this._resolver(this._resultMessages.splice(0).join(" "));
        }, 500);
    }

    public static default = new VoskSpeechService(["satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "puluh", "setengah", "sebelas", "belas"]);
}

export default VoskSpeechService.default;