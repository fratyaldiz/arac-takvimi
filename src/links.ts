/**
 * Resmi sorgulama/randevu sayfaları. Uygulama bu kurumlarla bağlantılı değildir;
 * yalnızca kullanıcıyı doğru sayfaya götürür.
 */
export const OFFICIAL_LINKS = {
  /** TÜVTÜRK randevu ve muayene sorgulama. */
  tuvturkAppointment: 'https://randevu.tuvturk.com.tr/',
  /** e-Devlet trafik cezası sorgulama ve ödeme. */
  edevletFines: 'https://www.turkiye.gov.tr/gib-trafik-para-cezasi-odeme',
  /** e-Devlet MTV sorgulama ve ödeme. */
  edevletMtv: 'https://www.turkiye.gov.tr/gib-motorlu-tasitlar-vergisi-sorgulama',
  /** SBM üzerinden trafik sigortası poliçe sorgulama. */
  sbmPolicy: 'https://www.turkiye.gov.tr/sigorta-bilgi-ve-gozetim-merkezi-police-sorgulama',
} as const;

export type OfficialLinkKey = keyof typeof OFFICIAL_LINKS;
