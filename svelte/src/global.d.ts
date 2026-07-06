interface IncomingDocTag {
  name: string;
  description: string;
  accent: string;
  documentTitles: string[];
}

interface IncomingDoc {
  id: number;
  title: string;
  description: string;
  tags: [{ name: string; accent: string; description: string }];
  accent: string;
  thumbnail: string;
  date_created: string;
  date_updated: string;
  hearts: number;
  status: "featured" | "public" | "unlisted" | "private";
}

export declare global {
  var jinjaParsed: boolean;
  var csrfToken: string;
  var urlRoot: string;
  var flashedMessages: string[];

  var blogreadID: string;
  var blogreadTitle: string;
  var blogreadDesc: string;
  var blogreadBody: string;

  // /blog/tagsedit
  var allDocTags: IncomingDocTag[];

  // /blog/admin
  var allDocs: IncomingDoc[];

  type CaretPosition = {
    offsetNode: Node;
    offset: number;
  };

  interface Document {
    caretPositionFromPoint?(x: number, y: number): CaretPosition;
    caretRangeFromPoint?(x: number, y: number): Range | null;
  }
}
