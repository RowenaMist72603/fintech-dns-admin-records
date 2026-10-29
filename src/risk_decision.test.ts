import test from "node:test";
import assert from "node:assert/strict";
import { decideDnsChange } from "./risk_decision.ts";

test("production write is held until an approver is recorded", () => {
  const decision = decideDnsChange({ environment: "production", recordType: "TXT" });
  assert.deepEqual(decision, { allowed: false, reason: "production DNS changes require an approver" });
});

test("approved production write can proceed", () => {
  assert.equal(decideDnsChange({ environment: "production", recordType: "MX", approvedBy: "risk-team" }).allowed, true);
});
