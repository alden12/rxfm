
export function classes<T extends HTMLElement>(
  classes: string | string[] | Observable<string | string[]>
): (node: Observable<T>) => Observable<T> {
  return attribute("class", classes, (val: string | string[]) =>
    (Array.isArray(val) ? val : [val]).join(" ")
  );
}
