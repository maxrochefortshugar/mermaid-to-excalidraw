import { describe, expect, it } from "vitest";
import { parseMermaidToExcalidrawStrict } from "../src/index";

const originalGetBBox = SVGElement.prototype.getBBox;
const originalGetComputedTextLength = SVGElement.prototype.getComputedTextLength;

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value() {
      const text = this.textContent ?? "";
      return { x: 0, y: 0, width: Math.max(text.length * 8, 80), height: 32 };
    },
  });
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
    configurable: true,
    value() { return Math.max((this.textContent ?? "").length * 8, 8); },
  });
});

afterAll(() => {
  Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value: originalGetBBox });
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", { configurable: true, value: originalGetComputedTextLength });
});

describe("strict semantic conversion", () => {
  it.each([
    ["flowchart", "flowchart TB\n  A[Start] --> B[Done]"],
    ["sequence", "sequenceDiagram\n  participant A\n  participant B\n  A->>B: Hello"],
    ["erd", "erDiagram\n  CUSTOMER ||--o{ ORDER : places"],
  ])("returns typed %s data without files", async (type, definition) => {
    const result = await parseMermaidToExcalidrawStrict(definition);
    expect(result.data.type).toBe(type);
    expect(result.elements.length).toBeGreaterThan(0);
    expect(result.files).toBeUndefined();
  });

  it("rejects diagrams that cannot remain semantically editable", async () => {
    await expect(parseMermaidToExcalidrawStrict("pie\n  title Pets\n  \"Dogs\" : 4"))
      .rejects.toThrow("Unsupported semantic Mermaid diagram");
  });
});
