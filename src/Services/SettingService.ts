import { CalculatorConfig } from "../Model/CalculatorConfig";

class LocalStorageService<T extends object> {
    constructor(private _type: new () => T, private _key: string) { }
    public get() {
        const d = localStorage.getItem(this._key);
        const data = new this._type();
        if (d) {
            const dat = JSON.parse(d);
            Object.assign(data, dat);
        }
        return data;
    }
    public set(data: T) {
        let dataStr = "";
        if (data !== null && data !== undefined) {
            dataStr = JSON.stringify(data);
        }

        localStorage.setItem(this._key, dataStr);
    }
    public delete() {
        localStorage.removeItem(this._key);
    }
}

const SettingService = new LocalStorageService<CalculatorConfig>(CalculatorConfig, "setting");
export default SettingService;