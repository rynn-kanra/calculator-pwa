import { SpeechService } from "./SpeechService";
import Vosk, { KaldiRecognizer } from "vosk-browser";
import { MicVAD } from "@ricky0123/vad-web";
import { ServerMessageResult } from "vosk-browser/dist/interfaces";

const map = {
    "empat": "um pat",
    "enam": "un arm",
    "tujuh": "two jew",
    "delapan": "deli pan",
    "sembilan": "some be land",
    "sepuluh": "seh poo lou",
    "sebelas": "seh buh lass",
    "belas": "buh lass",
    "puluh": "poo lou",
    "sejuta": "seh ju ta",
    "seratus": "seh rat use",
    "juta": "ju ta",
    "ratus": "rat use",
    "tambah": "tam bah",
    "kurang": "coo rang",
    "sama dengan": "sama done gone"
};
const words = "satu,dua,tiga,empat,lima,enam,tujuh,delapan,sembilan,sepuluh,sebelas,dua belas,tiga belas,empat belas,lima belas,enam belas,tujuh belas,delapan belas,sembilan belas,dua puluh,tiga puluh,empat puluh,lima puluh,enam puluh,tujuh puluh,delapan puluh,sembilan puluh,seratus,dua ratus,tiga ratus,empat ratus,lima ratus,enam ratus,tujuh ratus,delapan ratus,sembilan ratus,sejuta,satu juta,satu juta,dua juta,tiga juta,empat juta,lima juta,enam juta,tujuh juta,delapan juta,sembilan juta,tambah,bagi,kurang,kali,sama dengan,koma,nol,[unk]";
let d = words;
for (const p in map) {
    d = d.replaceAll(p, map[p]);
}
class VoskSpeechService extends SpeechService {
    private _recognizer?: Vosk.KaldiRecognizer;
    private _grammar: string;
    private _vad: MicVAD;
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
        this._recognizer.setWords(true);
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
        this._recognizer.on("error", (message) => {
            this._rejector && this._rejector(message);
            this.stop();
        });

        this._vad = await MicVAD.new({
            baseAssetPath: "./workers/", // or whatever you want
            onnxWASMBasePath: "./workers/", // or whatever you want
            model: "v5",
            onSpeechEnd: (audio) => {
                this._recognizer?.acceptWaveformFloat(audio.map(s => s == 1 ? 32767 : s * 32768), this._sampleRate);
                // do something with `audio` (Float32Array of audio samples at sample rate 16000)...
            }
        });
        // this._audioCtx = new AudioContext({ sampleRate: this._sampleRate });
        // await this._audioCtx.audioWorklet.addModule('./workers/VoskAudioProcessor.js');
        // this._audioNode = new AudioWorkletNode(this._audioCtx, 'recognizer-processor', { channelCount: 1, numberOfInputs: 1, numberOfOutputs: 1 });
        // this._audioNode.connect(this._audioCtx.destination);
        // this._audioNode.port.onmessage = (event) => {
        //     this._recognizer?.acceptWaveformFloat(event.data, this._sampleRate);
        // };
    }
    public async recognize(lang: string = 'id-ID'): Promise<string> {
        if (this.isListening) {
            throw new Error("listening");
        }
        if (!this._recognizer) {
            throw new Error("require permission");
        }
        
        this._vad.start();
        // const mediaStream = await navigator.mediaDevices.getUserMedia({
        //     video: false,
        //     audio: {
        //         echoCancellation: true,
        //         noiseSuppression: true,
        //         channelCount: 1,
        //         sampleRate: this._sampleRate
        //     },
        // });
        // this._streamNode = this._audioCtx.createMediaStreamSource(mediaStream);
        // this._streamNode.connect(this._audioNode);

        return new Promise((resolve, reject) => {
            this._resolver = resolve;
            this._rejector = reject;
        })
    }
    public stop() {
        this._isVListening = false;
        if (!this._recognizer) {
            return;
        }

        this._recognizer.retrieveFinalResult();
        
        this._vad.pause();
        // this._streamNode.mediaStream.getTracks().forEach((track) => track.stop());
        // this._streamNode.disconnect();
        setTimeout(() => {
            this._resolver && this._resolver(this._resultMessages.splice(0).join(" "));
        }, 500);
    }

    public static default = new VoskSpeechService(d.split(','));
}

export default VoskSpeechService.default;