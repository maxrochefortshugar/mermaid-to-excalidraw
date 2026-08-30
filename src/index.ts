import { DEFAULT_FONT_SIZE } from "./constants.js";
import { graphToExcalidraw } from "./graphToExcalidraw.js";
import { parseMermaid } from "./parseMermaid.js";
import type { Flowchart } from "./parser/flowchart.js";
import type { Sequence } from "./parser/sequence.js";
import type { ERD } from "./parser/er.js";

export interface MermaidConfig {
  /**
   * Whether to start the diagram automatically when the page loads.
   * @default false
   */
  startOnLoad?: boolean;
  /**
   * The flowchart curve style.
   * @default "linear"
   */
  flowchart?: {
    curve?: "linear" | "basis";
  };
  /**
   * Theme variables
   * @default { fontSize: "25px" }
   */
  themeVariables?: {
    fontSize?: string;
  };
  /**
   * Maximum number of edges to be rendered.
   * @default 1000
   */
  maxEdges?: number;
  /**
   * Maximum number of characters to be rendered.
   * @default 1000
   */
  maxTextSize?: number;
}

export interface ExcalidrawConfig {
  fontSize?: number;
}

const parseMermaidToExcalidraw = async (
  definition: string,
  config?: MermaidConfig,
) => {
  const mermaidConfig = config || {};
  const fontSize =
    parseInt(mermaidConfig.themeVariables?.fontSize ?? "") || DEFAULT_FONT_SIZE;
  const parsedMermaidData = await parseMermaid(definition, {
    ...mermaidConfig,
    themeVariables: {
      ...mermaidConfig.themeVariables,
    },
  });
  // Only font size supported for excalidraw elements
  const excalidrawElements = graphToExcalidraw(parsedMermaidData, {
    fontSize,
  });
  return excalidrawElements;
};

export type StrictMermaidData = Flowchart | Sequence | ERD;

/**
 * Parses only diagram kinds that remain semantically editable after import.
 * Raster/SVG fallbacks and file payloads are rejected instead of silently
 * weakening the caller's canonical model.
 */
const parseMermaidToExcalidrawStrict = async (
  definition: string,
  config?: MermaidConfig,
) => {
  const mermaidConfig = config || {};
  const fontSize =
    parseInt(mermaidConfig.themeVariables?.fontSize ?? "") || DEFAULT_FONT_SIZE;
  const parsed = await parseMermaid(definition, {
    ...mermaidConfig,
    securityLevel: "strict",
    htmlLabels: false,
    themeVariables: { ...mermaidConfig.themeVariables },
  });
  if (parsed.type !== "flowchart" && parsed.type !== "sequence" && parsed.type !== "erd") {
    throw new Error(`Unsupported semantic Mermaid diagram: ${parsed.type}`);
  }
  const result = graphToExcalidraw(parsed, { fontSize });
  if (result.files && Object.keys(result.files).length) {
    throw new Error("Mermaid conversion produced binary files");
  }
  return { ...result, data: parsed as StrictMermaidData };
};

export { parseMermaid, parseMermaidToExcalidraw, parseMermaidToExcalidrawStrict };
export type { Flowchart } from "./parser/flowchart.js";
export type { Sequence } from "./parser/sequence.js";
export type { ERD } from "./parser/er.js";
export type { Arrow, Container, Line, Text } from "./elementSkeleton.js";
