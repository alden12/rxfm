// Entry: a .ts file (which Vite's dev server treats as a module) that imports
// the .rts component, pulling it into the module graph so our plugin transforms
// it. Importing .rts directly from <script src> would be served raw, because
// Vite only runs its JS pipeline for known extensions.
import './examples/app.rts';
