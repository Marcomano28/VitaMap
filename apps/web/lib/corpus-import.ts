import matter from "gray-matter";
import type { CorpusDraftInput } from "./corpus-admin";

export function corpusDraftInputFromForm(
  formData: FormData,
  uploadedMarkdown?: string,
): CorpusDraftInput {
  const parsed = uploadedMarkdown === undefined
    ? { data: {}, content: String(formData.get("body") ?? "") }
    : matter(uploadedMarkdown);
  const uploadedData = parsed.data as Record<string, unknown>;

  const field = (formName: string, frontmatterName: string): string | undefined => {
    const submitted = String(formData.get(formName) ?? "").trim();
    if (submitted) return submitted;
    const imported = uploadedData[frontmatterName];
    return typeof imported === "string" && imported.trim()
      ? imported.trim()
      : undefined;
  };

  const submittedLimitations = String(formData.get("limitations") ?? "").trim();
  const importedLimitations = uploadedData.limitations;
  const limitations = submittedLimitations
    ? submittedLimitations.split(/\r?\n/)
    : Array.isArray(importedLimitations)
      ? importedLimitations
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
      : typeof importedLimitations === "string"
        ? importedLimitations.split(/\r?\n/)
        : [];

  return {
    title: field("title", "title") ?? "",
    sourceUrl: field("source_url", "source_url"),
    doi: field("doi", "doi"),
    pmid: field("pmid", "pmid"),
    publicationDate: field("publication_date", "publication_date"),
    sourceKind: field(
      "source_kind",
      "source_kind",
    ) as CorpusDraftInput["sourceKind"],
    sourceType: field("source_type", "source_type") ?? "",
    rightsStatus: field(
      "rights_status",
      "rights_status",
    ) as CorpusDraftInput["rightsStatus"],
    limitations: limitations.filter(Boolean),
    body: parsed.content,
  };
}
