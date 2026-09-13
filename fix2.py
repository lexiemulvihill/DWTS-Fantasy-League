def apply(path, old, new, label):
    with open(path) as f:
        s = f.read()
    if old not in s:
        print(label + ": PATTERN NOT FOUND")
        return
    s = s.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(s)
    print(label + ": applied")

# storage.js edit 1: add runTransaction to the import
apply(
    'src/storage.js',
    'import {\n  doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where,\n} from "firebase/firestore";',
    'import {\n  doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, runTransaction,\n} from "firebase/firestore";',
    'storage.js import',
)

# storage.js edit 2: add the transactShared helper before the default export
apply(
    'src/storage.js',
    'export default storage;',
    '''// Safe concurrent update for a shared doc: reads whatever the LATEST server
// value actually is (never a locally-cached copy from a few seconds ago),
// lets updateFn decide what the new value should be based on that, and
// writes it back -- all as one atomic step. If two devices try this at the
// same instant, Firestore automatically retries the loser against the
// winner's result, so an update never silently vanishes underneath another
// device's write the way a plain overwrite can.
export async function transactShared(key, updateFn) {
  const ref = doc(db, "shared", safeId(key));
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? JSON.parse(snap.data().value) : null;
    const next = updateFn(current);
    tx.set(ref, { value: JSON.stringify(next), key, updatedAt: Date.now() });
    return next;
  });
}

export default storage;''',
    'storage.js transactShared',
)

# App.jsx edit 1: import transactShared alongside the default storage import
apply(
    'src/App.jsx',
    'import storage from "./storage";',
    'import storage, { transactShared } from "./storage";',
    'App.jsx import',
)

# App.jsx edit 2: rewrite joinLeague to use the atomic transaction
apply(
    'src/App.jsx',
    '''  /* ---- join ---- */
  async function joinLeague({ code: enterCode, name, team }) {
    const found = await loadShared(leagueKey(enterCode));
    if (!found) return { error: "No league found with that code." };
    if (found.players.length >= 4) return { error: "That league already has four players." };
    const nextId = "p" + found.players.length;
    const l = structuredClone(found);
    l.players.push({ id: nextId, name, team: team || "New Squad" });
    l.ready[nextId] = false;
    setCode(enterCode);
    setMyId(nextId);
    await saveIdentity({ code: enterCode, playerId: nextId });
    persist(l, enterCode);
    setScreen(l.draftComplete ? "app" : l.screenHint || "lobby");
    return { ok: true };
  }''',
    '''  /* ---- join ---- */
  async function joinLeague({ code: enterCode, name, team }) {
    try {
      const next = await transactShared(leagueKey(enterCode), (current) => {
        if (!current) throw new Error("NOT_FOUND");
        if (current.players.length >= 4) throw new Error("FULL");
        const nextId = "p" + current.players.length;
        const l = structuredClone(current);
        l.players.push({ id: nextId, name, team: team || "New Squad" });
        l.ready[nextId] = false;
        return l;
      });
      const myNewId = next.players[next.players.length - 1].id;
      setCode(enterCode);
      setMyId(myNewId);
      await saveIdentity({ code: enterCode, playerId: myNewId });
      setLeague(next);
      setScreen(next.draftComplete ? "app" : next.screenHint || "lobby");
      return { ok: true };
    } catch (e) {
      if (e.message === "NOT_FOUND") return { error: "No league found with that code." };
      if (e.message === "FULL") return { error: "That league already has four players." };
      return { error: "Something went wrong joining. Try again." };
    }
  }''',
    'App.jsx joinLeague',
)

# App.jsx edit 3: rewrite toggleReady + randomizeOrder to use the atomic transaction
apply(
    'src/App.jsx',
    '''  function toggleReady() {
    const l = structuredClone(league);
    l.ready[myId] = !l.ready[myId];
    persist(l);
  }
  function randomizeOrder() {
    const l = structuredClone(league);
    const ids = l.players.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    l.draftOrder = ids;
    l.screenHint = "draft";
    persist(l);
    setReveal(true);
    setTimeout(() => { setReveal(false); setScreen("draft"); }, 2800);
  }''',
    '''  async function toggleReady() {
    const next = await transactShared(leagueKey(code), (current) => {
      const l = structuredClone(current);
      l.ready[myId] = !l.ready[myId];
      return l;
    });
    setLeague(next);
  }
  async function randomizeOrder() {
    const next = await transactShared(leagueKey(code), (current) => {
      const l = structuredClone(current);
      const ids = l.players.map((p) => p.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      l.draftOrder = ids;
      l.screenHint = "draft";
      return l;
    });
    setLeague(next);
    setReveal(true);
    setTimeout(() => { setReveal(false); setScreen("draft"); }, 2800);
  }''',
    'App.jsx toggleReady/randomizeOrder',
)
