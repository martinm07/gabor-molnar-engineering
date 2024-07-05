export type ValidationResponse = { result: number; code?: string };

export interface TypesenseHit {
  document: { [key: string]: any };
  highlight: {
    [key: string]: any;
  };
  highlights: Array<{
    field: string;
    matched_tokens: string[];
    snippet: string;
    snippets: string[];
    indices: number[];
  }>;
}

export interface TypesenseResults {
  facet_counts: Array<{
    counts: Array<{ count: number; highlighted: string; value: string }>;
    field_name: string;
    sampled: boolean;
  }>;
  found: number;
  hits: Array<TypesenseHit>;
  out_of: number;
  page: number;
  request_params: {
    collection_name: string;
    first_q: string;
    per_page: number;
    q: string;
  };
  search_cutoff: any;
  search_time_ms: number;
}
