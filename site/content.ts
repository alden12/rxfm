// The doc-site's routes: the sidebar nav and the content for each route. Markdown docs
// (the same files served on GitHub) render via DocPage, with live demos spliced in at
// their `demo=` fences; the full apps get their own AppPage (live app + source).
//
// CONTENT is keyed by route id and typed `TypeOrObservable<HTMLElement>` so app.rts can
// switch on it with a plain lookup — `CONTENT[selected]` — which Reactive TS lifts to a
// `switchMap` over the selected-route stream (the lookup-table flattening).
import { Component } from "corrente";
import { AppPage, DocPage } from "./doc-page";

import overviewMd from "../README.md?raw";
import gettingStartedMd from "../docs/getting-started.md?raw";
import guideMd from "../docs/guide.md?raw";
import plainTsMd from "../docs/plain-typescript.md?raw";

import { TodoList } from "./todo-list/todo-list.rts";
import { SnakeGame } from "./snake-game/snake-game.rts";
import { Minesweeper } from "./minesweeper/minesweeper.rts";

import todoSrc from "./todo-list/todo-list.rts?raw";
import snakeSrc from "./snake-game/snake-game.rts?raw";
import minesweeperSrc from "./minesweeper/minesweeper.rts?raw";

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
  overview: DocPage(overviewMd),
  "getting-started": DocPage(gettingStartedMd),
  guide: DocPage(guideMd),
  "plain-typescript": DocPage(plainTsMd),
  todo: AppPage("Todo List", TodoList(), todoSrc),
  snake: AppPage("Snake", SnakeGame(), snakeSrc),
  minesweeper: AppPage("Minesweeper", Minesweeper(), minesweeperSrc),
} satisfies Record<string, Component>;
