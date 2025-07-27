// src/workers/VoskAudioProcessor.ts
class VoskAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (!input)
      return true;
    const output = new Float32Array(input.length);
    for (let i = 0;i < input.length; i++) {
      const s = input[i];
      output[i] = s == 1 ? 32767 : s * 32768;
    }
    this.port.postMessage(output, [output.buffer]);
    return true;
  }
}
registerProcessor("recognizer-processor", VoskAudioProcessor);
