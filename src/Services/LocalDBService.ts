import { CalculatorConfig } from '../Model/CalculatorConfig';
import { LOCAL_DB_NAME } from '../Utility/config';
import { KVService } from './KVService';

export class VersionData {
    version!: string;
    app_files!: string[];
    assets!: string[];
};

class LocalDbService extends KVService {
    constructor(name: string) {
        super(name);
    }

    public async get<T = CalculatorConfig>(key: "setting"): Promise<T>;
    public async get<T = VersionData>(key: "version"): Promise<T>;
    public async get<T = Date>(key: "lastCheck"): Promise<T | undefined>;
    public async get<T = object>(key: IDBValidKey, type?: new () => T & object) {
        switch (key) {
            case "setting": {
                type = CalculatorConfig as any;
                break;
            }
            case "version": {
                type = VersionData as any;
                break;
            }
            case "lastCheck": {
                type = undefined;
                break;
            }
        }
        return super.get<T>(key, type);
    }

    public set<T = CalculatorConfig>(key: "setting", data: CalculatorConfig): Promise<void>;
    public set<T = VersionData>(key: "version", data: VersionData): Promise<void>;
    public set<T = Date>(key: "lastCheck", data: Date): Promise<void>;
    public async set<T = any>(key: IDBValidKey, data: T) {
        return super.set(key, data);
    }
}

export default new LocalDbService(LOCAL_DB_NAME);