import { describe, expect, it } from "vitest";
import { normalizeSlug, slugSchema } from "./index.js";

describe("contracts", () => {
  it("normalizes tenant slugs", () => {
    expect(normalizeSlug(" Acme Workspace! ")).toBe("acme-workspace");
  });

  it("rejects invalid slugs", () => {
    expect(slugSchema.safeParse("Bad Slug").success).toBe(false);
  });
});
