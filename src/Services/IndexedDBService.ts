import * as idb from 'idb';
import { DB_NAME } from '../Utility/config';
export interface User {
    id: string,
    credId: Uint8Array,
    publicKey: Uint8Array
}
interface Context extends idb.DBSchema {
    users: {
        key: string;
        value: User;
    };
}

class IndexedDBService {
    private _db?: idb.IDBPDatabase<Context>;
    private _dbName: string;
    private _dbVersion: number;
    constructor(dbName: string, dbVersion: number = 1) {
        this._dbName = dbName;
        this._dbVersion = dbVersion;
    }
    // consider idb
    public async open(): Promise<idb.IDBPDatabase<Context>> {
        if (!this._db) {
            this._db = await idb.openDB<Context>(this._dbName, this._dbVersion, {
                upgrade: (db) => {
                    db.createObjectStore('users', {
                        keyPath: "id"
                    });
                }
            });
        }

        return this._db;
    }
    public async save(table: string, data: any) {
        const db = await this.open();
        const tx = db.transaction(table as any, "readwrite");
        await Promise.all([
            tx.store.put(data),
            tx.done
        ]);
    }
    public async get(table: string, key: any) {
        const db = await this.open();
        const tx = db.transaction(table as any, "readwrite");
        const d = await Promise.all([
            tx.store.get(key),
            tx.done
        ]);

        return d[0];
    }
}

export default new IndexedDBService(DB_NAME);