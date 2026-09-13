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

apply(
    'src/App.jsx',
    '''  useEffect(() => {
    (async () => {
      const id = await loadIdentity();
      if (id) {
        const [l, p] = await Promise.all([loadShared(leagueKey(id.code)), loadShared(photoKey(id.code))]);
        if (l) {
          setCode(id.code);
          setMyId(id.playerId);
          setLeague(l);
          if (p) setPhotos(p);
          setScreen(l.draftComplete ? "app" : l.screenHint || "lobby");
          return;
        }
        // The league this device remembers no longer exists in shared storage.
        await clearIdentity();
      }
      setScreen("welcome");
    })();
  }, []);''',
    '''  useEffect(() => {
    (async () => {
      const id = await loadIdentity();
      if (id) {
        const [l, p] = await Promise.all([loadShared(leagueKey(id.code)), loadShared(photoKey(id.code))]);
        if (l && l.players.some((p) => p.id === id.playerId)) {
          setCode(id.code);
          setMyId(id.playerId);
          setLeague(l);
          if (p) setPhotos(p);
          setScreen(l.draftComplete ? "app" : l.screenHint || "lobby");
          return;
        }
        await clearIdentity();
      }
      setScreen("welcome");
    })();
  }, []);''',
    'App.jsx mount identity check',
)
