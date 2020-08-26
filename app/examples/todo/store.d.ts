import { Store } from 'rxfm';
export interface ITodo {
    label: string;
    done: boolean;
}
export interface IApp {
    todos: ITodo[];
}
export declare const store: Store<IApp>;
export declare const todosSelector: import("rxjs").Observable<ITodo[]>;
export declare const addTodoAction: import("../../../lib/rxfm").Action<ITodo, IApp>;
export declare const toggleTodoAction: import("../../../lib/rxfm").Action<string, IApp>;
export declare const deleteTodoAction: import("../../../lib/rxfm").Action<string, IApp>;
