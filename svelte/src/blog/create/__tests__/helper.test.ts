import { describe, expect, it } from "vitest";
import { reconstructHTMLString } from "../docsyncing";

describe("reconstructHTMLStr", () => {
  it("handles basic elements", () => {
    const htmlStr = `
    <div>
      <p>Hello, <strong>world</strong>!</p>
    </div>
    `;
    const container = document.createElement("div");
    container.innerHTML = htmlStr;
    // container.normalize()
    console.log(container.innerHTML);
    expect(false).equals(true);
  });
});
