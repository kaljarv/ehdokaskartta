export type Category =  {
  id: string,
  name: string,
  order?: number
}

export type CategoryDict = {
  [categoryId: string]: Category
}
