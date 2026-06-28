import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AppError } from "../errors/app-error";
import { CsrfGuard } from "./csrf.guard";

type TestRequest = {
  method: string;
  cookies?: Record<string, string>;
  header: (name: string) => string | undefined;
};

function contextFor(request: TestRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("CsrfGuard", () => {
  it("allows safe HTTP methods without a token", () => {
    const guard = new CsrfGuard();

    expect(
      guard.canActivate(
        contextFor({
          method: "GET",
          header: () => undefined,
        }),
      ),
    ).toBe(true);
  });

  it("requires a matching csrf cookie and header for mutations", () => {
    const guard = new CsrfGuard();

    expect(() =>
      guard.canActivate(
        contextFor({
          method: "POST",
          cookies: { csrf: "cookie-token" },
          header: () => "wrong-token",
        }),
      ),
    ).toThrow(AppError);

    expect(
      guard.canActivate(
        contextFor({
          method: "PATCH",
          cookies: { csrf: "token" },
          header: () => "token",
        }),
      ),
    ).toBe(true);
  });
});
