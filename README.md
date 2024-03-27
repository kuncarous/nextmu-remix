# NextMU Remix Cloudflare Web + REST API

## pnpm
You will need pnpm, if you want to use npm or yarn you will need to moidfy `package.json` file.
https://pnpm.io/installation

## Typegen

Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

You will need to rerun typegen whenever you make changes to `wrangler.toml`.

## Development

Run the Vite dev server:

```sh
npm run dev
```

To run Wrangler:

```sh
npm run build
npm run start
```

## Deployment

> [!WARNING]  
> Cloudflare does _not_ use `wrangler.toml` to configure deployment bindings.
> You **MUST** [configure deployment bindings manually in the Cloudflare dashboard][bindings].

First, build your app for production:

```sh
npm run build
```

Then, deploy your app to Cloudflare Pages:

```sh
npm run deploy
```

[bindings]: https://developers.cloudflare.com/pages/functions/bindings/
