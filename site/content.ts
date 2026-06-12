// The doc-site's routes: the sidebar nav and the content for each route. Markdown docs
// (the same files served on GitHub) render via DocPage, with live demos spliced in at
// their `demo=` fences; the full apps get their own AppPage (live app + source).
//
// CONTENT is keyed by route id and typed `TypeOrObservable<HTMLElement>` so app.rts can
// switch on it with a plain lookup — `CONTENT[selected]` — which Reactive TS lifts to a
// `switchMap` over the selected-route stream (the lookup-table flattening).
import { Component } from "corrente";
import { AppPage, DocPage, SourceFile } from "./doc-page.rts";

import overviewMd from "../README.md?raw";
import gettingStartedMd from "../docs/getting-started.md?raw";
import guideMd from "../docs/guide.md?raw";
import plainTsMd from "../docs/plain-typescript.md?raw";
import logoSvg from "../branding/corrente-logo.svg?raw";

// GitHub/npm resolve the README's relative logo path against the repo; the bundled doc-site
// has no such file at that URL, so inline the same SVG as a data URI for the Overview page.
const overviewWithLogo = overviewMd.replace(
  "branding/corrente-logo.svg",
  `data:image/svg+xml,${encodeURIComponent(logoSvg)}`,
);

import { TodoList } from "./todo-list/todo-list.rts";
import { SnakeGame } from "./snake-game/snake-game.rts";
import { Minesweeper } from "./minesweeper/minesweeper.rts";

import todoSrc from "./todo-list/todo-list.rts?raw";
import todoStylesSrc from "./todo-list/todo-list-styles.css?raw";

import snakeGameSrc from "./snake-game/snake-game.rts?raw";
import snakeStateSrc from "./snake-game/game.rts?raw";
import snakeLogicSrc from "./snake-game/game-logic.ts?raw";
import snakeConstantsSrc from "./snake-game/constants.ts?raw";
import snakeTypesSrc from "./snake-game/types.ts?raw";
import snakeStylesSrc from "./snake-game/snake-styles.css?raw";

import minesweeperSrc from "./minesweeper/minesweeper.rts?raw";
import minesweeperStateSrc from "./minesweeper/game.rts?raw";
import minesweeperLogicSrc from "./minesweeper/game-logic.ts?raw";
import minesweeperConstantsSrc from "./minesweeper/constants.ts?raw";
import minesweeperTypesSrc from "./minesweeper/types.ts?raw";
import minesweeperStylesSrc from "./minesweeper/minesweeper-styles.css?raw";

// Multi-file examples surface every relevant file as a tab in "View full source",
// entry component first, then state/logic/constants/types, with the stylesheet last.
const todoSources: SourceFile[] = [
  { name: "todo-list.rts", source: todoSrc },
  { name: "todo-list-styles.css", source: todoStylesSrc, lang: "css" },
];

const snakeSources: SourceFile[] = [
  { name: "snake-game.rts", source: snakeGameSrc },
  { name: "game.rts", source: snakeStateSrc },
  { name: "game-logic.ts", source: snakeLogicSrc },
  { name: "constants.ts", source: snakeConstantsSrc },
  { name: "types.ts", source: snakeTypesSrc },
  { name: "snake-styles.css", source: snakeStylesSrc, lang: "css" },
];

const minesweeperSources: SourceFile[] = [
  { name: "minesweeper.rts", source: minesweeperSrc },
  { name: "game.rts", source: minesweeperStateSrc },
  { name: "game-logic.ts", source: minesweeperLogicSrc },
  { name: "constants.ts", source: minesweeperConstantsSrc },
  { name: "types.ts", source: minesweeperTypesSrc },
  { name: "minesweeper-styles.css", source: minesweeperStylesSrc, lang: "css" },
];

export interface NavItem {
  id: string;
  title: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Docs",
    items: [
      { id: "overview", title: "Overview" },
      { id: "getting-started", title: "Getting Started" },
      { id: "guide", title: "Guide" },
      { id: "plain-typescript", title: "Plain TypeScript" },
    ],
  },
  {
    title: "Examples",
    items: [
      { id: "todo", title: "Todo List" },
      { id: "snake", title: "Snake" },
      { id: "minesweeper", title: "Minesweeper" },
    ],
  },
];

export const DEFAULT_ROUTE = "overview";

export const CONTENT = {
  overview: DocPage(overviewWithLogo),
  "getting-started": DocPage(gettingStartedMd),
  guide: DocPage(guideMd),
  "plain-typescript": DocPage(plainTsMd),
  todo: AppPage("Todo List", TodoList(), todoSources),
  snake: AppPage("Snake", SnakeGame(), snakeSources),
  minesweeper: AppPage("Minesweeper", Minesweeper(), minesweeperSources),
} satisfies Record<string, Component>;
