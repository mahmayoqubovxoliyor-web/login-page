# Netlify Login App

This version is prepared for Netlify:
- Frontend: `index.html`
- Backend: Netlify Functions
- User storage: Netlify Blobs (persistent across deploys)
- Passwords: Node.js scrypt hashes

## Netlify
Connect this folder/repository to Netlify. The included `netlify.toml` configures the publish directory and Functions.

Set these environment variables in Netlify:
- `MASTER_EMAIL`
- `MASTER_PASSWORD`

The frontend calls `/api/auth/signup`, `/api/auth/login`, and `/api/auth/change-password`.


## Visual prank effect
The login page keeps the login/password UI. After the visitor's first click/touch/key action, a 2-second delay starts, then a full-viewport green/blue security-style visual appears. After 3 seconds it redirects to MotionElements. The visual script does not collect, store, or transmit login/password values.
