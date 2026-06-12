// The demo registry — the link between a `demo=<id>` fence in the markdown and the
// live component shown beneath it (see markdown.ts / doc-page.rts). Ids are referenced
// from README.md and docs/guide.md; each maps to the real example component plus the
// `.rts` source for the optional "view full source" expander.
//
// The teaching snippet in the docs is deliberately a simplified version of the example
// (it reads better inline); `component` runs the real exported example, and `source`
// is its full file — so the running code and its true source are both one glance away.
import { ComponentChild, Component, Div } from "corrente";

import {
  HelloWorld,
  ChildrenExample,
  TaggedTemplateExample,
} from "./basic/components.rts";
import {
  StylesExample,
  ClassExample,
  AttributesExample,
  DynamicStyles,
} from "./basic/attributes-and-styling.rts";
import { ClickCounter } from "./basic/state-and-events.rts";
import { ConditionalComponentsExample } from "./basic/conditional-components.rts";
import { ComponentIOExample } from "./basic/component-io.rts";
import { ComponentArraysExample } from "./basic/dynamic-component-arrays.rts";

import componentsSrc from "./basic/components.rts?raw";
import attributesSrc from "./basic/attributes-and-styling.rts?raw";
import stateSrc from "./basic/state-and-events.rts?raw";
import conditionalSrc from "./basic/conditional-components.rts?raw";
import componentIoSrc from "./basic/component-io.rts?raw";
import arraysSrc from "./basic/dynamic-component-arrays.rts?raw";

export interface Demo {
  /** The live component rendered beneath the fenced snippet. */
  component: ComponentChild;
  /** Real `.rts` source for the optional "view full source" expander. */
  source?: string;
}

/** A vertical stack of components — for fences that illustrate several at once. */
const Stack = (...children: ComponentChild[]): Component =>
  Div.class("flex flex-col gap-2")(children);

export const DEMOS: Record<string, Demo> = {
  // README hero + the guide's State & Events section both show a counter.
  counter: { component: ClickCounter, source: stateSrc },
  state: { component: ClickCounter, source: stateSrc },

  // Components section.
  hello: { component: HelloWorld, source: componentsSrc },
  children: { component: ChildrenExample, source: componentsSrc },
  "tagged-template": {
    component: TaggedTemplateExample,
    source: componentsSrc,
  },

  // Attributes & Styling section (first fence shows three; second shows the dynamic one).
  styles: {
    component: Stack(StylesExample, ClassExample, AttributesExample),
    source: attributesSrc,
  },
  "dynamic-styles": { component: DynamicStyles, source: attributesSrc },

  // Remaining basics.
  conditional: {
    component: ConditionalComponentsExample,
    source: conditionalSrc,
  },
  "component-io": { component: ComponentIOExample, source: componentIoSrc },
  arrays: { component: ComponentArraysExample, source: arraysSrc },
};
