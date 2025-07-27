// src/workers/VoskAudioProcessor.ts
const outputBufferLength = 4000;

class SphinxAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
  }
  process_2(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (!input)
      return true;
    const output = new Int16Array(input.length);
    let isSilent = true;
    for (let i = 0; i < input.length; i++) {
      const s = input[i];
      if (isSilent && (s != 0)) {
        isSilent = false;
      }
      output[i] = s == 1 ? 32767 : s * 32768;
    }
    if (!isSilent) {
      this.port.postMessage(output, [output.buffer]);
    }
    return true;
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (!input)
      return true;

    const inputBuffer = inputs[0];
    let recBuffers = [];
    var isSilent = true;
    for (var i = 0; i < inputBuffer[0].length; i++) {
      recBuffers.push((inputBuffer[0][i] + inputBuffer[1][i]) * 16383.0);
    }

    while (recBuffers.length > outputBufferLength) {
      var result = new Int16Array(outputBufferLength);
      var bin = 0,
        num = 0,
        indexIn = 0,
        indexOut = 0;
      while (indexIn < outputBufferLength) {
        bin = 0;
        num = 0;
        while (indexOut < Math.min(recBuffers.length, (indexIn + 1))) {
          bin += recBuffers[indexOut];
          num += 1;
          indexOut++;
        }
        result[indexIn] = bin / num;
        if (isSilent && (result[indexIn] != 0)) isSilent = false;
        indexIn++;
      }

      if (!isSilent) {
        this.port.postMessage(result, [result.buffer]);
      }
      recBuffers = recBuffers.slice(indexOut);
    }

    if (recBuffers.length) {
      var result = new Int16Array(recBuffers);
      this.port.postMessage(result, [result.buffer]);
    }

    return true;
  }
}
registerProcessor("recognizer-processor", SphinxAudioProcessor);

