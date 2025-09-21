import{C as o}from"./index-d5ey5pt3.chunk.js";function r(t){let e;return{get value(){if(e===void 0)e=t();return e}}}var n=r(()=>o(new Worker(new URL("./workers/CanvasWorker.js",import.meta.url),{type:"module"}))),a=r(()=>o(new Worker(new URL("./workers/GutenyeWorker.js",import.meta.url),{type:"module"}))),u={get canvas(){return n.value},get gutenye(){return a.value}},y=u;
export{y as x};
