import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "./index.js";

describe("Button", () => {
  it("applies the secondary visual variant", () => {
    const element = Button({ children: "Save", variant: "secondary" });

    if (!isValidElement<{ className: string; children: string }>(element)) {
      throw new Error("Button did not return a valid React element.");
    }
    expect(element.props.className).toContain("bg-white");
    expect(element.props.children).toBe("Save");
  });
});
