import { copy } from "../Utility/copy";
import StorageService from "./StorageService";

export class LocalStorageService<T extends object> {
    constructor(private _type: new () => T, private _key: string, private _init: boolean = false) { }
    public get() {
        const d = localStorage?.getItem(this._key);
        let data: T | undefined = undefined;
        if (this._init) {
            data = new this._type();
        }
        if (d) {
            const dat = JSON.parse(d);
            data = copy(data, dat, true);
        }
        return data;
    }
    public set(data: T) {
        StorageService.persist();
        let dataStr = "";
        if (data !== null && data !== undefined) {
            dataStr = JSON.stringify(data);
        }

        localStorage?.setItem(this._key, dataStr);
    }
    public delete() {
        localStorage?.removeItem(this._key);
    }
}