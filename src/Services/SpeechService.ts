const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export class SpeechService {
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

        if (!this._recognition) {
            this._recognition = new SpeechRecognition();
        }
        this._recognition.lang = lang;
        this._recognition.interimResults = true;
        this._recognition.continuous = true;
        this._recognition.maxAlternatives = 1;

        let result: SpeechRecognitionResultList | undefined;
        return new Promise((r, e) => {
            try {
                this._recognition!.onresult = (event) => {
                    console.log(event.results);
                    console.log(event.results[event.results.length - 1][0].transcript);
                    result = event.results;
                };

                this._recognition!.onerror = (event) => {
                    this._isListening = false;
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
                            console.log(Array.from(result)
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
    public recognize2(lang: string = 'id-ID'): Promise<string> & AsyncIterableIterator<string> {
        if (this.isListening) {
            throw new Error("listening");
        }

        if (!this._recognition) {
            this._recognition = new SpeechRecognition();
        }
        this._recognition.lang = lang;
        this._recognition.interimResults = false;
        this._recognition.continuous = true;
        this._recognition.maxAlternatives = 1;

        let result: SpeechRecognitionResultList | undefined;
        const r = new Promise((r, e) => {
            try {
                this._recognition!.onresult = (event) => {
                    console.log(event.results);
                    console.log(event.results[event.results.length - 1][0].transcript);
                    result = event.results;
                };

                this._recognition!.onerror = (event) => {
                    this._isListening = false;
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
                            console.log(Array.from(result)
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

        return r as any;
    }
    public stop() {
        this._isListening = false;
        if (!this._recognition) {
            return;
        }

        this._recognition.stop();
    }
}