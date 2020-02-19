// export type Attributes = { [attr: string]: string };

// export function updateElementAttributes<T extends HTMLElement>(
//   el: T,
//   oldAttributes: Attributes,
//   newAttributes: Attributes
// ): T {
//   const diff = attributeDiffer(oldAttributes, newAttributes);
//   Object.keys(diff.updated).forEach(key => {
//     el.setAttribute(key, diff.updated[key]);
//   });
//   diff.removed.forEach(attr => el.removeAttribute(attr));
//   return el;
// }

// export function attributes<T extends HTMLElement>(
//   attributes: Attributes | Observable<Attributes>
// ): (node: Observable<T>) => Observable<T> {
//   return (node: Observable<T>): Observable<T> =>
//     node.pipe(
//       switchMap(el => {
//         const attributesObservable =
//           attributes instanceof Observable ? attributes : of(attributes);
//         let previousAttributes: Attributes = {};
//         return attributesObservable.pipe(
//           map(attributes_ => {
//             updateElementAttributes(el, previousAttributes, attributes_);
//             previousAttributes = attributes_;
//             return el;
//           }),
//           startWith(el)
//         );
//       }),
//       distinctUntilChanged()
//     );
// }

// export function attribute<T extends HTMLElement, A>(
//   attribute: string,
//   value: A | Observable<A>,
//   valueFunction: (val: A) => string
// ): (node: Observable<T>) => Observable<T> {
//   const value$ = value instanceof Observable ? value : of(value);
//   const attributes$ = value$.pipe(
//     map(val => ({ [attribute]: valueFunction(val) }))
//   );
//   return attributes(attributes$);
// }
