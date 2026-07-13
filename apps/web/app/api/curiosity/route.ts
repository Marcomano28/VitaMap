import { NextResponse } from "next/server";
import { z } from "zod";
import { kbDir } from "@/lib/qmd";
import { selectCuriosityCard } from "@/lib/curiosity";
import { checkRateLimit } from "@/lib/rate-limit";
import { UnauthorizedError } from "@/lib/session";
import {
  requireSubscribedUserIdFromRequest,
  SubscriptionRequiredError,
} from "@/lib/subscription-access";

export const runtime = "nodejs";

const Body = z.object({
  topics: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(8).default([]),
  seenIds: z.array(z.string().min(1).max(240)).max(60).default([]),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireSubscribedUserIdFromRequest(req);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof SubscriptionRequiredError) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }
    throw error;
  }

  const rate = checkRateLimit(`curiosity:${userId}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const card = await selectCuriosityCard(kbDir(), body);
  if (!card) {
    return NextResponse.json(
      { error: "no_curiosity_available" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  return NextResponse.json(card, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
