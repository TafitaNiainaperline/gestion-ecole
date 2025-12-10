// Type utilities for configuration
type PathImpl<T, K extends string | number> = K extends string
  ? T extends Record<string, any>
    ? {
        [P in keyof T]: `${K}.${PathImpl<T[P], P & (string | number)>}` | (P extends string ? `${K}.${P}` : never);
      }[keyof T]
    : never
  : never;

type Path<T> = {
  [K in keyof T]: K extends string ? K | PathImpl<T[K], K & string> : never;
}[keyof T];

export type RootKeys<T> = Path<T> | (keyof T extends string ? keyof T : never);

export type RootKeyType<T, K extends string> = K extends keyof T
  ? T[K]
  : K extends `${infer Root}.${infer Rest}`
    ? Root extends keyof T
      ? RootKeyType<T[Root], Rest>
      : any
    : any;
