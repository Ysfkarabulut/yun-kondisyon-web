export const ParseUtils = {
  parseDouble(value: string | undefined | null): number | null {
    if (!value) return null;
    const clean = value.trim().replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  },
};

export const Formatting = {
  formatGrams(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return value.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  formatKg(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return value.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  formatSignedKg(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const formatted = Math.abs(value).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  },

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return value.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  pct(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `%${this.formatPercent(value)}`;
  },

  formatDateTime(epochMs: number): string {
    if (!epochMs) return '—';
    const d = new Date(epochMs);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  },

  currentTimeHHmm(): string {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },
};
