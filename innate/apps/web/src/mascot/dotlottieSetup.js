import { setWasmUrl } from '@lottiefiles/dotlottie-react';

// Point the dotLottie renderer at the WASM we serve from /public (copied from
// @lottiefiles/dotlottie-web by scripts/sync-static-assets.mjs), instead of
// the default node_modules path (which 404s) or the unpkg CDN fallback
// (blocked offline). Must use the standalone setWasmUrl the React wrapper
// reads — the DotLottie.setWasmUrl static does NOT affect DotLottieReact
// instances. Import this module before creating any player.
setWasmUrl('/dotlottie-player.wasm');
