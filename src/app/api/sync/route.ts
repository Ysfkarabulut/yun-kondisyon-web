import { NextResponse } from 'next/server';
import { getDb, initDb, isDbConfigured } from '@/lib/db';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'Vercel Storage / Postgres henüz bağlı değil. Lokal modda çalışıyor.',
      data: null,
    });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ connected: false, data: null });
  }

  try {
    await initDb();
    const rows = await sql`
      SELECT key, value, updated_at FROM yun_store
    `;

    const storeMap: Record<string, any> = {};
    rows.forEach((r: any) => {
      storeMap[r.key] = r.value;
    });

    return NextResponse.json({
      connected: true,
      data: {
        moistureRecords: storeMap['moisture_records'] || [],
        yunOraniRecords: storeMap['yun_orani_records'] || [],
        dryingSessions: storeMap['drying_sessions'] || [],
        pendingLots: storeMap['pending_lots']?.text || '',
        pendingLotsUpdatedAt: storeMap['pending_lots']?.updatedAt || 0,
      },
    });
  } catch (error: any) {
    console.error('API Sync GET error:', error);
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'Vercel Storage / Postgres henüz bağlı değil.',
      data: null,
    });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ connected: false, data: null });
  }

  try {
    await initDb();
    const body = await request.json();
    const {
      moistureRecords = [],
      yunOraniRecords = [],
      dryingSessions = [],
      pendingLots = '',
      pendingLotsUpdatedAt = 0,
      deletedIds = [],
    } = body;

    const deletedSet = new Set<string>(deletedIds);

    // 1. Fetch existing remote data
    const existingRows = await sql`
      SELECT key, value, updated_at FROM yun_store
    `;
    const storeMap: Record<string, any> = {};
    existingRows.forEach((r: any) => {
      storeMap[r.key] = r.value;
    });

    // 2. Merge Moisture Records
    const remoteMoisture: any[] = storeMap['moisture_records'] || [];
    const moistureMap = new Map<string, any>();
    remoteMoisture.forEach(item => {
      if (!deletedSet.has(item.id)) moistureMap.set(item.id, item);
    });
    moistureRecords.forEach((item: any) => {
      if (!deletedSet.has(item.id)) moistureMap.set(item.id, item);
    });
    const mergedMoisture = Array.from(moistureMap.values()).sort(
      (a, b) => b.createdAtEpochMs - a.createdAtEpochMs
    );

    // 3. Merge Yun Orani Records
    const remoteYun: any[] = storeMap['yun_orani_records'] || [];
    const yunMap = new Map<string, any>();
    remoteYun.forEach(item => {
      if (!deletedSet.has(item.id)) yunMap.set(item.id, item);
    });
    yunOraniRecords.forEach((item: any) => {
      if (!deletedSet.has(item.id)) yunMap.set(item.id, item);
    });
    const mergedYun = Array.from(yunMap.values()).sort(
      (a, b) => b.createdAtEpochMs - a.createdAtEpochMs
    );

    // 4. Merge Drying Sessions
    const remoteDrying: any[] = storeMap['drying_sessions'] || [];
    const dryingMap = new Map<string, any>();
    remoteDrying.forEach(item => {
      if (!deletedSet.has(item.id)) dryingMap.set(item.id, item);
    });
    dryingSessions.forEach((item: any) => {
      if (!deletedSet.has(item.id)) dryingMap.set(item.id, item);
    });
    const mergedDrying = Array.from(dryingMap.values()).sort(
      (a, b) => b.archivedAtEpochMs - a.archivedAtEpochMs
    );

    // 5. Merge Pending Lots
    const remotePending = storeMap['pending_lots'] || { text: '', updatedAt: 0 };
    let mergedPendingText = remotePending.text;
    let mergedPendingTime = remotePending.updatedAt;

    if (pendingLotsUpdatedAt >= remotePending.updatedAt && pendingLots) {
      mergedPendingText = pendingLots;
      mergedPendingTime = pendingLotsUpdatedAt;
    } else if (!mergedPendingText && pendingLots) {
      mergedPendingText = pendingLots;
      mergedPendingTime = Date.now();
    }

    const now = Date.now();

    // 6. Save back to database
    await sql`
      INSERT INTO yun_store (key, value, updated_at)
      VALUES 
        ('moisture_records', ${JSON.stringify(mergedMoisture)}::jsonb, ${now}),
        ('yun_orani_records', ${JSON.stringify(mergedYun)}::jsonb, ${now}),
        ('drying_sessions', ${JSON.stringify(mergedDrying)}::jsonb, ${now}),
        ('pending_lots', ${JSON.stringify({ text: mergedPendingText, updatedAt: mergedPendingTime })}::jsonb, ${now})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;
    `;

    return NextResponse.json({
      connected: true,
      data: {
        moistureRecords: mergedMoisture,
        yunOraniRecords: mergedYun,
        dryingSessions: mergedDrying,
        pendingLots: mergedPendingText,
        pendingLotsUpdatedAt: mergedPendingTime,
      },
    });
  } catch (error: any) {
    console.error('API Sync POST error:', error);
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}
