import * as idb from 'idb';
import { copy } from '../Utility/copy';
import { IndexedDBService } from './IndexedDBService';

interface KVContext extends idb.DBSchema {
    kv: {
        key: IDBValidKey;
        value: {
            key: IDBValidKey;
            value: any;
        };
    };
}

export class KVService {
    private _ixDbService: IndexedDBService<KVContext>;
    constructor(name: string = "kv", init?: (db: idb.IDBPDatabase<KVContext>, trx: idb.IDBPTransaction<KVContext, "kv"[], "versionchange">) => void) {
        this._ixDbService = new IndexedDBService({
            name: name,
            version: 1,
            upgrade:(db, oldV, newV, trx, event) => {
                db.createObjectStore('kv', {
                    keyPath: "key"
                });
                if (init) {
                    init(db, trx);
                    init = undefined;
                }
            }
        });
    }
    public async set<T = any>(key: IDBValidKey, value: T) {
        await this._ixDbService.set("kv", {
            key: key,
            value: value
        });
    }
    public async has(key: IDBValidKey) {
        return await this._ixDbService.has("kv", key);
    }
    public async get<T = object>(key: IDBValidKey, type?: new () => T & object) {
        const data = await this._ixDbService.get("kv", key);
        let value = data?.value;
        if (type) {
            value = copy(new type(), value, true);
        }

        return value;
    }
    public async delete(key: IDBValidKey) {
        await this._ixDbService.delete("kv", key);
    }
}