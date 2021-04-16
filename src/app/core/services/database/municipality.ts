export type Municipality =  {
  id?: string,
  constituencyId: string,
  name: string
}

export type MunicipalityDict = {
  [municipalityId: string]: Municipality
}