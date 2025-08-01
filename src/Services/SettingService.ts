import { CalculatorConfig } from "../Model/CalculatorConfig";
import { copy } from "../Utility/copy";

let isPersisted = false;
class LocalStorageService<T extends object> {
    constructor(private _type: new () => T, private _key: string) { }
    public get() {
        const d = localStorage.getItem(this._key);
        let data = new this._type();
        if (d) {
            const dat = JSON.parse(d);
            data = copy(data, dat, true);
            data.defaultConfig.lineHeight = 1;
        }
        return data;
    }
    public set(data: T) {
        if (!isPersisted) {
            navigator.storage.persisted()
                .then(async persisted => {
                    isPersisted = persisted;
                    if (!persisted) {
                        isPersisted = await navigator.storage.persist();
                    }
                });
        }
        
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