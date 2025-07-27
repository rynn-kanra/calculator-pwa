declare module './VoskAudioProcessor' {
  interface AudioWorkletNodeOptions {
    numberOfInputs?: number;
    numberOfOutputs?: number;
    outputChannelCount?: number[];
    channelCount?: number;
    channelCountMode?: 'max' | 'clamped-max' | 'explicit';
    channelInterpretation?: 'speakers' | 'discrete';
    processorOptions?: any; // 👈 Custom options passed to the processor
  }

  abstract class AudioWorkletProcessor {
    readonly port: MessagePort;
    constructor(options?: AudioWorkletNodeOptions);

    abstract process(
      inputs: Float32Array[][],
      outputs: Float32Array[][],
      parameters: Record<string, Float32Array>
    ): boolean;

    static parameterDescriptors?: AudioParamDescriptor[];
  }

  interface AudioParamDescriptor {
    name: string;
    defaultValue?: number;
    minValue?: number;
    maxValue?: number;
    automationRate?: 'a-rate' | 'k-rate';
  }

  function registerProcessor(
    name: string,
    processorCtor: typeof AudioWorkletProcessor
  ): void;
}

class VoskAudioProcessor extends AudioWorkletProcessor {
  constructor(options: AudioWorkletNodeOptions) {
    super(options);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0][0];
    if (!input) return true;

    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = input[i];
      output[i] = s == 1 ? 0x7FFF : s * 0x8000;
    }
    this.port.postMessage(output, [output.buffer as ArrayBuffer]);
    return true;
  }
}

registerProcessor('recognizer-processor', VoskAudioProcessor);
export { };