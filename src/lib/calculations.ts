/**
 * Yün Kondisyon ve Yün Oranı Testi Hesaplama Motoru
 * Android uygulamasındaki MoistureCalculator, RecordMetrics ve YunOraniCalculator
 * sınıflarından birebir aktarılmıştır.
 */

export interface MoistureTestInput {
  lotNo: string;
  incomingTotalKg?: number | null; // Net KG (Nemli)
  grossKg?: number | null; // Brüt KG (Nemli)
  wetGrams: number; // Numune (Nemli) g
  dryGrams: number; // Numune (Kuru) g
  standardMoisturePercent?: number | null; // Standart Nem % (ör. %17)
  conditionKg?: number | null; // Kondisyon KG (Çeki Listesi)
  conditionPercent?: number | null; // Kondisyon Oranı % (Çeki Listesi)
}

export interface MoistureCalculationResult {
  moistureContentPercent: number; // (W1 - W2) / W1 * 100
  regainPercent: number; // (W1 - W2) / W2 * 100
  commercialSampleGrams: number | null; // W2 * (1 + R/100)
  estimatedDryTotalKg: number | null; // NetKG * (W2 / W1)
  commercialTotalKg: number | null; // estimatedDryTotalKg * (1 + R/100)
  standardRegainKg: number | null; // estimatedDryTotalKg * (R / 100)
  standardRegainPercentOfIncoming: number | null; // (standardRegainKg / NetKG) * 100
  commercialPercentOfIncoming: number | null; // (commercialTotalKg / NetKG) * 100
  gainKg: number | null; // commercialTotalKg - NetKG
  gainPercentOfIncoming: number | null; // (gainKg / NetKG) * 100
}

export const MoistureCalculator = {
  /**
   * Islak bazlı nem oranı: (W1 - W2) / W1 * 100
   */
  moistureContentPercent(wet: number, dry: number): number {
    if (wet <= 0 || dry <= 0) return 0;
    if (dry > wet) return 0;
    return ((wet - dry) / wet) * 100.0;
  },

  /**
   * Kuru bazlı nem (Regain): (W1 - W2) / W2 * 100
   */
  regainPercent(wet: number, dry: number): number {
    if (wet <= 0 || dry <= 0) return 0;
    if (dry > wet) return 0;
    return ((wet - dry) / dry) * 100.0;
  },

  /**
   * Numune için ticari (koşullu) ağırlık: W2 × (1 + R/100)
   */
  commercialSampleGrams(dry: number, standardMoisturePercent: number): number {
    if (dry <= 0 || standardMoisturePercent < 0) return 0;
    return dry * (1 + standardMoisturePercent / 100.0);
  },

  /**
   * Teslim halindeki partinin tahmini mutlak kuru kütlesi (kg): Gelen × (W2 / W1)
   */
  estimatedDryTotalKg(incomingKg: number, wet: number, dry: number): number | null {
    if (incomingKg <= 0 || wet <= 0 || dry <= 0 || dry > wet) return null;
    return incomingKg * (dry / wet);
  },

  /**
   * Parti ticari ağırlığı (kg): mutlak kuru tahmini × (1 + R/100)
   */
  commercialTotalKg(
    incomingKg: number,
    wet: number,
    dry: number,
    standardMoisturePercent: number
  ): number | null {
    const dryTotal = this.estimatedDryTotalKg(incomingKg, wet, dry);
    if (dryTotal === null) return null;
    return dryTotal * (1 + standardMoisturePercent / 100.0);
  },

  /**
   * Tüm metrikleri toplu olarak hesaplar
   */
  calculateAll(input: MoistureTestInput): MoistureCalculationResult | null {
    const { wetGrams, dryGrams, incomingTotalKg, standardMoisturePercent } = input;
    if (wetGrams <= 0 || dryGrams <= 0 || dryGrams > wetGrams) {
      return null;
    }

    const mc = this.moistureContentPercent(wetGrams, dryGrams);
    const regain = this.regainPercent(wetGrams, dryGrams);

    const commSample =
      standardMoisturePercent !== undefined && standardMoisturePercent !== null && standardMoisturePercent >= 0
        ? this.commercialSampleGrams(dryGrams, standardMoisturePercent)
        : null;

    let dryTotal: number | null = null;
    let commTotal: number | null = null;
    let stdRegainKg: number | null = null;
    let stdRegainPct: number | null = null;
    let commPct: number | null = null;
    let gainKg: number | null = null;
    let gainPct: number | null = null;

    if (incomingTotalKg && incomingTotalKg > 0) {
      dryTotal = this.estimatedDryTotalKg(incomingTotalKg, wetGrams, dryGrams);
      if (standardMoisturePercent !== undefined && standardMoisturePercent !== null && standardMoisturePercent >= 0) {
        commTotal = this.commercialTotalKg(incomingTotalKg, wetGrams, dryGrams, standardMoisturePercent);
        if (dryTotal !== null) {
          stdRegainKg = dryTotal * (standardMoisturePercent / 100.0);
          stdRegainPct = (stdRegainKg / incomingTotalKg) * 100.0;
        }
        if (commTotal !== null) {
          commPct = (commTotal / incomingTotalKg) * 100.0;
          gainKg = commTotal - incomingTotalKg;
          gainPct = (gainKg / incomingTotalKg) * 100.0;
        }
      }
    }

    return {
      moistureContentPercent: mc,
      regainPercent: regain,
      commercialSampleGrams: commSample,
      estimatedDryTotalKg: dryTotal,
      commercialTotalKg: commTotal,
      standardRegainKg: stdRegainKg,
      standardRegainPercentOfIncoming: stdRegainPct,
      commercialPercentOfIncoming: commPct,
      gainKg,
      gainPercentOfIncoming: gainPct,
    };
  },
};

/**
 * Yün Oranı Testi Hesaplamaları
 * - Numune 1 (Kostik çözeltisi): Yün çözünür, geriye Diğer (viskon vb.) kalır -> Diğer kuru gramı
 * - Numune 2 (Yıkama ve kurutma): Geriye Yün + Diğer kalır -> Toplam kuru gram
 * - Diğer Oranı (%) = Numune 1 son tartım / Numune 2 son tartım × 100
 * - Yün Oranı (%) = 100 - Diğer Oranı
 */
export interface WoolRatioResult {
  otherPercent: number; // Diğer %
  woolPercent: number; // Yün %
  otherDryGrams: number;
  woolDryGrams: number;
}

export const YunOraniCalculator = {
  calculate(otherDryGrams: number, totalDryGrams: number): WoolRatioResult | null {
    if (totalDryGrams <= 0) return null;
    if (otherDryGrams < 0) return null;
    if (otherDryGrams > totalDryGrams) return null;

    const woolDry = totalDryGrams - otherDryGrams;
    const otherPct = (otherDryGrams / totalDryGrams) * 100.0;
    const woolPct = (woolDry / totalDryGrams) * 100.0;

    return {
      otherPercent: otherPct,
      woolPercent: woolPct,
      otherDryGrams,
      woolDryGrams: woolDry,
    };
  },
};
