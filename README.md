# Velocity Vault

A standalone browser racing game built with local-only profiles, age-band selection, upgrades, missions, and canvas racing.

## Play

Open `index.html` in a browser.

Use `Play` to launch straight into a race, or `Enter Garage` to review vehicles, upgrades, missions, and AI tuning first.

Controls:

- `Left/Right` or `A/D`: steer
- `Up` or `W`: accelerate
- `Down` or `S`: brake, then reverse when stopped
- `Space`: boost while accelerating
- `P`: pause
- `R`: reset the vehicle after a crash or bad position
- On touch screens, use the on-screen controls. Phone Mini mode now uses a floating analog joystick: touch the driving screen, drag left/right to change lanes, and the car keeps accelerating while you steer. Pull the stick down only when you want brake/reverse. Full controls are still available from the `Size` button.
- Landscape scrolling stays available in menus and the garage; the full-screen no-scroll layout only turns on while a race is live.
- Bluetooth/gamepad controllers: pair the controller with the device, press any controller button in the browser, then use left stick or D-pad to steer, RT / A to accelerate, LT / X to brake or reverse, B / RB to boost, Y to reset, and Start / Select to pause

Driver views:

- `Full Car`: third-person chase camera with the full performance car visible.
- `Half Car`: low hood-style view with the front of the car filling the lower screen.
- `Windshield`: cockpit-style view looking out through the windshield with dashboard framing.
- `WebGL 3D`: hardware-accelerated 3D racing pipeline with a classic 2D fallback button for older browsers.

## How To Play

1. Choose `Play` to start immediately, or `Enter Garage` to pick a vehicle, route, upgrades, and missions.
2. Read the goal card at the start of each race. Goals can ask you to collect route markers, keep focus high, dodge rivals, or reach a target score.
3. Hold gas to build speed. On phones, use Mini mode by touching the driving screen; the floating joystick appears under your thumb and keeps gas active while you drag left or right.
4. Steer smoothly to pass opponents. Watch the lane radar, distance badges, and opponent names to see where rivals are sitting on the road.
5. Pull the phone joystick down, press `Down/S`, or use controller LT to brake. Once stopped, brake becomes reverse.
6. Use boost only while accelerating. Boost helps pass rivals, escape police heat, and recover speed after corners.
7. Crashes do not end the race. Heavy damage starts a reset countdown, then the car is stabilized so you can continue.
8. Save a race from the live race controls, then use `Resume Saved Race` in the Race Hub to continue that driver profile later.

Real-world style visuals:

