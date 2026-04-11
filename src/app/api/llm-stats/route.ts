import { NextResponse } from 'next/server';
import { getLLMStats } from '@/lib/llm';

export async function GET() {
  return NextResponse.json(getLLMStats());
}
