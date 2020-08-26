import { Observable } from 'rxjs';
import { ITodo } from '../store';
import './todo-item.css';
export declare const todoItem: (item: Observable<ITodo>) => import("../../../../lib/rxfm").Component<HTMLDivElement, Record<"rxfmDispatch", import("../../../../lib/rxfm").Reducer<import("../store").IApp>>>;
