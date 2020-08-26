import { Store } from 'rxfm';
import { IPages } from './pages';
export interface IApp {
    activePage: keyof IPages;
    sidenavOpen: boolean;
}
export declare const store: Store<IApp>;
export declare const activePageSelector: import("rxjs").Observable<"gettingStarted" | "components" | "operators" | "attributes" | "events" | "state" | "generate" | "store" | "examples">;
export declare const sidenavOpenSelector: import("rxjs").Observable<boolean>;
export declare const setActivePageAction: import("../lib/rxfm").Action<"gettingStarted" | "components" | "operators" | "attributes" | "events" | "state" | "generate" | "store" | "examples", IApp>;
export declare const setSidenavOpenAction: import("../lib/rxfm").Action<boolean | undefined, IApp>;
