"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { logAuditEventSafe } from "@/lib/audit";
import { corpusDraftInputFromForm } from "@/lib/corpus-import";
import {
  createCorpusDraft,
  deleteCorpusDraft,
  publishCorpusDraft,
  retireCorpusDocument,
  updateCorpusDraft,
  type CorpusDraftInput,
} from "@/lib/corpus-admin";

async function inputFromForm(formData: FormData): Promise<CorpusDraftInput> {
  const upload = formData.get("markdown_file");
  let uploadedMarkdown: string | undefined;
  if (upload instanceof File && upload.size > 0) {
    if (upload.size > 250_000) throw new Error("markdown file is too large");
    uploadedMarkdown = await upload.text();
  }
  return corpusDraftInputFromForm(formData, uploadedMarkdown);
}

export async function saveCorpusDraftAction(formData: FormData) {
  const session = await requireAdminSession();
  const draftId = String(formData.get("draft_id") ?? "").trim();
  let savedId = draftId;

  try {
    const input = await inputFromForm(formData);
    const document = draftId
      ? await updateCorpusDraft(draftId, input)
      : await createCorpusDraft(input);
    savedId = document.id;
    await logAuditEventSafe({
      actor: session.user.id,
      action: draftId ? "kb.draft.update" : "kb.draft.create",
      subjectId: document.id,
      payloadSum: `kind=${document.sourceKind} rights=${document.rightsStatus}`,
    });
  } catch (error) {
    console.error("[corpus] failed to save draft", { draftId }, error);
    redirect("/admin/corpus?error=save_failed");
  }

  revalidatePath("/admin/corpus");
  redirect(`/admin/corpus?success=draft_saved&edit=${encodeURIComponent(savedId)}`);
}

export async function deleteCorpusDraftAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");

  try {
    await deleteCorpusDraft(id);
    await logAuditEventSafe({
      actor: session.user.id,
      action: "kb.draft.delete",
      subjectId: id,
      payloadSum: "stage=draft",
    });
  } catch (error) {
    console.error("[corpus] failed to delete draft", { id }, error);
    redirect("/admin/corpus?error=delete_failed");
  }

  revalidatePath("/admin/corpus");
  redirect("/admin/corpus?success=draft_deleted");
}

export async function publishCorpusDraftAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");

  try {
    const document = await publishCorpusDraft(id, session.user.id);
    await logAuditEventSafe({
      actor: session.user.id,
      action: "kb.publish",
      subjectId: document.id,
      payloadSum: `path=${document.relativePath} rights=${document.rightsStatus}`,
    });
  } catch (error) {
    console.error("[corpus] failed to publish draft", { id }, error);
    redirect("/admin/corpus?error=publish_failed");
  }

  revalidatePath("/admin/corpus");
  redirect("/admin/corpus?success=published");
}

export async function retireCorpusDocumentAction(formData: FormData) {
  const session = await requireAdminSession();
  const relativePath = String(formData.get("relative_path") ?? "");

  try {
    await retireCorpusDocument(relativePath);
    await logAuditEventSafe({
      actor: session.user.id,
      action: "kb.retire",
      subjectId: relativePath,
      payloadSum: `path=${relativePath}`,
    });
  } catch (error) {
    console.error("[corpus] failed to retire document", { relativePath }, error);
    redirect("/admin/corpus?error=retire_failed");
  }

  revalidatePath("/admin/corpus");
  redirect("/admin/corpus?success=retired");
}
