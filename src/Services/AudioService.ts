export class AudioService {
    private _context?: AudioContext;
    private _inBuffer?: AudioBuffer;
    private _source?: string;
    constructor(source: string) {
        this._source = source;
    }
    public async init() {
        if (this._context || !this._source) {
            return;
        }

        this._context = new AudioContext();
        const res = await fetch(this._source);
        const audioData = await res.arrayBuffer();
        this._inBuffer = await this._context.decodeAudioData(audioData);
    }
    public async play() {
        if (!this._context || !this._inBuffer) {
            await this.init();
        }

        const source = this._context!.createBufferSource();
        source.buffer = this._inBuffer!;
        source.connect(this._context!.destination);
        source.start(0);
    }
}

export const ClickAudio = new AudioService("./assets/audio/click-in.mp3");