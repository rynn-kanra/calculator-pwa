declare global {
    interface SpeechRecognition extends EventTarget {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        maxAlternatives: number;
        start(): void;
        stop(): void;
        abort(): void;
        onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
        onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
        onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    }
    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }
    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
        message: string;
    }

    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
        SpeechRecognition: new () => SpeechRecognition;
    }
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
class SpeechService {
    private _recognition?: SpeechRecognition;
    private _isPermissionGranted: boolean = false;
    private _isListening: boolean = false;
    public get isListening(): boolean {
        return this._isListening;
    }
    public async requestPermission(): Promise<void> {
        if (this._isPermissionGranted) {
            return;
        }

        const m = await navigator.mediaDevices.getUserMedia({ audio: true });
        this._isPermissionGranted = m.active;
    }
    public recognize(lang: string = 'id-ID'): Promise<string> {
        if (this.isListening) {
            throw new Error("listening");
        }
        if (!this._isPermissionGranted) {
            throw new Error("require permission");
        }

        if (!this._recognition) {
            this._recognition = new SpeechRecognition();
        }
        this._recognition.lang = lang;
        this._recognition.interimResults = false;
        this._recognition.continuous = true;
        this._recognition.maxAlternatives = 1;

        let result: SpeechRecognitionResultList | undefined;
        return new Promise((r, e) => {
            try {
                this._recognition!.onresult = (event) => {
                    alert(event.results[event.results.length - 1][0].transcript);
                    result = event.results;
                };

                this._recognition!.onerror = (event) => {
                    e(event.error);
                };
                this._recognition!.onnomatch = (event) => {
                    if (this._isListening) {
                        this._recognition?.start();
                    }
                };

                this._recognition!.onend = () => {
                    if (this._isListening) {
                        this._recognition?.start();
                    }
                    else {
                        let final = "";
                        if (result) {
                            final = Array.from(result)
                                .map(o => o[0].transcript)
                                .join(" ");
                            alert(Array.from(result)
                                .map(o => `[${o[0].confidence}]${o[0].transcript}`)
                                .join("\n"))
                        }
                        r(final);
                    }
                };
                this._recognition!.start();
                this._isListening = true;
            }
            catch (error) {
                e(error);
            }
        });
    }
    public stop() {
        this._isListening = false;
        if (!this._recognition) {
            return;
        }

        this._recognition.stop();
    }

    public static default = new SpeechService();
}

export default SpeechService.default;