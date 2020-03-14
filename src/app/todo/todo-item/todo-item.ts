import { div } from '../../../rxfm/components';
import { children } from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo } from '../store';
import { map } from 'rxjs/operators';

export const todoItem = (item: Observable<ITodo>) => div().pipe(
  children(
    item.pipe(
      map(({ label }) => label)
    )
  ),
);
