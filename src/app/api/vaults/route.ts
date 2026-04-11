import { NextRequest, NextResponse } from 'next/server';
import { fetchVaults } from '@/lib/lifi';
import { correctMorphoVaults } from '@/lib/morpho';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await fetchVaults({
      chainId: searchParams.get('chainId') ? Number(searchParams.get('chainId')) : undefined,
      asset: searchParams.get('asset') || undefined,
      minTvl: searchParams.get('minTvl') ? Number(searchParams.get('minTvl')) : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
    });

    const corrected = await correctMorphoVaults(data.data);
    return NextResponse.json({ data: corrected, total: corrected.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
