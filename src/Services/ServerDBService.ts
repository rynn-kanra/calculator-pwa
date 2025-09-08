import * as idb from 'idb';
import { DB_NAME } from '../Utility/config';
import { IndexedDBService } from './IndexedDBService';
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
    subscriptions: {
        key: string;
        value: PushSubscriptionJSON
    };
}

const a = new IndexedDBService<Context>({
    name: DB_NAME,
    version: 1,
    upgrade: (db) => {
        db.createObjectStore('users', {
            keyPath: "id"
        });
        db.createObjectStore('subscriptions', {
            keyPath: "endpoint"
        });
    }
});;

export default new IndexedDBService<Context>({
    name: DB_NAME,
    version: 1,
    upgrade: (db) => {
        db.createObjectStore('users', {
            keyPath: "id"
        });
        db.createObjectStore('subscriptions', {
            keyPath: "endpoint"
        });
    }
});