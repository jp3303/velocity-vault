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
- `R`: reset the vehicle after a crash or bad position
- On touch screens, use the on-screen buttons. Phone landscape mode has a dedicated multi-touch driver pad with left, center, right, gas, brake/reverse, boost, and a Hold/Toggle control mode switch. One thumb can stay on gas while the other steers.
- Landscape scrolling stays available in menus and the garage; the full-screen no-scroll layout only turns on while a race is live.
- Bluetooth/gamepad controllers: pair the controller with the device, press any controller button in the browser, then use left stick or D-pad to steer, RT / A to accelerate, LT / X to brake or reverse, B / RB to boost, Y to reset, and Start / Select to pause

Driver views:

- `Full Car`: third-person chase camera with the full performance car visible.
- `Half Car`: low hood-style view with the front of the car filling the lower screen.
- `Windshield`: cockpit-style view looking out through the windshield with dashboard framing.
- `WebGL 3D`: hardware-accelerated 3D racing pipeline with a classic 2D fallback button for older browsers.

Real-world style visuals:

- Race routes use real-world inspired locations across the country and world: Pacific Coast Highway, Chicago lakefront skyline, Sedona red rock canyon, Rocky Mountain pass, Miami harbor, Aspen snowfields, Nevada airfield, Texas freight interstate, Iowa farm roads, Tokyo expressway, Sahara desert, Amazon rainforest, and Swiss Alps.
- Scenery includes skyline buildings, bridge cables, water, canyon walls, mountain silhouettes, street lamps, wet asphalt glare, roadside route signs, farmland, big-rig freight stops, neon towers, desert dunes, rainforest canopy, alpine villages, and pass-specific colors.
- Vehicles are original generic classes with shaded 3D-style silhouettes: street supercars, F1 open-wheel racers, grand prix prototypes, performance trucks, semi truck racers, racing tractors, monster trucks, armored tanks, snowmobiles, race boats, helicopters, and sport airplanes. No real automaker, military, or aircraft trademarks or licensed models are used.
- Engine, tire, boost, shield, and magnet upgrades apply across the whole roster, so semis and tractors can be upgraded into faster and more agile racing builds too.
- A local WebGL game-engine-style renderer (`webgl-pipeline.js`) draws the 3D road, route scenery, opponents, traffic, and vehicle models. It uses browser WebGL directly so the app stays standalone and secure without CDN scripts.
- A phone-focused local asset pipeline (`phone-asset-pipeline.js`) now generates cached high-resolution vehicle sprites, road texture maps, paint grain, glass, rim detail, light clusters, damage marks, and bloom overlays directly on the device. This gives the installed phone app richer assets without downloading licensed models or relying on remote servers.
- Phone graphics now add an extra cinematic realism pass with denser asphalt texture, tar cracks, rubber tire lanes, wet/oil reflections, stronger foreground depth, subtle film grain, route-tinted lighting, and higher-resolution vehicle paint/glass highlights. On phones, the app also nudges new installs toward WebGL plus the lower hood camera so the first race feels less like a top-down arcade view; the camera buttons still let players switch back to full-car or windshield views.
- Phone graphics now add a console-style chase pass inspired by modern open-world and street-racing presentation: lower camera framing, darker asphalt, softer horizon scenery, wet reflection ribbons, peripheral speed blur, headlight wash, and cleaner road markings so the phone view feels less like a flat arcade lane game.
- The WebGL route pass now uses smoother world landmarks, neon signs, mounds, hangars, barns, freight stops, streetlights, trees, barriers, spectators, weather overlays, speed streaks, and detailed vehicle bodies instead of the first sharp spike scenery and plain box vehicles.
- The WebGL route pass also adds overhead highway gantries, neon vertical signs, harbor cranes, extra wet-road reflection strips, bridge-style structures, route curve camera targets, and route-specific foreground details so the world feels less empty and more like a real drive.
- Roads now include darker asphalt patches, reflective studs, shoulders, rumble strips, center paint, city crosswalk-style stripes, signs, spectator groups, guardrail details, and route-specific landmarks so each place reads more like a real location.
- Vehicles now have extra WebGL body details such as glass, headlights, grilles, side panels, mirrors, plates, rim highlights, rear wings on fast cars, larger stance cues for trucks, visible damage panels, and route-appropriate traffic types.
- WebGL mode now layers the high-detail canvas vehicle renderer over the 3D road, so player cars, opponents, police, and traffic keep readable wheels, glass, mirrors, trim, labels, brake lights, and damage marks instead of looking like simple boxes.
- Phone WebGL mode now prefers the generated asset sprites over the older simple procedural silhouettes, giving the app a more model-like vehicle read while staying light enough for mobile browsers.
- Race opponents now line up against the player, change pace during the route, show names on the track, show visible damage bars, take collision damage, limp when wrecked, and affect finish position, rewards, and wins.
- Opponent pack racing now uses a longer staggered grid, side-lane passing behavior, draft/catch-up pressure, and overtake tracking. You can pass opponents, they can draft back and pass you, and the phone HUD/finish screen show overtake progress.
- The starting grid now splits the pack with three opponents ahead and two behind, wider side-lane behavior, less early traffic clutter, and close-pass collision tuning so the player can actually overtake named rivals and climb position instead of staring at one grouped wall of vehicles.
- Opponents can now make wheel-to-wheel side contact when the player catches them, causing both vehicles to slow, push sideways, smoke, spin, lose focus, and keep damaged state instead of phasing through.
- Traffic uses rear-view performance silhouettes instead of overhead arcade sprites, with realistic road dashes and route markers replacing blocky lane pickups. Traffic and police no longer disappear on contact; damaged vehicles remain on the road until they move out of view.
- Driving now uses more realistic throttle, brake, reverse, steering inertia, lateral velocity, grip, road-edge slowdown, tire slip, corrected steering direction across touch, keyboard, and gamepad input, vehicle body yaw, damage-based acceleration loss, and damage-based handling loss instead of automatic forward motion or lane-snapping movement.
- Collision damage now appears in the HUD, finish stats, damage bar, car scuffs, smoke, cracked windshield overlays, impact flashes, and reset countdowns. At critical damage the vehicle enters a timed reset, and the manual `Reset Car` button or `R` key can recover from a bad crash position.
- Police pursuit mode adds heat, sirens, flashing light bars, interceptor units, contact penalties, escape scoring, and cockpit pursuit alerts.
- Sound is generated locally with Web Audio: engine tone, boost feel, pickup chimes, collision hits, and police siren sweeps. No external audio files or network calls are used.
- Driving effects include tire smoke, launch haze, boost exhaust, brake/slip wash, speed streaks, road reflections, depth haze, headlight wash, dust/snow/weather layers, camera shake, off-road drag, and car body lean during hard steering.
- Phone landscape racing moves touch controls to a transparent driver-pad overlay so steering, center, gas, brake/reverse, boost, pause, and touch mode switching stay usable without covering the driving screen.
- Touch controls use a multi-touch tracker plus pointer fallback so gas, brake, boost, and steering can stay active together until finger-up/cancel even if both thumbs are down at once.
- Phone mode has a separate in-game control dock that is fixed to the visible app window in both portrait and landscape. The default Mini layout is now one compact 4-way drive stick: push up for gas, down for brake/reverse, left/right for steering, and drag diagonally to accelerate while steering. Tapping `Full` expands the larger separate controls.
- The Mini 4-way drive stick now works in both Hold and Toggle modes. Dragging the stick updates gas, brake/reverse, and steering live, and lifting your thumb releases the movement so the car does not stay stuck turning or accelerating.
- The Mini 4-way drive stick now calculates direction from the whole circular stick area with extra edge margin, so diagonal up-left/up-right steering keeps working even if a thumb slides into the gap between arrow buttons.
- The Mini 4-way drive stick now sends analog touch steering into the driving physics and gets a stronger low-speed steering response, so pushing up-left or up-right accelerates and turns immediately instead of only going straight.
- Generated vehicle sprites now draw with stronger tire contact shadows, dark tire contact patches, short road streaks, and lower pavement anchoring so cars, trucks, semis, tractors, and opponents read as driving on the road instead of floating above it.
- Phone and browser race views now generate rear/chase-view road vehicle sprites with the wheel bottoms used as the tire-contact anchor, so cars, trucks, semis, tractors, tanks, and snowmobiles sit on the pavement instead of reading like overhead stickers.
- Vehicle tire anchors are now pushed to the bottom of the generated sprite, and every grounded vehicle draws a hard pavement clamp directly across the tire line so there is no transparent gap that can read as floating.
- The player chase camera now places the car lower on the road plane and draws stronger vertical tire contact streaks, so the vehicle reads as planted on the foreground pavement instead of hovering over it.
- Grounded vehicle sprites now use the true generated wheel line as their contact anchor, then sink that anchor into the road by vehicle weight. This makes tires overlap the asphalt instead of hovering just above it.
- Race-view vehicles now draw wider and shorter, with neutral road markings replacing the yellow accent streaks that cluttered the screen. The chase camera favors a planted rear-view car shape instead of a tall angled sprite.
- Browser and phone vehicles now get heavier road grounding with lowered sprite anchoring, black tire sidewall pins, hard road-contact pads, and WebGL ground shadows under every moving vehicle.
- Traffic, police, opponents, and route markers now use road-distance projection instead of raw screen-height movement, so vehicles enter from the road horizon and stay locked to the pavement instead of falling down from the sky.
- Vehicle drawing now uses the tire/contact line as the screen anchor, so generated sprites grow upward from the pavement instead of hovering around a center point.
- Road motion now has an explicit speed-linked pass with moving asphalt bands, lane dashes, shoulder streaks, texture drift, and faster WebGL track markers so the pavement visibly moves when the player accelerates.
- Road paint now uses flat perspective quads and lower WebGL ground markers, while vehicle sprites use a lower tire-contact anchor and stronger contact shadows so tires and road lines sit on the pavement instead of floating above it.
- WebGL mode now projects every canvas vehicle sprite from the WebGL road plane, then pins the generated vehicle art to a tire-contact origin with visible tire pads and contact shadows. This keeps opponents, police, traffic, and the player car visually attached to the same pavement perspective as the 3D road.
- WebGL chase, hood, and cockpit cameras now use a flatter forward-looking road angle, plus a stronger foreground asphalt pass with horizontal pavement bands. The near road reads as flat ground under the tires instead of a ramp climbing up the screen.
- Vehicle sprites in WebGL mode now use a visible-road projection instead of the steep camera projection, with stronger spacing by distance and far-to-near draw ordering. This keeps cars from clustering high in the scene or appearing to climb into the sky while the moving pavement stays underneath them.
- Opponent, police, route marker, and traffic visibility now use the same visible road projection as their final draw position, keeping the far pack on the actual road horizon instead of letting older screen-height math place them above the road.
- WebGL mode now keeps road paint in the 3D ground layer and draws the high-detail vehicle sprites on top, preventing 2D road streaks or duplicate low-poly vehicles from appearing to float in front of the race.
- The Vehicles garage now paints real generated preview images for every vehicle class, including cars, F1, prototypes, trucks, semis, tractors, monster trucks, tanks, snowmobiles, boats, helicopters, and airplanes.
- `Save Race` stores the current run on the device, and `Resume Saved Race` appears in the Race Hub for the same driver profile.
- New and existing local profiles now get a starter garage budget and early reputation so vehicle switching, upgrades, freight racing, farm racing, and Tokyo-style routes are available quickly instead of feeling locked.
- Race routes now run almost six times longer than the original short sprint format, so races feel more like full events instead of quick arcade bursts.

Visual direction references:

- Need for Speed-style street-racing energy: heat, police pressure, risk/reward pursuit decisions, expressive speed effects.
- Forza Horizon-style scenic variety: coast roads, city streets, canyon routes, and mountain passes.
- Tokyo night-highway feel: neon signage, wet road reflections, tunnel/highway rhythm, and rival traffic tension.
- Sim/cockpit cues: windshield framing, steering wheel, dashboard speed readout, heat alert, and road-focused forward camera.

Graphics note: this is a practical standalone browser build with both WebGL 3D rendering and high-detail canvas fallback. It is not using licensed console-game assets, but the rendering pipeline is now structured so deeper 3D models, tracks, lighting, and physics can be added over time.

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
- WebGL rendering is local-only and does not load shaders, models, scripts, or textures from the network.
- Phone graphics assets are generated locally at runtime and cached in memory; no third-party model, texture, or image files are fetched.
- Profiles and optional PIN hashes stay in `localStorage` on this device.
- Controller support uses the browser Gamepad API only.
- The PIN is only for casual local separation between players; it is not a replacement for operating-system account security.
