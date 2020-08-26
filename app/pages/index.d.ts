import { Component } from 'rxfm';
export interface IPage {
    title: string;
    component: Component;
}
export interface IPages {
    gettingStarted: IPage;
    components: IPage;
    operators: IPage;
    attributes: IPage;
    events: IPage;
    state: IPage;
    generate: IPage;
    store: IPage;
    examples: IPage;
}
export declare const pages: IPages;
export declare const pageArray: (keyof IPages)[];
