import RxFM, { children, componentOperator, createContext, FC, log, selectFrom } from "rxfm";
import { BehaviorSubject, interval, of, Subject, timer } from "rxjs";
import { finalize, map, startWith, switchAll, switchMapTo, tap } from "rxjs/operators";

interface Theme {
  primary: string,
  darkMode: boolean,
}

// const [themeProvider, themeContext] = createContext<Theme>({
//   primary: 'blue',
//   darkMode: true,
// });
const [themeProvider, themeContext] = createContext<Theme>();

const ThemeConsumer: FC = () => {
  const [registerTheme, theme] = themeContext();

  // const themeSubject = new Subject<Theme>();

  // const darkMode = selectFrom(theme, 'darkMode');

  const styles = theme.pipe(
    // log(),
    // startWith(null),
    // switchMapTo(interval(1000)),
    map(({ darkMode }) => ({
      color: darkMode ? 'white' : 'black',
      backgroundColor: darkMode ? 'grey' : 'white',
    })),
    // tap(console.log),
  );

  // styles.subscribe();

  // theme.subscribe(val => {
  //   console.log(val);
  //   themeSubject.next(val);
  // });

  return (<div style={styles}>Theme consumer</div>).pipe(
    // componentOperator(() => of(4).pipe(tap(console.log))),
    // componentOperator(() => of(5).pipe(tap(console.log))),
    // componentOperator(() => of(6).pipe(tap(console.log))),
    registerTheme(),
  );
};

export const CreateContextExample: FC = () => {
  const themeSubject = new BehaviorSubject({
    primary: 'blue',
    darkMode: false,
  });

  const toggleDarkMode = () => themeSubject.next({ ...themeSubject.value, darkMode: !themeSubject.value.darkMode });

  return (<div>
    <h3>Theme Provider</h3>
    <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
    {/* <ThemeConsumer /> */}
  </div>).pipe(
    componentOperator(() => of(1, 1.1, 1.2).pipe(tap(console.log))),
    componentOperator(() => of(2, 2.1, 2.2).pipe(tap(console.log))),
    componentOperator(() => of(3, 3.1, 3.2).pipe(tap(console.log))),
    themeProvider(themeSubject),
    children(<ThemeConsumer />),
  );
};
