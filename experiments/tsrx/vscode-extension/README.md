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

## Run it

```sh
# 1. install the tsserver plugin's deps (@volar/typescript)
cd experiments/tsrx/ts-plugin && npm install

# 2. install the extension (links tsrx-ts-plugin)
cd ../vscode-extension && npm install
```

Then in VS Code:

1. Open the `experiments/tsrx/vscode-extension` folder.
2. Press **F5** ("Run Extension") to launch the **Extension Development Host**.
3. In that window, open `experiments/tsrx/example.tsrx`.
4. Hover `x` / `w` — you should see `Observable<number>`.

> The plugin loads for VS Code's **bundled** TypeScript automatically. If you've
> selected a workspace TS version, `enableForWorkspaceTypeScriptVersions` keeps
> it working. If types don't appear, run **"TypeScript: Restart TS Server"** from
> the command palette in the dev-host window.

## Known limitations (it's a spike)

- The transform builds a throwaway `Program` per change to infer types — correct
  but not fast. Fine for feeling it; an incremental setup comes later.
- The standalone Program resolves imports from disk relative to the file, so the
  `.tsrx` file must live inside this repo (where `node_modules/rxjs` is found).
- Only `+ - * /` on observables lift so far; no syntax highlighting for `.tsrx`
  yet (hover/errors work regardless).
