import { describe, expect, it } from "vitest";
import { sanitizeRoute } from "./request-id.middleware";

describe("sanitizeRoute", () => {
  it("redacts invitation tokens from log routes", () => {
    expect(sanitizeRoute("/invitations/raw-token-value/accept")).toBe(
      "/invitations/[redacted]/accept",
    );
  });
});