- Race routes use real-world inspired locations across the country and world: Pacific Coast Highway, Chicago lakefront skyline, Sedona red rock canyon, Rocky Mountain pass, Miami harbor, Aspen snowfields, Nevada airfield, Texas freight interstate, Iowa farm roads, Tokyo expressway, Sahara desert, Amazon rainforest, and Swiss Alps.
- Scenery includes skyline buildings, bridge cables, water, canyon walls, mountain silhouettes, street lamps, wet asphalt glare, roadside route signs, farmland, big-rig freight stops, neon towers, desert dunes, rainforest canopy, alpine villages, and pass-specific colors.
- The v57 local GenAI scene director adds original route-specific racing scenes at runtime: trackside crowds, camera crews, brake boards, barriers, gantries, cranes, hangars, barns, cliffs, dunes, snowbanks, neon towers, tunnel frames, and cleaner phone-safe route atmosphere.
- Drifting now has stronger style cues with tire smoke, dust or snow wash by surface, darker skid arcs, racing-line marks, and a `DRIFT` callout during bigger slides.
- Vehicles are original generic classes with shaded 3D-style silhouettes: street supercars, F1 open-wheel racers, grand prix prototypes, performance trucks, semi truck racers, racing tractors, monster trucks, armored tanks, snowmobiles, race boats, helicopters, and sport airplanes. No real automaker, military, or aircraft trademarks or licensed models are used.
- Opponents now get generated race identity overlays with invented race numbers, livery stripes, driver/helmet silhouettes in glass areas, damage glow, and clearer name/position cues so rivals feel more like named racers instead of anonymous traffic.
- Engine, tire, boost, shield, and magnet upgrades apply across the whole roster, so semis and tractors can be upgraded into faster and more agile racing builds too.
- A local WebGL game-engine-style renderer (`webgl-pipeline.js`) draws the 3D road, route scenery, opponents, traffic, and vehicle models. It uses browser WebGL directly so the app stays standalone and secure without CDN scripts.
- A phone-focused local asset pipeline (`phone-asset-pipeline.js`) now generates cached high-resolution vehicle sprites, road texture maps, paint grain, glass, rim detail, light clusters, damage marks, and bloom overlays directly on the device. This gives the installed phone app richer assets without downloading licensed models or relying on remote servers.
- Phone graphics now add an extra cinematic realism pass with denser asphalt texture, rubber tire lanes, wet/oil reflections, stronger foreground depth, subtle film grain, route-tinted lighting, and higher-resolution vehicle paint/glass highlights. The harsh angular road marks were softened so the road reads like asphalt instead of spikes. On phones, the app uses the clean mobile canvas renderer plus the lower hood camera so the first race stays readable and avoids stacked road layers; the camera buttons still let players switch back to full-car or windshield views.
- Phone graphics now add a console-style chase pass inspired by modern open-world and street-racing presentation: lower camera framing, darker asphalt, softer horizon scenery, wet reflection ribbons, peripheral speed blur, headlight wash, and cleaner road markings so the phone view feels less like a flat arcade lane game.
- Phone clean-road mode now removes the remaining spike-like road artifacts on phones by disabling texture scratches, racing-line glow, tire/skid curves, wet streak ribbons, diagonal speed marks, extra contrast dashes, and diagonal snow/rain strokes while keeping flat asphalt, shoulders, and grounded lane dashes.
- The track now has stronger sweeping bends and route-country presentation for the phone/browser app. The same turn model drives the WebGL camera, road mesh, lane projection, traffic projection, road-edge chevrons, and phone overlay so the course feels like it is bending through cities, highways, coast roads, mountains, and world routes instead of staying on a flat straight strip.
- Road paint is now ground-locked with short dash plates and low pavement bands instead of long rising guide lines, so lane markings stay visually attached to the road while vehicles remain planted on the pavement.
- WebGL phone mode no longer draws the older transparent canvas road sheet over the 3D road. The actual WebGL pavement stays visible, while the overlay is limited to sky, scenery, route signs, and low flat pavement bands so nothing reads like a see-through ramp.
- Tokyo/city atmosphere markers now render as low horizontal neon glints instead of tall diagonal guide strokes, removing the last see-through marker lines that appeared to angle upward over the road.
- Phone WebGL mode now covers the pale see-through road sheet with an opaque, low asphalt surface while keeping WebGL projection for the planted vehicles. Mini-toggle mode also latches drive-stick direction until neutral is tapped, and the opponent grid is spread across longer gaps and separate lanes for clearer passing.
- Phone WebGL mode now removes the remaining mid-screen transparent road wash and moves the opaque asphalt lock higher under the horizon, so the race view no longer shows a see-through angled ramp. The compact 4-way stick now owns all mini-stick input by itself, and the rival grid starts much farther apart across separate lanes so you can chase, pass, and be passed instead of running into a bunched pack.
- Phone WebGL mode now removes the angled pavement trapezoid entirely on small screens and uses only horizontal low-ground shading, so the extra invisible road plane is no longer drawn over the real WebGL road. Phone scenery also avoids sharp floating triangle shapes, and the compact stick now has direct button fallback so pressing the up arrow always accelerates even on browsers that do not deliver the parent stick drag event.
- Phone racing now uses one clean mobile road stack: the old desktop road/scenery layer is skipped on phones, asphalt is opaque instead of see-through, texture is clipped inside the road, yellow chevron markers are replaced with flat road pips, and nearby opponents show distance/lane badges plus a compact lane radar so passing and collision avoidance are easier to read.
- Phone racing now uses a stronger v51 readability override: the mobile road gets high-contrast shoulders and brighter lane paint, opponents are forced into larger race gaps, and phone-only projection spreads far vehicles vertically so they no longer visually collapse into one cluster at the horizon.
- Phone racing now has a v52 passability fix: the AI field actively leaves an open passing lane near the player, random traffic is capped on small screens, overlapped cars are not drawn under the hood, hood view shows only the lower vehicle nose instead of a full top-down car, and phone scenery has a dedicated skyline/roadside backdrop.
- Phone racing now has a v58 fair-damage pass: hidden or unreadable traffic can no longer damage the player, close hazards are forced visible, road-edge drift warns and slows instead of silently destroying the vehicle, and the HUD names the cause whenever damage happens.
- Phone racing now has a v59 lane-feel pass: hood/cockpit/phone cameras follow the player lane, so lane stripes, markers, traffic, and rivals slide across the screen during steering instead of feeling like the car is only changing an invisible number.
- Online/browser racing now has a v62 lane-feel pass: desktop canvas and WebGL chase views use the same smoothed lane camera anchor as phone play, while the WebGL overlay keeps the player car and passable traffic moving visibly across the lane during right/left steering.
- The WebGL route pass now uses smoother world landmarks, neon signs, mounds, hangars, barns, freight stops, streetlights, trees, barriers, spectators, weather overlays, speed streaks, and detailed vehicle bodies instead of the first sharp spike scenery and plain box vehicles.
- The WebGL route pass also adds overhead highway gantries, neon vertical signs, harbor cranes, extra wet-road reflection strips, bridge-style structures, route curve camera targets, and route-specific foreground details so the world feels less empty and more like a real drive.
- Roads now include darker asphalt patches, reflective studs, shoulders, rumble strips, center paint, city crosswalk-style stripes, signs, spectator groups, guardrail details, and route-specific landmarks so each place reads more like a real location.
- Vehicles now have extra WebGL body details such as glass, headlights, grilles, side panels, mirrors, plates, rim highlights, rear wings on fast cars, larger stance cues for trucks, visible damage panels, and route-appropriate traffic types.
- WebGL mode now layers the high-detail canvas vehicle renderer over the 3D road, so player cars, opponents, police, and traffic keep readable wheels, glass, mirrors, trim, labels, brake lights, and damage marks instead of looking like simple boxes.
- Phone WebGL mode now prefers the generated asset sprites over the older simple procedural silhouettes, giving the app a more model-like vehicle read while staying light enough for mobile browsers.
- Race opponents now line up against the player, change pace during the route, show names on the track, show visible damage bars, take collision damage, limp when wrecked, and affect finish position, rewards, and wins.
- Opponent pack racing now uses a longer staggered grid, side-lane passing behavior, draft/catch-up pressure, and overtake tracking. You can pass opponents, they can draft back and pass you, and the phone HUD/finish screen show overtake progress.
- The starting grid now splits the pack with three opponents ahead and two behind, wider side-lane behavior, less early traffic clutter, and close-pass collision tuning so the player can actually overtake named rivals and climb position instead of staring at one grouped wall of vehicles.
- The v63 progression pass adds vehicle ownership, reputation unlocks, higher vehicle/upgrade pricing, per-vehicle saved builds, paint cycling, player license plates based on callsigns, and route rules so boats stay on water, aircraft race sky routes, tanks use military-style routes with a boost-button cannon, tractors stay on farm rallies, semis run freight, and monster trucks get off-road/arena-style routes.
- The v63 race pass tightens player hitboxes so hidden traffic should not damage the car from far ahead, spreads online/browser opponents much farther apart, applies the same passing-lane behavior outside phone mode, makes route markers harder to collect, lowers police frequency outside true pursuit conditions, adds civilian penalties, adds selected-route oncoming traffic, and adds stronger day/night lighting with street lamps and vehicle light glow.
- The v64 scenario pass adds more vehicle models and classes, including rally, drift, buggy, heavy tank, hydroplane, patrol boat, attack helicopter, and jet plane builds. It also adds local ghost/crew multiplayer-style race scenarios, longer hot-pursuit escalation, route hideouts such as garages, caves, hangars, barns, mountain tunnels, and marina cover, plus shortcut branches that open different road, water, sky, farm, freight, military, and world-route decisions during races.
- The v65 close-pass pass widens side-contact detection and makes nearby rivals steer apart faster, so passing reads as side-by-side racing or a scrape instead of the player car visually floating over another vehicle.
- The v66 visibility pass tightens desktop/WebGL hitboxes to a short road-distance window around the player car, adds route-stage scenery that changes during each race, and draws an actual finish gate/checkered road line so the route has a visible end instead of feeling endless.
- The v67 pickup-lane pass keeps coins and route markers inside safe painted lanes instead of letting outer pickups project onto the shoulder or off the road during curves.
- The v68 real-world detail pass adds shared browser, WebGL, and phone scenery layers with asphalt patches, raised reflectors, rumble strips, crosswalk/route paint, curve boards, sidewalks, roadside people, parked vehicles, telephone poles, fences, buildings, barns, cranes, hangars, water, hills, mountains, and location-specific road life. Vehicle bodies also get extra panel seams, plates, tire contact cues, light trim, grilles, utility details, and damage marks while staying original and unlicensed.
- The v69 real-world expansion adds route-signature environment pieces and more pavement hardware: overpasses, interstate gantries, expressway rails, piers, tunnel mouths, grain elevators, fuel stops, markets, speed cameras, mile markers, containers, radar towers, runway beacons, road drains, manholes, potholes, lane arrows, patched joints, shoulder wear, and foreground posts/curbs so phone and browser races feel more like moving through actual places.
- The v70 real-world texture pass adds ambient local life and surface storytelling: traffic lights, storefronts, cafe awnings, power lines, crosswalk crews, windsocks, windmills, ski lifts, kites, mist/dust clouds, route-specific road words, puddle reflections, road spray, snow/dust edges, cones, barrels, hydrants, benches, bollards, and extra near-road light pools while keeping the phone road flat and readable.
- The v71 place-detail pass adds place identity, district motion, and road-rule texture: route-specific horizon landmarks, destination boards, side-road cars and trucks, metro/tram/rail silhouettes, tiny boats, planes, service carts, pedestrian bridges, bridge expansion joints, underpass shadows, crosswalk/stop/hold-short markings, merge/bus/bike/truck lane paint, edge hash marks, snow/sand/leaves/wet buildup, and moving light pools so routes feel more like active real places without cluttering the driving line.
- The v72 route-atmosphere pass adds believable world edges around the race surface: place-specific shoulder terrain, water/wave/dock edges, city curbs, neon sidewalk glow, farm rows, desert sand, canyon rock, snow banks, runway and freight-yard service lines, micro landmarks such as kiosks, signs, cones, hay bales, guard posts, lamps, and subtle route weather like rain, snow, dust, sea spray, leaves, and night glow while keeping the main driving lane visible.
- The v73 route-sector pass makes scenery change more clearly as each race progresses: each sector gets unique horizon set pieces, sector boards, edge markings, tunnel lamps, bridge cables, checkpoint crews, city storefronts, airfield lights, freight-yard signs, farm gates, coastal props, and stage-specific roadside details so the route reads less like a repeating backdrop and more like driving through changing real places.
- The v74 living-world pass adds active roadside life outside the racing line: parked and service vehicles, route crews, spectators, workers, tents, kiosks, food stands, traffic signals, marshal cars, rescue trucks, fuel trucks, forklifts, farm pickups, snow plows, airfield carts, freight-yard activity, and place-specific crowd clusters so each route feels occupied without hiding the road or touch controls.
- The v75 surface-lighting pass gives the road more physical material feel: subtle road crown, moving wet/gloss reflections, rubber and seam marks, route-specific pavement streaks, coastal spray sheen, snow/ice shine, desert heat shimmer, farm dirt, freight diesel marks, runway glints, and neon night reflections while preserving a flat, readable phone driving lane.
- The v76 depth-infrastructure pass adds more real-world scale behind the race: parallax city blocks, mountains, dunes, water spans, fields, ports, rail yards, sound walls, guardrails, snow fences, stone walls, power lines, tram wires, lift cables, gantries, bridge cables, beacons, and far-side traffic silhouettes so the route feels deeper without putting clutter in the driving line.
- The v81 ground-visibility pass tightens player hit detection to the visible car position, reduces ahead-of-car side-scrape damage, brightens the readable road surface, and adds grounded real-world props such as storefronts, streetlights, guardrails, parked vehicles, crowds, route signs, barns, fences, containers, hangars, palms, rocks, pines, and barriers that sit on the roadside instead of floating in the haze.
- Opponents can now make wheel-to-wheel side contact when the player catches them, causing both vehicles to slow, push sideways, smoke, spin, lose focus, and keep damaged state instead of phasing through.
- Traffic uses rear-view performance silhouettes instead of overhead arcade sprites, with realistic road dashes and route markers replacing blocky lane pickups. Traffic and police no longer disappear on contact; damaged vehicles remain on the road until they move out of view.
- Driving now uses more realistic throttle, brake, reverse, steering inertia, lateral velocity, grip, road-edge slowdown, tire slip, corrected steering direction across touch, keyboard, and gamepad input, vehicle body yaw, damage-based acceleration loss, and damage-based handling loss instead of automatic forward motion or lane-snapping movement.
- Collision damage now appears in the HUD, finish stats, damage bar, car scuffs, smoke, cracked windshield overlays, impact flashes, and reset countdowns. At critical damage the vehicle enters a timed reset, and the manual `Reset Car` button or `R` key can recover from a bad crash position.
- Police pursuit mode adds heat, sirens, flashing light bars, interceptor units, contact penalties, escape scoring, and cockpit pursuit alerts.
- Sound is generated locally with Web Audio: engine tone, boost feel, pickup chimes, collision hits, and police siren sweeps. No external audio files or network calls are used.
- Driving effects include tire smoke, launch haze, boost exhaust, brake/slip wash, speed streaks, road reflections, depth haze, headlight wash, dust/snow/weather layers, camera shake, off-road drag, and car body lean during hard steering.
- Phone landscape racing moves touch controls to a transparent driver-pad overlay so steering, center, gas, brake/reverse, boost, pause, and touch mode switching stay usable without covering the driving screen.
- Touch controls use a multi-touch tracker plus pointer fallback so gas, brake, boost, and steering can stay active together until finger-up/cancel even if both thumbs are down at once.
- Phone mode has a separate in-game control layer fixed to the visible app window in both portrait and landscape. The default Mini layout is now a floating one-thumb joystick that appears under your touch, keeps gas active while you steer, releases cleanly when you lift your thumb, and leaves more of the driving screen open. Tapping `Full` expands the larger separate controls.
- The Mini floating joystick sends analog steering into the driving physics, keeps throttle active while steering sideways, supports brake/reverse only after a deliberate downward pull, and visually follows the player's touch instead of staying locked to a fixed D-pad position.
- Phone collision detection now uses a smaller distance-and-lane overlap check that matches the phone road projection, so traffic should only count as a crash when it is actually in your lane and close to your vehicle. Phone impacts also do less damage and push vehicles apart instead of repeatedly resetting the player.
- Race starts now show a clear goal card on the driving screen with the current challenge, route, longer-race pacing, and crash-recovery status.
- Crashes and total focus loss no longer end the race. Critical damage now starts a reset countdown, stabilizes the vehicle, and lets the player continue the same run.
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
- Race routes now run more than seven times longer than the original short sprint format and cannot finish before the opening minute-plus race window, so events land closer to a real 1-3 minute phone race instead of a quick arcade burst.

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

