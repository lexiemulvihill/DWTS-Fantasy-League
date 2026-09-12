// A drop-in replacement for the Claude-artifact `window.storage` API, backed
// by Firestore. Same shape (get/set/delete/list, a `shared` boolean), so the
// rest of the app doesn't need to know the difference.
//
// "Personal" data is scoped to this device's anonymous Firebase auth user.
// "Shared" data is a flat collection anyone with the doc key can read/write —
// the same trust model as before: the league code IS the access control.

import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase";

let authReady = null;
function ensureAuth() {
  if (!authReady) {
    authReady = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) { unsub(); resolve(user); }
        else signInAnonymously(auth).catch((e) => console.error("anon auth failed", e));
      });
    });
  }
  return authReady;
}

// Firestore doc IDs can't contain "/". Keys in this app never do, but this
// keeps things safe if that ever changes.
const safeId = (s) => s.replace(/\//g, "_");

async function refFor(key, shared) {
  if (shared) return doc(db, "shared", safeId(key));
  const user = await ensureAuth();
  return doc(db, "personal", `${user.uid}__${safeId(key)}`);
}

const storage = {
  async get(key, shared = false) {
    const ref = await refFor(key, shared);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { key, value: snap.data().value, shared };
  },

  async set(key, value, shared = false) {
    const ref = await refFor(key, shared);
    await setDoc(ref, { value, key, updatedAt: Date.now() });
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const ref = await refFor(key, shared);
    await deleteDoc(ref);
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    if (shared) {
      const snap = await getDocs(collection(db, "shared"));
      const keys = snap.docs.map((d) => d.data().key).filter((k) => k?.startsWith(prefix));
      return { keys, prefix, shared };
    }
    const user = await ensureAuth();
    const snap = await getDocs(collection(db, "personal"));
    const keys = snap.docs
      .filter((d) => d.id.startsWith(user.uid + "__") && d.data().key?.startsWith(prefix))
      .map((d) => d.data().key);
    return { keys, prefix, shared };
  },
};

export default storage;
