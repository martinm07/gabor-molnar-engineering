export declare global {
  var jinjaParsed: boolean;
  var csrfToken: string;
  var urlRoot: string;

  var blogreadID: string;
  var blogreadTitle: string;
  var blogreadDesc: string;
  var blogreadBody: string;

  type CaretPosition = {
    offsetNode: Node;
    offset: number;
  };

  interface Document {
    caretPositionFromPoint?(x: number, y: number): CaretPosition;
    caretRangeFromPoint?(x: number, y: number): Range | null;
  }
}
