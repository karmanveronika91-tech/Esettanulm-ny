export const COMPANY_DEPARTMENTS = [
  'Bérszámfejtés',
  'Értékesítés',
  'Gondnokság',
  'HR',
  'HR komplex',
  'Informatika',
  'Iskolaszövetkezet',
  'KÜCS',
  'Marketing',
  'Munkaerő-kölcsönzés Debrecen/Miskolc',
  'Munkaerő-kölcsönzés Győr/Kecskemét/Soroksár/Szombathely',
  'Munkaerő-kölcsönzés Pécs',
  'Munkaerő-kölcsönzés Székesfehérvár',
  'Munkaerő-kölcsönzés Veszprém',
  'Munkaerő-közvetítés',
  'Munkaügy',
  'Pénzügy/controlling',
  'Szolgáltatásmarketing',
  'TB',
  'Tréning',
] as const;

export const PANNONJOB_DEPARTMENTS = COMPANY_DEPARTMENTS;
export const DEFAULT_DEPARTMENTS: string[] = Array.from(COMPANY_DEPARTMENTS);
export type CompanyDepartment = (typeof COMPANY_DEPARTMENTS)[number];
export type PannonjobDepartment = string;
