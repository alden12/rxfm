# tsrx — live editor types (spike)

A minimal VS Code extension that gives `.tsrx` files **live TypeScript types**.
It contributes a tsserver plugin (`tsrx-ts-plugin`) that, on every keystroke,
transforms the imperative-observable source into real RxJS, lets VS Code's
built-in TypeScript type-check it, and maps the results back to your source. No
separate language server — it rides VS Code's built-in TS support.

## What you should see

Open [`../example.tsrx`](../example.tsrx) and hover the bindings:

```ts
declare const y: Observable<number>;
const z = 1;
const x = y + z;   // hover ⇒ const x: Observable<number>   (inferred, not annotated)
const w = x + z;   // hover ⇒ const w: Observable<number>   (propagated through x)
```

`y + z` shows **no** "Operator '+' cannot be applied to Observable" error.

## Install it (no dev host)

Build a `.vsix` and install it into your real VS Code — no Extension Development
Host needed:

```sh
# 1. install the tsserver plugin's deps (@volar/typescript), used by the bundler
cd tsrx/ts-plugin && npm install

# 2. install build deps and produce the .vsix
cd ../vscode-extension && npm install && npm run package
```

This bundles the `tsrx-ts-plugin` tsserver plugin self-contained (Volar inlined,
`typescript` left to the host) into `node_modules/tsrx-ts-plugin/` and emits
`tsrx-vscode-<version>.vsix`. Install it with either:

```sh
code --install-extension tsrx-vscode-0.0.1.vsix
```

…or the Extensions view → **⋯** → **Install from VSIX…**. Then open any `.tsrx`
file and hover the bindings.

## Develop it (Extension Development Host)

```sh
cd tsrx/ts-plugin && npm install
cd ../vscode-extension && npm install && npm run build   # build generates the plugin folder
```

Then in VS Code:

1. Open the `tsrx/vscode-extension` folder.
2. Press **F5** ("Run Extension") to launch the **Extension Development Host**.
3. In that window, open `tsrx/example.tsrx`.
4. Hover `x` / `w` — you should see `Observable<number>`.

> `npm run build` is what produces `node_modules/tsrx-ts-plugin/` (the bundled
> plugin tsserver loads by name); F5 and the packaged `.vsix` run identical code.
> Re-run it after editing anything under `../ts-plugin`.

> The plugin loads for VS Code's **bundled** TypeScript automatically. If you've
> selected a workspace TS version, `enableForWorkspaceTypeScriptVersions` keeps
> it working. If types don't appear, run **"TypeScript: Restart TS Server"** from
> the command palette.

## Known limitations (it's a spike)

- The transform builds a throwaway `Program` per change to infer types — correct
  but not fast. Fine for feeling it; an incremental setup comes later.
- The standalone Program resolves imports from disk relative to the file, so the
  `.tsrx` file must live inside this repo (where `node_modules/rxjs` is found).
- Only `+ - * /` on observables lift so far; no syntax highlighting for `.tsrx`
  yet (hover/errors work regardless).
