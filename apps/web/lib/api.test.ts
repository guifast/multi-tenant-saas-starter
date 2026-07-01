import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses structured API error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: "Workspace not found." } }),
      }),
    );

    await expect(apiRequest("/tenants/missing")).rejects.toThrow("Workspace not found.");
  });
});
