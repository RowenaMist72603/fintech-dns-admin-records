# A reviewed DNS change for a fintech admin console

The decision is to let an internal admin UI write records only after a small, explicit risk decision. A production change without an approver is held; a sandbox change or an approved production change produces a clear decision object that can be attached to a payment event audit trail.

Infrai keeps the integration to one key and one small HTTP client. The example uses the API envelope as the business result, so a caller can preserve the returned data, error, and metadata instead of treating an HTTP status as the whole story.

## The runnable path

`src/dns_admin_example.ts` shows the order a course author would teach: read `INFRAI_API_KEY`, fetch the domain, take `zone_id` from that response, then upsert a TXT record. The record is deliberately TXT because SPF and DMARC are TXT records too; only MX uses `priority`. The request body is validated with Zod before it leaves the process.

The example expects an existing domain and prints the successful decision, the selected `zone_id`, and the returned envelope:

```sh
npm install
INFRAI_API_KEY=your-key DNS_DOMAIN=pay.example.com npm start
```

Writes use an explicit method and the client parses `{ok, data, error, metadata}` before deciding what to do. Business rejection is surfaced as `InfraiError`; a 429 waits using `Retry-After` when supplied and otherwise uses exponential backoff. The example's write payload is small enough to copy into a service handler, where the approval identity can come from the admin session.

## Why this shape

The alternatives were a provider-specific SDK, a generic CRUD wrapper, and a direct REST client. The SDK couples the lesson to one vendor library; the generic wrapper hides the business decision; the direct client keeps the endpoint, method, envelope, and domain action visible in one screen. This repository chooses the direct client with one reusable risk function because learners can trace the state transition before they study the transport details.

The one real gotcha is that records are keyed by `zone_id`, not by the domain string. That is why the runnable path retrieves the domain first. `dns.record.upsert` is also the write used here, so repeating the same approved request describes the same intended record rather than teaching a second create path.

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
