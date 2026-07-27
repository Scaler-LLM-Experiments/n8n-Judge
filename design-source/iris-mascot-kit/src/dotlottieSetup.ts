import { DotLottie } from '@lottiefiles/dotlottie-web'
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'

// dotlottie-web fetches its renderer WASM from a CDN by default; serve our own copy
// through the bundler instead so the mascot works offline, inside the B2B iframe CSP,
// and without a third-party dependency at runtime. Import this module before creating
// any DotLottie instance (MascotPlayer does).
DotLottie.setWasmUrl(wasmUrl)
