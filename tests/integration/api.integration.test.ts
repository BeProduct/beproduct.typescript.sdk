import { describe, it, expect } from "vitest";
import { getClient, SKIP_SHAPE } from "./setup.js";
import { BlockHeaderSchema } from "../../src/schemas/block.js";
import { TrackingPlanSchema, PlanProgressSchema } from "../../src/schemas/tracking.js";

// ltd3-specific shape suite. Runs only when BEPRODUCT_COMPANY_DOMAIN=ltd3.
//
// Holds ONLY the resources not yet covered on the integration_autotest tenant:
// block, tracking, and data tables. Style + material/color/image/directory/
// users/master-data now have golden coverage on integration_autotest, so those
// were removed from here.
describe.skipIf(SKIP_SHAPE)("Integration — live API (ltd3 shape)", () => {
  const client = SKIP_SHAPE ? (null as never) : getClient();

  // ── Auth (smoke) ──
  it("authenticates successfully", async () => {
    const token = await client.raw["tokenManager"].getAccessToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  // ── Block ──
  it("lists block folders and gets a header", async () => {
    const folders = await client.block.folders();
    expect(folders.length).toBeGreaterThan(0);
    for await (const h of client.block.list({ folderId: folders[0].id, pageSize: 1 })) {
      const full = await client.block.get(h.id as string);
      BlockHeaderSchema.parse(full);
      break;
    }
  });

  // ── Tracking ──
  it("lists tracking folders", async () => {
    const folders = await client.tracking.folders();
    expect(folders.length).toBeGreaterThan(0);
  });

  it("searches tracking plans", async () => {
    let count = 0;
    for await (const plan of client.tracking.planList({ pageSize: 2 })) {
      TrackingPlanSchema.parse(plan);
      count++;
      if (count >= 2) break;
    }
    expect(count).toBeGreaterThan(0);
  });

  it("gets tracking plan with views and timelines", async () => {
    let planId: string | null = null;
    for await (const p of client.tracking.planList({ pageSize: 1 })) {
      planId = p.id;
      break;
    }
    if (planId) {
      const plan = await client.tracking.planGet(planId);
      TrackingPlanSchema.parse(plan);
      expect(plan.style?.views?.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("gets style progress", async () => {
    let planId: string | null = null;
    for await (const p of client.tracking.planList({ pageSize: 1 })) {
      planId = p.id;
      break;
    }
    if (planId) {
      const progress = await client.tracking.styleProgress(planId);
      PlanProgressSchema.parse(progress);
      expect(progress.total).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Data Tables ──
  it("lists data tables", async () => {
    let count = 0;
    for await (const dt of client.dataTables.list({ pageSize: 2 })) {
      expect(dt).toHaveProperty("name");
      count++;
      if (count >= 2) break;
    }
    expect(count).toBeGreaterThan(0);
  });
});
