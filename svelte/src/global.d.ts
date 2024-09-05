export declare global {
  var jinjaParsed: boolean;
  var csrfToken: string;
  var urlRoot: string;
  var blogreadID: string;
  var blogreadTitle: string;
  var blogreadDesc: string;
  var blogreadBody: string;
  var blogcreateComponentUID: string[];

  type CaretPosition = {
    offsetNode: Node;
    offset: number;
  };

  interface Document {
    caretPositionFromPoint?(x: number, y: number): CaretPosition;
    caretRangeFromPoint?(x: number, y: number): Range | null;
  }

  declare namespace CSSUtilities {
    let getCSSRules: (s: Element | string) => Array<CSSRule_>;
  }

  interface CSSRule_ {
    altstate: boolean;
    css: string;
    href: string | null;
    index: number;
    inheritance: Element[];
    media: string;
    owner: string;
    properties: { [name: string]: { value: string; status: string } };
    selector: string;
    specificity: [i1: number, i2: number, i3: number, i4: number];
    ssid: number;
  }
}
