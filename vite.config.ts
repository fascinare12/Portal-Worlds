import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Relative base so the built site works from any static host or subfolder.
// Each world is its own page in its own folder; add new worlds to `input`.
export default defineConfig({
  base: './',
  build: {
    // Modern browsers only: the Shibuya world waits for its textures before building the street.
    target: 'es2022',
    rollupOptions: {
      input: {
        wood: resolve(__dirname, 'index.html'),
        desert: resolve(__dirname, 'worlds/desert/index.html'),
        shibuya: resolve(__dirname, 'worlds/shibuya/index.html'),
        sea: resolve(__dirname, 'worlds/sea/index.html'),
        print: resolve(__dirname, 'worlds/print/index.html'),
        tapestry: resolve(__dirname, 'worlds/tapestry/index.html'),
        cosmos: resolve(__dirname, 'worlds/cosmos/index.html'),
        cosmosBudget: resolve(__dirname, 'worlds/cosmos/budget.html'),
        cosmosTwins: resolve(__dirname, 'worlds/cosmos/twins.html'),
        cosmosCones: resolve(__dirname, 'worlds/cosmos/cones.html'),
        cosmosFalling: resolve(__dirname, 'worlds/cosmos/falling.html'),
        cosmosTides: resolve(__dirname, 'worlds/cosmos/tides.html'),
        cosmosOrbits: resolve(__dirname, 'worlds/cosmos/orbits.html'),
        cosmosHorizons: resolve(__dirname, 'worlds/cosmos/horizons.html'),
        cosmosHoles: resolve(__dirname, 'worlds/cosmos/holes.html'),
        cosmosWormholes: resolve(__dirname, 'worlds/cosmos/wormholes.html'),
        canon: resolve(__dirname, 'worlds/canon/index.html'),
        canonCanon: resolve(__dirname, 'worlds/canon/canon.html'),
        canonRules: resolve(__dirname, 'worlds/canon/rules.html'),
        canonMirror: resolve(__dirname, 'worlds/canon/mirror.html'),
        canonNest: resolve(__dirname, 'worlds/canon/nest.html'),
        canonRecord: resolve(__dirname, 'worlds/canon/record.html'),
        canonLevels: resolve(__dirname, 'worlds/canon/levels.html'),
        canonLoop: resolve(__dirname, 'worlds/canon/loop.html'),
      },
    },
  },
});
