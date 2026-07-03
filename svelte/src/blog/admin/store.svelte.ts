export interface IncomingData {
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

export interface Doc {
  id: string;
  title: string;
  description: string;
  tags: [{ name: string; accent: string; description: string }];
  accent: string;
  thumbnail: string;
  // date_created: Temporal.PlainDate;
  // date_updated: Temporal.PlainDate;
  dateCreated: Temporal.PlainDate;
  dateUpdated: Temporal.PlainDate;
  hearts: number;
  status: "featured" | "public" | "unlisted" | "private";
}

export const docs: Doc[] = $state([]);

// export const docs: Doc[] = [];

// export function dateToTemporal(date: string): Temporal.PlainDate {
//   return Temporal.PlainDate.from(date);
// }
