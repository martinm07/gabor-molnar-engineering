import { describe, expect, it } from "vitest";
import { reconstructHTMLStr } from "../helper";

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
