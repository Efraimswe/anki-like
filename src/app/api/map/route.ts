import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { SkillMapDocSchema } from '@/lib/skillMap/schema';
import { SAMPLE_NODES, SAMPLE_EDGES, SAMPLE_TITLE } from '@/lib/skillMap/sample';
import type { TokenPayload } from '@/lib/auth';

const NO_CACHE = { 'Cache-Control': 'no-store' };

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const [map, dbUser] = await Promise.all([
    prisma.skillMap.findUnique({ where: { userId: user.sub } }),
    prisma.user.findUnique({ where: { id: user.sub }, select: { skillLevels: true } }),
  ]);

  const skillLevels = dbUser?.skillLevels ?? null;

  if (!map) {
    return NextResponse.json(
      {
        title: SAMPLE_TITLE,
        nodes: SAMPLE_NODES,
        edges: SAMPLE_EDGES,
        updatedAt: new Date().toISOString(),
        isSeed: true,
        skillLevels,
      },
      { headers: NO_CACHE },
    );
  }

  return NextResponse.json(
    {
      title: map.title,
      nodes: map.nodes,
      edges: map.edges,
      updatedAt: map.updatedAt.toISOString(),
      isSeed: false,
      skillLevels,
    },
    { headers: NO_CACHE },
  );
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth as TokenPayload;

  const body = await request.json().catch(() => null);
  const parsed = SkillMapDocSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 422, headers: NO_CACHE },
    );
  }

  const { title, nodes, edges } = parsed.data;

  const map = await prisma.skillMap.upsert({
    where: { userId: user.sub },
    create: { userId: user.sub, title, nodes: nodes as object[], edges: edges as object[] },
    update: { title, nodes: nodes as object[], edges: edges as object[] },
  });

  return NextResponse.json(
    { title: map.title, nodes: map.nodes, edges: map.edges, updatedAt: map.updatedAt.toISOString() },
    { headers: NO_CACHE },
  );
}
