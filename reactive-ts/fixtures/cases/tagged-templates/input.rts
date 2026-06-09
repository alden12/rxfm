import { BehaviorSubject } from 'rxjs';
import { Div } from 'rxfm';
declare const user: BehaviorSubject<{ name: string; nickname?: string }>;
declare const count: BehaviorSubject<number>;
const a = Div`my name is ${user.name}`;
const b = Div`toggle (${user.nickname ?? 'none'})`;
const c = Div`count = ${count}, doubled = ${count * 2}`;
const d = Div`static ${1 + 1}`;
