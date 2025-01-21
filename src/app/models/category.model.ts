export interface SubCategory {
  id: number;
  name: string;
  values: { [monthKey: string]: number };
}

export interface Category {
  id: number;
  name: string;
  subCategories: SubCategory[];
}
