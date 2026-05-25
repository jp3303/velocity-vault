# Apex Vault Command Cloud Hosting

Velocity Vault is ready to host as a secure static Progressive Web App on Apex Vault Command Cloud.

Target host: `https://apexvault.duckdns.org/`

## What To Upload

Use `VelocityVault-ApexVaultCommandCloud-StaticBundle.zip`.

The ZIP contains `index.html` at the top level, plus only the playable game files Apex should accept: `.html`, `.css`, `.js`, `.json`, and `.svg`. It does not include `.md`, `.pdf`, `.webmanifest`, extensionless, or underscore-prefixed files because the Apex upload gate blocks some non-app asset types.

It does not need a database, server runtime, paid API, or external asset host.

## Apex Setup

1. Create a new static web app, static site, or PWA deployment in Apex Vault Command Cloud.
2. Upload the ZIP contents, or connect the GitHub repository and point the deploy root at the repository root.
3. Set the entry file to `index.html`.
4. Turn on HTTPS.
5. Turn on service workers or PWA/offline support if Apex asks for that setting.
6. Set unknown route fallback to `index.html`.
7. Apply the security headers from `_headers` or `apex-vault-command-cloud.json`.
8. Publish the site and open the secure browser link on a phone or computer.
9. Install it from the browser menu with `Install`, `Add to Phone`, or `Add to Home Screen`.

## Required Files

- `index.html`
- `styles.css`
- `game.js`
- `phone-asset-pipeline.js`
- `webgl-pipeline.js`
- `manifest.json`
- `sw.js`
- `app-icon.svg`

The local project still keeps the README, Apex notes, source PDF, and deployment manifest outside the Apex upload ZIP.

## Security Profile

- Local-only game code.
- No third-party scripts.
- No CDN dependencies.
- No remote images, fonts, shaders, models, or audio.
- No backend database needed.
- Driver profiles, coins, upgrades, vehicle builds, saved races, and optional PIN hashes stay in the browser's local storage on each device.
- HTTPS is required for phone installation and reliable service-worker caching.

## After Publishing

Send the secure Apex link to testers. Each phone can install the game like an app, then play offline after the first full load.

If Apex gives you a custom domain option, point the domain to this deployment and keep HTTPS enabled.
