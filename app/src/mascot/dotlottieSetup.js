import { DotLottie } from '@lottiefiles/dotlottie-web';
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url';

// Serve our own copy of the renderer WASM through the bundler instead of fetching
// it from a CDN at runtime. Import this module before creating any DotLottie instance.
DotLottie.setWasmUrl(wasmUrl);
