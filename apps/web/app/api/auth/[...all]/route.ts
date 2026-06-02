import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

const handlers = toNextJsHandler(getAuth());

export const GET = handlers.GET;
export const POST = handlers.POST;
