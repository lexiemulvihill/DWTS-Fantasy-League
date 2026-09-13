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
    'function Lobby({ league, myId, onReady, onRandomize, onFillBots, reveal }) {',
    'function Lobby({ league, myId, onReady, onRandomize, onFillBots, onLeave, reveal }) {',
    'Lobby signature',
)

apply(
    'src/App.jsx',
    '''        <button className="btn btn-secondary" style={{ width: "100%" }} onClick={onReady}>Not ready</button>
      )}
    </div>
  );
}''',
    '''        <button className="btn btn-secondary" style={{ width: "100%" }} onClick={onReady}>Not ready</button>
      )}

      {onLeave && (
        <button
          style={{
            display: "block", margin: "18px auto 0", fontSize: 12.5,
            background: "none", border: "none", color: "var(--muted)",
            textDecoration: "underline", cursor: "pointer",
          }}
          onClick={() => { if (window.confirm("Leave this league? You can rejoin later with the code.")) onLeave(); }}
        >
          Not you, or joined by mistake? Leave this league
        </button>
      )}
    </div>
  );
}''',
    'Lobby leave button',
)

apply(
    'src/App.jsx',
    '''        <Lobby league={league} myId={myId} onReady={toggleReady} onRandomize={randomizeOrder}
          onFillBots={myId === "p0" ? fillWithBots : null} reveal={reveal} />''',
    '''        <Lobby league={league} myId={myId} onReady={toggleReady} onRandomize={randomizeOrder}
          onFillBots={myId === "p0" ? fillWithBots : null} onLeave={leaveLeague} reveal={reveal} />''',
    'Lobby render call',
)
