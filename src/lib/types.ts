export interface DryingMeasurement {
  id: string;
  sequence: number;
  time: string; // HH:mm
  value: string; // e.g. "20.15" or formatted "20.15 g"
  netValue?: string; // after subtracting tare if applicable
}

export interface MoistureTestRecord {
  id: string;
  lotNo: string;
  incomingTotalKg?: number | null;
  grossKg?: number | null;
  conditionKg?: number | null;
  conditionPercent?: number | null;
  wetGrams: number;
  dryGrams: number;
  moistureContentPercent: number;
  regainPercent: number;
  standardMoisturePercent?: number | null;
  createdAtEpochMs: number;
}

export interface YunOraniTestRecord {
  id: string;
  hammaddeLot: string;
  sample1StartGrams: number;
  sample2StartGrams: number;
  sample1Measurements: DryingMeasurement[];
  sample2Measurements: DryingMeasurement[];
  createdAtEpochMs: number;
}

export interface DryingNoteSession {
  id: string;
  hammaddeLot: string;
  tare: string;
  measurements: DryingMeasurement[];
  archivedAtEpochMs: number;
}

/** Sertifika standartları (Excel takip dosyasındaki sayfalara karşılık gelir) */
export const CERT_STANDARDS = ['GOTS', 'RWS', 'GRS', 'Pamuk', 'SFA'] as const;
export type CertStandard = (typeof CERT_STANDARDS)[number];

/** Sertifikalı hammadde sevkiyat takibi (sipariş → geliş → TC belgesi → portal kaydı) */
export interface CertifiedShipment {
  id: string;
  orderText: string; // Ürün cinsi / sipariş açıklaması
  supplier?: string; // Firma
  kg?: number | null;
  standards?: CertStandard[]; // Birden fazla olabilir (ör. GOTS + RWS)
  receivedDate: string; // YYYY-MM-DD, boş = henüz gelmedi
  tcReceived: boolean;
  tcDate: string; // YYYY-MM-DD
  portalRegistered: boolean;
  portalDate: string; // YYYY-MM-DD
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}

/** Gelecek / gelen hammadde kaydı ve kondisyon testi takibi */
export interface IncomingMaterial {
  id: string;
  lotNo: string;
  description: string;
  arrivalDate: string; // YYYY-MM-DD
  conditionTested: boolean;
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}
