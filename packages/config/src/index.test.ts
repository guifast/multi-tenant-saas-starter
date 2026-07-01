import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./index.js";

describe("parseServerEnv", () => {
  it("validates required server configuration and applies safe defaults", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:15432/app",
      SESSION_SECRET: "test-session-secret-with-more-than-32-characters",
    });

    expect(env.NODE_ENV).toBe("development");
    expect(env.API_PORT).toBe(4000);
    expect(env.WEB_ORIGIN).toBe("http://localhost:3000");
  });
});
