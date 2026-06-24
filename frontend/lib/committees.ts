export type CommitteeCategory =
  | "EXECUTIVE"
  | "STUDENT_BRANCH"
  | "SOCIETY"
  | "AFFINITY_GROUP"
  | "GROUP";

export interface Committee {
  id: string;
  name: string;
  shortName?: string;
  category?: CommitteeCategory;
  year?: string;
  status?: string;
}

export type OrgPickerCategory = "STUDENT_BRANCH" | "SOCIETY" | "GROUP" | "EXECUTIVE";

export const ORG_CATEGORY_LABELS: Record<OrgPickerCategory, string> = {
  STUDENT_BRANCH: "Student Branch",
  SOCIETY: "Society",
  GROUP: "Group",
  EXECUTIVE: "Executive",
};

export const ORG_CATEGORY_DESCRIPTIONS: Record<OrgPickerCategory, string> = {
  STUDENT_BRANCH: "Main IEEE Student Branch — Chairperson, Secretary, Treasurer & more",
  SOCIETY: "IEEE Societies — Computer Society, Signal Processing Society",
  GROUP: "Affinity groups (WIE) & Student Branch groups (SIGHT)",
  EXECUTIVE: "Faculty executive chairs",
};

const NAME_CATEGORY_FALLBACK: Record<string, CommitteeCategory> = {
  "Executive Chairs": "EXECUTIVE",
  "Silver Oak University IEEE Student Branch": "STUDENT_BRANCH",
  "Silver Oak University Silver Oak University IEEE Student Branch": "STUDENT_BRANCH",
  "Student Branch Coordination": "STUDENT_BRANCH",
  "SOU IEEE Signal Processing Society Chapter": "SOCIETY",
  "SOU IEEE Computer Society Chapter": "SOCIETY",
  "SOU IEEE Women In Engineering Affinity Group": "AFFINITY_GROUP",
  "SOU IEEE SIGHT Group": "GROUP",
};

const NAME_SHORT_FALLBACK: Record<string, string> = {
  "Executive Chairs": "Executive Chairs",
  "Silver Oak University IEEE Student Branch": "Main SB",
  "Student Branch Coordination": "SB Coordination",
  "SOU IEEE Signal Processing Society Chapter": "Signal Processing",
  "SOU IEEE Computer Society Chapter": "Computer Society",
  "SOU IEEE Women In Engineering Affinity Group": "Women In Engineering",
  "SOU IEEE SIGHT Group": "SIGHT",
};

export function committeeCategory(c: Committee): CommitteeCategory {
  if (c.category) return c.category;
  return NAME_CATEGORY_FALLBACK[c.name] ?? "STUDENT_BRANCH";
}

export function committeeShortName(c: Committee): string {
  return c.shortName || NAME_SHORT_FALLBACK[c.name] || c.name;
}

export function committeesForOrgPicker(
  committees: Committee[],
  org: OrgPickerCategory
): Committee[] {
  if (org === "EXECUTIVE") {
    return committees.filter((c) => committeeCategory(c) === "EXECUTIVE");
  }
  if (org === "STUDENT_BRANCH") {
    return committees.filter((c) => committeeCategory(c) === "STUDENT_BRANCH");
  }
  if (org === "SOCIETY") {
    return committees.filter((c) => committeeCategory(c) === "SOCIETY");
  }
  return committees.filter(
    (c) => committeeCategory(c) === "AFFINITY_GROUP" || committeeCategory(c) === "GROUP"
  );
}

export function roleKindForCommittee(c: Committee): "MAIN" | "CHAPTER" {
  if (committeeCategory(c) === "STUDENT_BRANCH" && committeeShortName(c) === "Main SB") {
    return "MAIN";
  }
  return "CHAPTER";
}

export const MEMBER_FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "executive", label: "Executive", categories: ["EXECUTIVE"] as CommitteeCategory[] },
  { id: "branch", label: "Student Branch", categories: ["STUDENT_BRANCH"] as CommitteeCategory[] },
  { id: "societies", label: "Societies", categories: ["SOCIETY"] as CommitteeCategory[] },
  { id: "groups", label: "Groups", categories: ["AFFINITY_GROUP", "GROUP"] as CommitteeCategory[] },
] as const;
