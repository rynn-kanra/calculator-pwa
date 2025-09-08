let isPersisted = false;
class StorageService {
    public async persist() {
        if (isPersisted || !('persist' in navigator.storage)) {
            return;
        }

        isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
            return;
        }

        isPersisted = await navigator.storage.persist();
        return isPersisted;
    }
}

const service = new StorageService();
export default service;