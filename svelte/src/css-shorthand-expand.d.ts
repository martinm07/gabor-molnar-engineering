declare module "css-shorthand-expand" {
  export default function expand(
    propname: string,
    propval: string,
  ): { [prop: string]: string } | undefined;
}
