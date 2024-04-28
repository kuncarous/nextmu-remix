# NextMU Remix Web + REST API

## pnpm

You will need pnpm, if you want to use npm or yarn you will need to moidfy `package.json` file.
https://pnpm.io/installation

## Development

Run the Vite dev server:

```sh
pnpm run dev
```

To run Wrangler:

```sh
pnpm run build
pnpm run start
```

## Deployment

First, build your app for production:

```sh
pnpm run build
```

Then run the app in production mode:

```sh
pnpm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `pnpm run build`

-   `build/server`
-   `build/client`
