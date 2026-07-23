import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url';

// Point the dotLottie renderer at the WASM bundled by Vite, instead of the
// default node_modules path (which 404s) or the unpkg CDN fallback (blocked
// offline). Must use the standalone setWasmUrl the React wrapper reads — the
// DotLottie.setWasmUrl static does NOT affect DotLottieReact instances.
// Import this module before creating any player.
setWasmUrl(wasmUrl);
