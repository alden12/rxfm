import RxFM, { createContext, FC } from "rxfm";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";

interface Theme {
  primary: string,
  darkMode: boolean,
}

const [themeProvider, themeContext] = createContext<Theme>();

const ThemeConsumer: FC = () => {
  const [registerTheme, theme] = themeContext();

  const styles = theme.pipe(
    map(({ darkMode }) => ({
      color: darkMode ? 'white' : 'black',
      backgroundColor: darkMode ? 'grey' : 'white',
    })),
  );

  return (<div style={styles}>Theme consumer</div>).pipe(
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
    <ThemeConsumer />
  </div>).pipe(
    themeProvider(themeSubject),
  );
};
