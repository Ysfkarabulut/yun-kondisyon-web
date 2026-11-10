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
