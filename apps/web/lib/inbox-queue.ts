import { logAuditEventSafe } from "@/lib/audit";
import {
  getInboxItem,
  markInboxExtractionPending,
  runExtraction,
  type InboxMeta,
} from "@/lib/inbox";

interface InboxExtractionJob {
  userId: string;
  id: string;
}

const queue: InboxExtractionJob[] = [];
const queued = new Set<string>();
const active = new Set<string>();
let draining = false;

function jobKey(job: InboxExtractionJob): string {
  return `${job.userId}:${job.id}`;
}

export async function enqueueInboxExtraction(
  job: InboxExtractionJob,
): Promise<InboxMeta> {
  const key = jobKey(job);
  if (active.has(key) || queued.has(key)) {
    const current = await getInboxItem(job.userId, job.id);
    if (!current) throw new Error("inbox item not found");
    return current.meta;
  }

  const meta = await markInboxExtractionPending(job.userId, job.id);
  if (meta.status === "extracted") return meta;

  queued.add(key);
  queue.push(job);
  scheduleDrain();
  return meta;
}

function scheduleDrain() {
  if (draining) return;
  draining = true;
  setTimeout(() => {
    void drain();
  }, 0);
}

async function drain() {
  try {
    while (queue.length > 0) {
      const job = queue.shift()!;
      const key = jobKey(job);
      queued.delete(key);
      active.add(key);
      try {
        const meta = await runExtraction(job.userId, job.id);
        await logAuditEventSafe({
          actor: job.userId,
          action: "document.extract",
          subjectId: job.userId,
          payloadSum: `id=${job.id} status=${meta.status}`,
        });
      } catch (err) {
        await logAuditEventSafe({
          actor: job.userId,
          action: "document.extract",
          subjectId: job.userId,
          payloadSum: `id=${job.id} status=failed worker=${String(err).slice(0, 120)}`,
        });
      } finally {
        active.delete(key);
      }
    }
  } finally {
    draining = false;
    if (queue.length > 0) scheduleDrain();
  }
}
