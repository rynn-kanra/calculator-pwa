export type BarcodeData = {
    rawValue: string;
    value: string;
    format?: string;
}

export interface IBarcodeService {
    init(id?: string): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    dispose(): Promise<void>;
    [Symbol.asyncIterator](): AsyncIterator<BarcodeData>;
}
