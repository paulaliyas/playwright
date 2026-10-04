/** SQL used to pick test data for the establishment domain. Keep queries read-only. */
export const ESTABLISHMENT_QUERIES = {
  activeEstablishment: `
    SELECT registration_no AS "registrationNo", name_en AS "nameEn"
      FROM establishment
     WHERE status = 'ACTIVE'
     FETCH FIRST 1 ROWS ONLY`,
} as const;

export interface EstablishmentRow {
  registrationNo: string;
  nameEn: string;
}
