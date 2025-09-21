import { wrap } from "comlink";
import CanvasWorker from "../Workers/CanvasWorker";

const worker = new Worker(new URL('./workers/CanvasWorker.js', import.meta.url), {
    type: 'module'
});
export default wrap<typeof CanvasWorker>(worker);