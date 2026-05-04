# Velocity Vault

A standalone browser racing game built with local-only profiles, age-band selection, upgrades, missions, and canvas racing.

## Play

Open `index.html` in a browser.

Use `Quick Play` to launch straight into a race, or `Enter Garage` to review vehicles, upgrades, missions, and AI tuning first.

Controls:

- `Left/Right` or `A/D`: steer
- `Up` or `W`: accelerate
- `Down` or `S`: brake, then reverse when stopped
- `Space`: boost while accelerating
- `P`: pause
- On touch screens, use the on-screen buttons
- Bluetooth/gamepad controllers: pair the controller with the device, press any controller button in the browser, then use left stick or D-pad to steer, RT / A to accelerate, LT / X to brake or reverse, B / RB to boost, and Start / Select to pause

Driver views:

- `Full Car`: third-person chase camera with the full performance car visible.
- `Half Car`: low hood-style view with the front of the car filling the lower screen.
- `Windshield`: cockpit-style view looking out through the windshield with dashboard framing.

Real-world style visuals:

- Race routes use real-world inspired locations: Pacific Coast Highway, Chicago lakefront skyline, Sedona red rock canyon, Rocky Mountain pass, Miami harbor, Aspen snowfields, and a Nevada airfield.
- Scenery includes skyline buildings, bridge cables, water, canyon walls, mountain silhouettes, street lamps, wet asphalt glare, roadside route signs, and pass-specific colors.
- Vehicles are original generic classes with shaded 3D-style silhouettes: street supercars, F1 open-wheel racers, grand prix prototypes, performance trucks, monster trucks, armored tanks, snowmobiles, race boats, helicopters, and sport airplanes. No real automaker, military, or aircraft trademarks or licensed models are used.
- Race opponents now line up against the player, change pace during the route, show names on the track, and affect finish position, rewards, and wins.
- Traffic uses rear-view performance silhouettes instead of overhead arcade sprites, with realistic road dashes and route markers replacing blocky lane pickups.
- Driving now uses real throttle behavior: gas to accelerate, brake to slow, and reverse after stopping instead of automatic forward motion.
- Police pursuit mode adds heat, sirens, flashing light bars, interceptor units, contact penalties, escape scoring, and cockpit pursuit alerts.
- Sound is generated locally with Web Audio: engine tone, boost feel, pickup chimes, collision hits, and police siren sweeps. No external audio files or network calls are used.
- Phone landscape racing moves touch controls to slim transparent edge buttons so steering, boost, pause, save, and view switching stay usable without covering the driving screen.
- `Save Race` stores the current run on the device, and `Resume Saved Race` appears in the Race Hub for the same driver profile.

Visual direction references:

- Need for Speed-style street-racing energy: heat, police pressure, risk/reward pursuit decisions, expressive speed effects.
- Forza Horizon-style scenic variety: coast roads, city streets, canyon routes, and mountain passes.
- Tokyo night-highway feel: neon signage, wet road reflections, tunnel/highway rhythm, and rival traffic tension.
- Sim/cockpit cues: windshield framing, steering wheel, dashboard speed readout, heat alert, and road-focused forward camera.

Graphics note: this is a practical standalone browser build using high-detail canvas rendering and 3D-style perspective. A true full 3D/console-level build would need a WebGL or game-engine asset pipeline, but this version is designed to load from GitHub Pages and install as a lightweight phone/computer app.

## Install As An App

Velocity Vault is now a Progressive Web App. To play it everywhere without this computer being on, put this folder on an HTTPS web host, open the hosted link once on the phone or computer, then install it:

- Android / Chrome / Edge: tap `Install / Add to Phone` or use the browser menu and choose install.
- iPhone / iPad Safari: tap Share, then `Add to Home Screen`.
- Windows / Edge / Chrome: click `Install / Add to Phone` or use the browser install icon.

After installation, the service worker caches the game files for offline play. The app can then launch from the phone or computer home screen without your PC being awake.

Good hosting options include GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any HTTPS web host. The temporary local download link from this PC is useful for transfer, but it cannot keep the phone app available after this computer turns off.

## Put It On This Computer

You can use Velocity Vault on this computer in three ways:

- Open `index.html` directly from this folder.
- Use the `Velocity Vault` desktop shortcut if one has been created.
- After publishing to GitHub Pages, open the secure hosted link in Edge or Chrome and click `Install / Add to Phone`. That creates a real app-style launcher in Windows.

The installed browser app is the cleanest computer version because it opens in its own window and caches files for offline play.

## Send It To Kids Or Testers

The best way to send the game to kids' phones is to publish the `publish` folder to GitHub Pages and send them the secure link:

`https://YOUR-GITHUB-USERNAME.github.io/velocity-vault/`

They can open the link on their phone and install it:

- iPhone / iPad: open in Safari, tap Share, tap `Add to Home Screen`.
- Android: open in Chrome or Edge, tap `Install / Add to Phone` or `Add to Home screen`.

Once installed, the game appears like an app icon and can play offline after the first load. Each phone keeps its own local driver profiles and PINs; profiles do not sync between devices.

You can also send `VelocityVault-Phone-Download.zip`, but most phones do not run zipped web apps as cleanly as a hosted secure link. The GitHub Pages link is the smoother option.

## Local AI Director

Velocity Vault includes a local agentic tuning director in the Garage AI tab. It reviews only the current on-device profile stats and rotates daily bonus events, reward multipliers, rival pacing, coin density, and upgrade recommendations.

This keeps the game feeling fresh without sending player data to any server. Because the game is fully standalone, it does not fetch online trend updates; new content can be added by editing the race, mission, event, and upgrade lists in `game.js`.

## Security Notes

- No network calls.
- No third-party scripts, fonts, or assets.
- Strict Content Security Policy in `index.html`.
- Offline app caching uses `sw.js` and same-origin files only.
- Profiles and optional PIN hashes stay in `localStorage` on this device.
- Controller support uses the browser Gamepad API only.
- The PIN is only for casual local separation between players; it is not a replacement for operating-system account security.
