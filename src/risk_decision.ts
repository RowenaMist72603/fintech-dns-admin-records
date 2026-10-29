export type DnsChange = {
  environment: "sandbox" | "production";
  approvedBy?: string;
  recordType: "TXT" | "CNAME" | "MX" | "A";
};

export type Decision = { allowed: boolean; reason: string };

export function decideDnsChange(change: DnsChange): Decision {
  if (change.environment === "production" && !change.approvedBy) {
    return { allowed: false, reason: "production DNS changes require an approver" };
  }
  return { allowed: true, reason: `approved ${change.recordType} change` };
}
