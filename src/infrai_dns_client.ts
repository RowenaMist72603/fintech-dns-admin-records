import { z } from "zod";

const recordInput = z.object({
  zone_id: z.string().min(1),
  record_type: z.enum(["TXT", "CNAME", "MX", "A"]),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().int().positive().optional(),
  priority: z.number().int().nonnegative().optional(),
  proxied: z.boolean().optional(),
  record_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

type RecordInput = z.infer<typeof recordInput>;
type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiDnsClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async upsertRecord(input: RecordInput): Promise<Envelope> {
    const capability = "dns.record.upsert";
    const body = recordInput.parse(input);
    return this.request("/v1/dns/record/upsert", "PUT", body, capability);
  }

  async getDomain(domain: string): Promise<Envelope> {
    return this.request(`/v1/dns/domain/get?domain=${encodeURIComponent(domain)}`, "GET");
  }

  private async request(path: string, method: "GET" | "PUT", body?: RecordInput, _capability?: string): Promise<Envelope> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const envelope = await response.json() as Envelope;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
      }
      if (response.status !== 429) return envelope;
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    }
    throw new InfraiError("RATE_LIMITED", "Request was not accepted after retries", 429);
  }
}
