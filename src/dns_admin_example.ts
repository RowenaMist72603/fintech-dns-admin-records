import { InfraiDnsClient } from "./infrai_dns_client.ts";
import { decideDnsChange } from "./risk_decision.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

const change = { environment: "sandbox" as const, recordType: "TXT" as const, approvedBy: "course-admin" };
const decision = decideDnsChange(change);
if (!decision.allowed) throw new Error(decision.reason);

const client = new InfraiDnsClient(apiKey);
const domain = process.env.DNS_DOMAIN ?? "pay.example.com";
const domainResult = await client.getDomain(domain);
const zoneId = String((domainResult.data as { zone_id: string }).zone_id);
const result = await client.upsertRecord({
  zone_id: zoneId,
  record_type: "TXT",
  name: "_payments",
  content: "v=payment-audit1",
  ttl: 300,
  metadata: { event: "payment-domain-verification", approvedBy: change.approvedBy }
});

console.log(JSON.stringify({ decision, zone_id: zoneId, result }, null, 2));
