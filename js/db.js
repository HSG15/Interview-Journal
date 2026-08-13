/* ===================================================
   INTERVIEW JOURNAL — IndexedDB Offline Cache
   =================================================== */

window.DB = (() => {
  const DB_NAME = 'InterviewTrackerDB';
  const DB_VERSION = 1;
  let dbPromise = null;

  function initDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          
          if (!db.objectStoreNames.contains('companies')) {
            db.createObjectStore('companies', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('interview_rounds')) {
            const store = db.createObjectStore('interview_rounds', { keyPath: 'id' });
            store.createIndex('company_id', 'company_id', { unique: false });
          }
          if (!db.objectStoreNames.contains('questions')) {
            const store = db.createObjectStore('questions', { keyPath: 'id' });
            store.createIndex('interview_id', 'interview_id', { unique: false });
          }
          if (!db.objectStoreNames.contains('topics')) {
            db.createObjectStore('topics', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'sync_id', autoIncrement: true });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return dbPromise;
  }

  async function getStore(storeName, mode = 'readonly') {
    const db = await initDB();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  // Generic Operations
  async function getAll(storeName) {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(storeName, id) {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(storeName, data) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(storeName, id) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function clear(storeName) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function putAll(storeName, items) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Queue Operations for Offline Sync
  async function enqueueMutation(mutation) {
    // mutation = { table, action: 'insert'|'update'|'delete', data, timestamp }
    const store = await getStore('sync_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.add(mutation);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  
  async function getSyncQueue() {
    return getAll('sync_queue');
  }

  async function dequeueMutation(sync_id) {
    return remove('sync_queue', sync_id);
  }

  return {
    initDB, getAll, get, put, putAll, remove, clear,
    enqueueMutation, getSyncQueue, dequeueMutation
  };
})();
