/// <reference lib="webworker" />

let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let width = 300, height = 100;
const silentData = new Uint8Array([128, 0, 0, 0, 128]);

self.onmessage = (e) => {
    if (e.data.canvas) {
        canvas = e.data.canvas;
        ctx = canvas.getContext('2d')!;
        width = canvas.width;
        height = canvas.height;
        draw(silentData);
    } else if (e.data.audioData) {
        draw(e.data.audioData);
    }
    else if (e.data.silence) {
        draw(silentData);
    }
};

function draw(dataArray: Uint8Array) {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#4caf50';
    ctx.beginPath();

    const sliceWidth = width / Math.floor((dataArray.length - 1) / 4);
    let x = 0;

    for (let i = 0, len = dataArray.length; i < len; i += 4) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }

    ctx.stroke();
}
