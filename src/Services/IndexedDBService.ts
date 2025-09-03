import * as idb from 'idb';
import StorageService from './StorageService';

type IDBTransactionStore<Schema extends idb.DBSchema, Tables extends idb.StoreNames<Schema>[]> = {
    [K in Extract<Tables[number], string>]: IndexedDbSet<Schema, K>
}
export class IndexedDbSet<Schema extends idb.DBSchema, Name extends idb.StoreNames<Schema>> {
    constructor(store: idb.IDBPObjectStore<Schema, [Name], Name, IDBTransactionMode>, deserialize?: <T extends (idb.StoreValue<Schema, Name> | undefined) >(val: T) => T) {
        this._store = store;
        this._deserialize = deserialize;
    }
    private _store: idb.IDBPObjectStore<Schema, [Name], Name, IDBTransactionMode>;
    private _deserialize?: <T extends (idb.StoreValue<Schema, Name> | undefined) >(val: T) => T;
    public async add(data: idb.StoreValue<Schema, Name>) {
        return await this._store.add?.(data);
    }
    public async set(data: idb.StoreValue<Schema, Name>) {
        return await this._store.put?.(data);
    }
    public async has(key: idb.StoreKey<Schema, Name>) {
        const dbKey = await this._store.getKey(key);
        return dbKey !== undefined;
    }
    public async get(key: idb.StoreKey<Schema, Name>) {
        let data = await this._store.get(key);
        if (this._deserialize) {
            data = this._deserialize(data);
        }
        return data;
    }
    public async getAll(count?: number) {
        const datas = await this._store.getAll(null, count);
        return datas?.map(o => {
            if (this._deserialize) {
                o = this._deserialize(o);
            }
            return o;
        }) ?? [];
    }
    public async delete(key: idb.StoreKey<Schema, Name>) {
        return await this._store.delete?.(key);
    }
}
export interface ContextOption<DBTypes extends idb.DBSchema> extends idb.OpenDBCallbacks<DBTypes> {
    name: string;
    version: number;
    deserialize?: {
        [K in keyof DBTypes]?: <T extends (DBTypes[K]["value"] | undefined) >(val: T) => T;
    }
}
export class IndexedDBService<Context extends idb.DBSchema> {
    private _db?: idb.IDBPDatabase<Context>;
    private _option: ContextOption<Context>;
    constructor(option: ContextOption<Context>) {
        this._option = option;
    }
    // consider idb
    protected async open(): Promise<idb.IDBPDatabase<Context>> {
        if (!this._db) {
            await StorageService.persist();
            this._db = await idb.openDB<Context>(this._option.name, this._option.version, this._option);
        }

        return this._db;
    }
    public async has<Name extends idb.StoreNames<Context>>(table: Name, key: idb.StoreKey<Context, Name>) {
        let d: boolean = false;
        await this.transaction([table], "readonly", async (obj) => {
            d = await obj[table as Extract<Name, string>].has(key as idb.StoreKey<Context, Extract<Name, string>>);
        });
        return d;
    }
    public async set<Name extends idb.StoreNames<Context>>(table: Name, data: idb.StoreValue<Context, Name>) {
        await this.transaction([table], async (obj) => {
            await obj[table as Extract<Name, string>].set(data as idb.StoreValue<Context, Extract<Name, string>>);
        });
    }
    public async get<Name extends idb.StoreNames<Context>>(table: Name, key: idb.StoreKey<Context, Name>) {
        let d: idb.StoreValue<Context, Name> | undefined;
        await this.transaction([table], "readonly", async (obj) => {
            d = await obj[table as Extract<Name, string>].get(key as idb.StoreKey<Context, Extract<Name, string>>) as idb.StoreValue<Context, Name> | undefined;
        });
        return d;
    }
    public async getAll<Name extends idb.StoreNames<Context>>(table: Name, count?: number) {
        let d: idb.StoreValue<Context, Name>[] | undefined;
        await this.transaction([table], "readonly", async (obj) => {
            d = await obj[table as Extract<Name, string>].getAll(count) as idb.StoreValue<Context, Name> | undefined;
        });
        return d ?? [];
    }
    public async delete<Name extends idb.StoreNames<Context>>(table: Name, key: idb.StoreKey<Context, Name>) {
        await this.transaction([table], async (obj) => {
            await obj[table as Extract<Name, string>].delete(key as idb.StoreKey<Context, Extract<Name, string>>);
        });
    }

    public async transaction<Names extends idb.StoreNames<Context>[]>(
        tables: Names, action: (stores: IDBTransactionStore<Context, Names>) => Promise<void>
    ): Promise<void>
    public async transaction<Names extends idb.StoreNames<Context>[]>(
        tables: Names,
        mode: IDBTransactionMode,
        action: (stores: IDBTransactionStore<Context, Names>) => Promise<void>
    ): Promise<void>
    public async transaction<Names extends idb.StoreNames<Context>[]>(
        tables: Names,
        modeOrAction: IDBTransactionMode | ((stores: IDBTransactionStore<Context, Names>) => Promise<void>),
        action?: (stores: IDBTransactionStore<Context, Names>) => Promise<void>
    ) {
        let mode: IDBTransactionMode = "readwrite";
        if (!action) {
            action = modeOrAction as (stores: IDBTransactionStore<Context, Names>) => Promise<void>;
        }
        else {
            mode = modeOrAction as IDBTransactionMode;
        }

        const db = await this.open();
        const tx = db.transaction(tables as any, mode);
        const sets = {} as any;
        for (const table of tables) {
            let set: IndexedDbSet<Context, Names[number]> | undefined = undefined;
            Object.defineProperty(sets, table as string, {
                get: () => {
                    if (!set) {
                        set = new IndexedDbSet(tx.objectStore(table), this._option.deserialize?.[table as any])
                    }

                    return set;
                }
            });
        }
        await action(sets as IDBTransactionStore<Context, Names>);
        tx.commit();
        await tx.done;
    }
}