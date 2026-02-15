Unit Builder UI
================

How to run
----------

1. Open a terminal in the `Tool` folder (one level above `ui`).
2. Start a simple HTTP server (Python 3):

```powershell
python -m http.server 8000
```

3. Open your browser at: `http://localhost:8000/ui/index.html`

Notes
-----
- The UI reads `../Units.json`, `../Platform.json`, and `../Ammo.json` relative to the `ui` folder.
- If the files are in a different place, either move them or edit `app.js` fetch paths.
