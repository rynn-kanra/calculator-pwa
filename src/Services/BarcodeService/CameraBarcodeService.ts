import type { BarcodeData, IBarcodeService } from "./IBarcodeService";
import type { BarcodeScanner } from "../../Workers/CanvasWorker";
import { Remote, transfer } from "@leoc11/comlink";
import { copy } from "../../Utility/copy";
import WorkerService from "../WorkerService";
import { defer, DeferPromise } from "../../Utility/defer";

type CameraBarcodeOption = {
    video: HTMLVideoElement,
    formats?: string[],
    box?: {
        x: number,
        y: number,
        width: number,
        height: number
    }
};

type CameraBarcodeInternal = CameraBarcodeOption & {
    detector?: Remote<BarcodeScanner>;
    defer?: DeferPromise<BarcodeData>;
    detectAnimateId?: number;
    detectTOId?: number;
}

export class CameraBarcodeService implements IBarcodeService {
    #option: CameraBarcodeInternal;
    #isConnected = false;
    constructor(option: CameraBarcodeOption) {
        this.#option = copy(option, {
            box: {
                height: 100,
                width: 100,
                x: 0,
                y: 0
            }
        }) as any;
    }
    async init(id?: string): Promise<void> {
        if (this.#option.detector) {
            return;
        }

        if (!('BarcodeDetector' in window)) {
            alert('BarcodeDetector is not supported.');
        }

        this.#option.detector = await new WorkerService.canvas.BarcodeScanner();

        // Start video stream on mount
        try {
            this.#option.video.pause();
            var stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    zoom: {
                        ideal: 1
                    },
                    focusMode: "continuous"
                }
            });
            this.#option.video.srcObject = stream;
        }
        catch (err) {
            console.error('Error accessing camera:', err);
        }
    }
    async connect(): Promise<void> {
        if (this.#isConnected) {
            return;
        }

        await this.init();        
        this.#option.video.play();
        clearTimeout(this.#option.detectTOId);
        this.#option.detectAnimateId && cancelAnimationFrame(this.#option.detectAnimateId);
        this.#option.detectTOId = setTimeout(() => {
            this.#option.detectAnimateId = requestAnimationFrame(() => this.detectBarcode());
        }, 300) as any;

        this.#isConnected = true;
    }
    async disconnect(): Promise<void> {
        if (!this.#isConnected) {
            return;
        }

        this.#option.video.pause();
        clearTimeout(this.#option.detectTOId);
        this.#option.detectAnimateId && cancelAnimationFrame(this.#option.detectAnimateId);
        this.#isConnected = false;
    }
    async dispose(): Promise<void> {
        this.disconnect();
        if (this.#option.video?.srcObject instanceof MediaStream) {
            this.#option.video.srcObject.getTracks().forEach(track => track.stop());
            this.#option.video.srcObject = null;
        }
        this.#option.defer?.reject("disconnected");
    }
    async *[Symbol.asyncIterator](): AsyncIterator<BarcodeData, any, any> {
        if (!this.#isConnected) {
            return;
        }

        if (!this.#option.defer) {
            this.#option.defer = defer();
        }

        try {
            while (true) {
                yield await this.#option.defer;
                this.#option.defer = defer();
            }
        }
        catch {
            // barcode disconnect
            this.#option.defer = undefined;
        }
        finally {
            // user cancel or end
        }
    }
    private async detectBarcode() {
        try {
            const video = this.#option.video;
            let bitMap = await createImageBitmap(video);
            bitMap = transfer(bitMap, [bitMap]);
            const videoRect = video.getBoundingClientRect();
            const visibleAspect = videoRect.width / videoRect.height;
            const detectedBarcode = await this.#option.detector?.detect(bitMap, this.#option.box!, visibleAspect);
            if (detectedBarcode?.rawValue) {
                this.#option.defer?.resolve({
                    rawValue: detectedBarcode.rawValue,
                    value: detectedBarcode.rawValue,
                    format: detectedBarcode.format
                });
            }
        } catch (err) {
            alert(err);
            console.error('Barcode detection failed', err);
        }
        finally {
            clearTimeout(this.#option.detectTOId);
            this.#option.detectAnimateId && cancelAnimationFrame(this.#option.detectAnimateId);
            this.#option.detectTOId = setTimeout(() => {
                this.#option.detectAnimateId = requestAnimationFrame(() => this.detectBarcode());
            }, 300) as any;
        }
    }
}