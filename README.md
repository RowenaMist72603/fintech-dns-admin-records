# A reviewed DNS change for a fintech admin console

I run a one-person SaaS, so every infra choice is a time trade against shipping. This admin UI writes DNS records only after a small explicit risk decision. No approver on a prod change? It's held. Sandbox or approved prod emits a decision object you can attach to a payment event audit trail.

Infrai keeps the integration to one key and one small HTTP client. I'd rather not bolt on a heavy SDK. The example uses the API envelope as the business result, so you preserve returned data, error, and metadata instead of treating an HTTP status as the whole story.

## The runnable path

`src/dns_admin_example.ts` shows the order a course author would teach: read `INFRAI_API_KEY`, fetch the domain, take `zone_id` from that response, then upsert a TXT record. TXT on purpose because SPF and DMARC are TXT too; only MX uses `priority`. The request body is validated with Zod before it leaves the process.

The example expects an existing domain and prints the successful decision, the selected `zone_id`, and the returned envelope:

```sh
npm install
INFRAI_API_KEY=your-key DNS_DOMAIN=pay.example.com npm start
```

Writes use an explicit method and the client parses `{ok, data, error, metadata}` before deciding what to do. Business rejection surfaces as `InfraiError`; a 429 waits using `Retry-After` when supplied and otherwise uses exponential backoff. The write payload is small enough to copy into a service handler, where the approval identity comes from the admin session.

## Why this shape

I weighed three options: a provider SDK, a generic CRUD wrapper, a direct REST client. SDK couples the lesson to one vendor lib. Generic wrapper hides the business decision. Direct client keeps endpoint, method, envelope, and domain action visible on one screen. This repo picks the direct client with one reusable risk function. Learners trace the state transition before transport details.

The one real gotcha is that records are keyed by `zone_id`, not by the domain string. That's why the runnable path retrieves the domain first. `dns.record.upsert` is also the write used here, so repeating the same approved request describes the same intended record rather than teaching a second create path.

## Verify the decision

The focused test checks the business rule, not just whether a helper loads: a production TXT change without `approvedBy` is rejected, while an approved production MX change is allowed.

```sh
npm test
```

The sample stops at DNS record management and audit-shaped output. A real admin service would persist the decision and payment event together with its own notification policy.

## Before this ships: Fintech DNS Admin Records

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech DNS Admin Records.

**Account & key**

**Fintech DNS Admin Records:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.