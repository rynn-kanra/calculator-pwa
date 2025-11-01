import Ocr from "@gutenye/ocr-browser";
import { expose } from "@leoc11/comlink";

const instance = await Ocr.create({
    models: {
        detectionPath: '../assets/models/paddleocr-en/det.onnx',
        recognitionPath: '../assets/models/paddleocr-en/rec.onnx',
        dictionaryPath: '../assets/models/paddleocr-en/dictionary.txt'
    },
    onnxOptions: {
        executionProviders: ['webnn', 'webgpu', 'wasm'],
        graphOptimizationLevel: 'all'
    }
});
export default expose({
    detect: async function (image: Blob) {
        let blobUrl: string = "";
        try {
            blobUrl = URL.createObjectURL(image);
            const lines = await instance?.detect(blobUrl);
            return lines?.map(o => o.text).join("\n").replaceAll('\r', '') || "";
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    }
});