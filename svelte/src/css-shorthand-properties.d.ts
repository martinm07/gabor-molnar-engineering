declare module "css-shorthand-properties" {
  export function isShorthand(property: string): boolean;
  export function expand(property: string, recurse: boolean): string[];
}
