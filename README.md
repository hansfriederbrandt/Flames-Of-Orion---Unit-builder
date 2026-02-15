Unit Builder UI
================

How to run
----------

1. Download Source Files
2. Unzip in a folder
1. Open a terminal in the Main folder
2. Start a simple HTTP server (Python 3):

```powershell
python -m http.server 8000
```

3. Open your browser at: `http://localhost:8000/index.html`

Notes
-----
- The UI reads `../Units.json`, `../Platform.json`, and `../Ammo.json` relative to the `ui` folder.
- If the files are in a different place, either move them or edit `app.js` fetch paths.

How to use
-----
1. Choose a Unit Type from the top dropdown
2. Choose platforms from the dropdowns below
3. Choose ammo where it is possible

Modifiers from platforms that change Base Stats are added automaticly
Extra Platforms from Upgrade are added as 2 new Platform keeping the upgrade in the list
Specials are displayed under the platform and ammo
