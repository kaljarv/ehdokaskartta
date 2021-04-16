export const DEFAULT_CONSTITUENCY_ID = '-1';

export type Constituency = {
  id?: string,
  name: string
}

export type ConstituencyDict = {
  [constituencyId: string]: Constituency
}