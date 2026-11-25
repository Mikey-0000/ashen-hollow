# Deploying Ashen Hollow to Cloudflare

The game is static files only (no build step), so it deploys as-is.

## Option A: Cloudflare Pages from GitHub (easiest, auto-redeploys on push)
1. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Pick the `ashen-hollow` repo (authorise the Cloudflare GitHub app for it if asked).
3. Framework preset: None. Build command: leave empty. Build output directory: `/` (or `.`).
4. Save and Deploy. You get `https://ashen-hollow.pages.dev`.

## Option B: Drag and drop
Workers & Pages -> Create -> Pages -> Upload assets. Drag the project folder in.

## Option C: Command line (Wrangler)
    npm i -g wrangler
    wrangler login
    wrangler deploy        # uses wrangler.jsonc; .assetsignore keeps tools/ and config out
