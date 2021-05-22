export const DEFAULT_CONSTITUENCY_ID = '-1';

export interface Constituency {
  id: string,
  name: string,
  totalCandidates?: number
}

export type ConstituencyDict = {
  [constituencyId: string]: Constituency
}