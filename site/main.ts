// Demo entry. A thin bootstrap: the doc-site shell is authored in Reactive TS
// (`app.rts`) and just mounted here. The HTML entry stays a plain `.ts` (rather than
// pointing index.html at an `.rts`) so we don't rely on `.rts` as a top-level Vite
// entry — importing `App` is enough for the Reactive TS plugin to transform it, and for
// the whole example/doc graph (markdown, `?raw` sources, demos) to be pulled in.
import { addToView } from "corrente";
import { App } from "./app.rts";

document.title = "Corrente - Reactive TS";

addToView(App);