Good hosting options include Apex Vault Command Cloud, GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any HTTPS web host. The temporary local download link from this PC is useful for transfer, but it cannot keep the phone app available after this computer turns off.

## Host On Apex Vault Command Cloud

Velocity Vault is prepared for Apex Vault Command Cloud as a secure static PWA deployment at `https://apexvault.duckdns.org/`. Upload `VelocityVault-ApexVaultCommandCloud-StaticBundle.zip`, or connect the GitHub repository and use the repository root as the static deploy root.

Recommended Apex settings:

- App type: static web app, static site, or PWA.
- Entry file: `index.html`.
- HTTPS: on.
- Service workers/offline app support: on.
- Unknown route fallback: `index.html`.
- Required backend/runtime: none.
- Environment variables: none.
- Security headers: use `_headers` or `apex-vault-command-cloud.json`.
- ZIP shape: `index.html` must be at the top level of the ZIP, not inside another folder.
- Apex-safe manifest: the upload bundle uses `manifest.json` instead of `.webmanifest` because Apex blocks `.webmanifest` assets.
- Apex-safe asset list: the upload bundle excludes `.md`, `.pdf`, `.webmanifest`, extensionless, and underscore-prefixed files because Apex blocks some non-app asset types.

The Apex package keeps the game local-only: no third-party scripts, no CDN files, no server database, and no remote assets. Driver profiles, saved races, coins, reputation, upgrades, custom vehicle builds, and PIN hashes remain stored in each device browser.

After publishing, open the secure Apex link on the phone, then use the browser's `Install`, `Add to Phone`, or `Add to Home Screen` option.

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
