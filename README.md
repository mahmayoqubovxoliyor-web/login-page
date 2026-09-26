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
