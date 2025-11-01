import { wrap } from "@leoc11/comlink";
import { lazy } from "../Utility/lazy";
import type CanvasWorker from "../Workers/CanvasWorker";
import type GutenyeWorker from "../Workers/GutenyeWorker";

const canvasWorker = lazy(() => wrap<typeof CanvasWorker>(new Worker(new URL('./workers/CanvasWorker.js', import.meta.url), {
    type: 'module'
})));
const gutenyeWorker = lazy(() => wrap<typeof GutenyeWorker>(new Worker(new URL('./workers/GutenyeWorker.js', import.meta.url), {
    type: 'module'
})));
const service = {
    get canvas() {
        return canvasWorker.value;
    },
    get gutenye() {
        return gutenyeWorker.value;
    }
};

export default service;