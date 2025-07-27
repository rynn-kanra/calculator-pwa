import { SpeechService } from "./SpeechService";

// pocketsphinx.js
// http://www.speech.cs.cmu.edu/tools/lmtool-new.html

const d: {
    [key: string]: {
        resolver: (value?: unknown) => void,
        rejector: (result?: any) => void,
    } | undefined
} = {};
let cmdIndex = 0;
function spawnWorker(config: { [key in "recognizer" | "path" | "sphinxjs" | "sphinxwasm"]: string }): Promise<Worker> {
    return new Promise((resolver, rejector) => {
        const recognizer = new Worker(config.path + config.recognizer);
        const onMessage = (event: MessageEvent) => {
            if (event.data.hasOwnProperty('id') && d[event.data.id]) {
                const resolver = d[event.data.id]![event.data.type === "error" ? "rejector" : "resolver"];
                resolver(event.data.data);
                d[event.data.id] = undefined;
            }
        };
        recognizer.onmessage = (event) => {
            recognizer.onmessage = onMessage;
            resolver(recognizer);
        };
        recognizer.send = (command: string, data: any, transfer: Transferable[] = []) => {
            const callbackId = cmdIndex++;
            recognizer.postMessage({ command: command, data: data, callbackId: callbackId }, transfer);
            return new Promise((resolver, rejector) => {
                d[callbackId] = {
                    resolver: resolver,
                    rejector: rejector
                };
            });
        };
        recognizer.postMessage({ 'pocketsphinx.wasm': config.sphinxwasm, 'pocketsphinx.js': config.sphinxjs });
    });
};
var wordList = [
    ["SATU", "S AA T UW"],
    ["DUA", "D UW AA"],
    ["TIGA", "T IY G AA"],
    ["EMPAT", "AH M P AA T"],
    ["LIMA", "L IY M AA"],
    // ["ENAM", "AH N AA M"],
    ["TUJUH", "T UW JH UH"],
    ["DELAPAN", "D EH L AA P AA N"],
    ["SEMBILAN", "S AH M B IY L AA N"],
    ["SEPULUH", "S AH P UW L UH"]
];
var grammarDigits = {
    numStates: 1, start: 0, end: 0,
    transitions: wordList.map(o => ({from: 0, to: 0, word: o[0]}))
};

// CMUdict
class PocketSphinxSpeechService extends SpeechService {
    private _recognizer?: any;
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
        
        const recognizer = await spawnWorker({
            path: "./workers/pocketsphinx/",
            recognizer: "recognizer.js",
            sphinxjs: "pocketsphinx.js",
            sphinxwasm: "pocketsphinx.wasm",
        });
        await recognizer.send('initialize', [["-kws_threshold", "1e-25"]]);
        await recognizer.send('addWords', wordList);
        recognizer.grammarId = await recognizer.send('addGrammar', grammarDigits);
        this._recognizer = recognizer;

        this._audioCtx = new AudioContext({ sampleRate: this._sampleRate });
        await this._audioCtx.audioWorklet.addModule('./workers/SphinxAudioProcessor.js');
        this._audioNode = new AudioWorkletNode(this._audioCtx, 'recognizer-processor', { channelCount: 1, numberOfInputs: 1, numberOfOutputs: 1 });
        this._audioNode.connect(this._audioCtx.destination);
        this._audioNode.port.onmessage = async (event) => {
            const data = event.data as Float32Array;
            try {
                recognizer.send('process', data, [data.buffer]).then(o => console.log(o.hyp));
            }
            catch {

            }
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
        this._isVListening = true;

        await this._recognizer.send("start", this._recognizer.grammarId);
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

        this._streamNode.mediaStream.getTracks().forEach((track) => track.stop());
        this._streamNode.disconnect();
        this._recognizer.send("stop").then((o) => {
            this._resolver && this._resolver(o.hyp);
        });
    }

    public static default = new PocketSphinxSpeechService(["satu", "dua", "belas", "ribu", "puluh"]);
}

export default PocketSphinxSpeechService.default;