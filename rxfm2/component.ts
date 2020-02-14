import { Observable, EMPTY } from 'rxjs';

export type ComponentOperator<T extends Node, E, O = E> = (component: Component<T, E>) => Component<T, O>;

export class Component<T extends Node, E = undefined> {
  constructor(
    public readonly node: T,
    public readonly events: Observable<E> = EMPTY,
  ) {}

    /* tslint:disable:max-line-length */
  pipe(): Component<T, E>;
  pipe<A>(op1: ComponentOperator<T, E, A>): Component<T, A>;
  pipe<A, B>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>): Component<T, B>;
  pipe<A, B, C>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>): Component<T, C>;
  pipe<A, B, C, D>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>): Component<T, D>;
  pipe<A, B, C, D, E>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>, op5: ComponentOperator<T, D, E>): Component<T, E>;
  pipe<A, B, C, D, E, F>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>, op5: ComponentOperator<T, D, E>, op6: ComponentOperator<T, E, F>): Component<T, F>;
  pipe<A, B, C, D, E, F, G>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>, op5: ComponentOperator<T, D, E>, op6: ComponentOperator<T, E, F>, op7: ComponentOperator<T, F, G>): Component<T, G>;
  pipe<A, B, C, D, E, F, G, H>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>, op5: ComponentOperator<T, D, E>, op6: ComponentOperator<T, E, F>, op7: ComponentOperator<T, F, G>, op8: ComponentOperator<T, G, H>): Component<T, H>;
  pipe<A, B, C, D, E, F, G, H, I>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>, op5: ComponentOperator<T, D, E>, op6: ComponentOperator<T, E, F>, op7: ComponentOperator<T, F, G>, op8: ComponentOperator<T, G, H>, op9: ComponentOperator<T, H, I>): Component<T, I>;
  pipe<A, B, C, D, E, F, G, H, I>(op1: ComponentOperator<T, E, A>, op2: ComponentOperator<T, A, B>, op3: ComponentOperator<T, B, C>, op4: ComponentOperator<T, C, D>, op5: ComponentOperator<T, D, E>, op6: ComponentOperator<T, E, F>, op7: ComponentOperator<T, F, G>, op8: ComponentOperator<T, G, H>, op9: ComponentOperator<T, H, I>, ...operations: ComponentOperator<T, any, any>[]): Component<T, unknown>;
  /* tslint:enable:max-line-length */
  pipe(...operators: ComponentOperator<T, any, any>[]): Component<T, any> {
    return operators.reduce((res, op) => op(res), this);
  }
}
