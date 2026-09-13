with open('src/App.jsx') as f:
    s = f.read()

old2 = '''    setCode(newCode);
    setMyId("p0");
    saveIdentity({ code: newCode, playerId: "p0" });
    persist(l);
    setScreen("lobby");'''
new2 = old2.replace('persist(l);', 'persist(l, newCode);')

if old2 in s:
    s = s.replace(old2, new2, 1)
    print("edit 2: applied")
else:
    print("edit 2: pattern NOT found")

old3 = '''    setCode(enterCode);
    setMyId(nextId);
    await saveIdentity({ code: enterCode, playerId: nextId });
    persist(l);
    setScreen(l.draftComplete ? "app" : l.screenHint || "lobby");'''
new3 = old3.replace('persist(l);', 'persist(l, enterCode);')

if old3 in s:
    s = s.replace(old3, new3, 1)
    print("edit 3: applied")
else:
    print("edit 3: pattern NOT found")

with open('src/App.jsx', 'w') as f:
    f.write(s)
