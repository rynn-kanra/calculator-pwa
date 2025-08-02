
export interface IOCRService {
    init(): Promise<void>;
    recognize(input: File, lang?: string): Promise<string>;
}

export abstract class OCRService implements IOCRService {
    abstract init(): Promise<void>;
    abstract recognize(input: File, lang?: string): Promise<string>;
}