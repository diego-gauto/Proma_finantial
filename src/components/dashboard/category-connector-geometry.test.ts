import { describe, expect, it } from "vitest";

import {
  buildCategoryConnectorLayout,
  getStableConnectorGroups
} from "./category-connector-geometry";

describe("category connector geometry", () => {
  it("centers a category row under the selected root using real chip widths", () => {
    const layout = buildCategoryConnectorLayout({
      containerWidth: 640,
      levels: [
        {
          categories: [
            { height: 38, id: "cetic", width: 66 },
            { height: 38, id: "foniva", width: 76 },
            { height: 38, id: "setia", width: 68 },
            { height: 38, id: "soiva", width: 70 }
          ],
          parentId: null
        }
      ]
    });

    const first = layout.nodes[0];
    const last = layout.nodes[3];
    const rowCenter = (first.left + last.left + last.width) / 2;

    expect(rowCenter).toBe(320);
    expect(layout.connectorGroups[0].parent.x).toBe(320);
    expect(layout.connectorGroups[0].children.map((child) => child.x)).toEqual([
      201,
      280,
      360,
      437
    ]);
  });

  it("keeps the row centered when sibling chip widths are uneven", () => {
    const layout = buildCategoryConnectorLayout({
      containerWidth: 640,
      levels: [
        {
          categories: [
            { height: 38, id: "short", width: 60 },
            { height: 38, id: "long", width: 148 }
          ],
          parentId: null
        }
      ]
    });

    const first = layout.nodes[0];
    const last = layout.nodes[1];
    const rowCenter = (first.left + last.left + last.width) / 2;

    expect(rowCenter).toBe(320);
    expect(layout.connectorGroups[0].children.map((child) => child.x)).toEqual([
      242,
      354
    ]);
  });

  it("centers a new child row under the selected parent without moving previous levels", () => {
    const layout = buildCategoryConnectorLayout({
      containerWidth: 640,
      levels: [
        {
          categories: [
            { height: 38, id: "cetic", width: 66 },
            { height: 38, id: "foniva", width: 76 },
            { height: 38, id: "setia", width: 68 },
            { height: 38, id: "soiva", width: 70 }
          ],
          parentId: null
        },
        {
          categories: [
            { height: 38, id: "sub-cetic", width: 60 },
            { height: 38, id: "sepelios", width: 86 },
            { height: 38, id: "sindical", width: 88 },
            { height: 38, id: "turismo", width: 84 }
          ],
          parentId: "cetic"
        }
      ]
    });

    const cetic = layout.nodes.find((node) => node.id === "cetic");
    const children = layout.nodes.filter((node) => node.levelIndex === 1);
    const firstChild = children[0];
    const lastChild = children[children.length - 1];
    const childRowCenter = (firstChild.left + lastChild.left + lastChild.width) / 2;

    expect(cetic?.centerX).toBe(201);
    expect(childRowCenter).toBe(cetic?.centerX);
    expect(layout.connectorGroups[1].parent.x).toBe(cetic?.centerX);
  });

  it("clamps a deep child row inside the tree canvas", () => {
    const layout = buildCategoryConnectorLayout({
      containerWidth: 640,
      levels: [
        {
          categories: [
            { height: 38, id: "cetic", width: 66 },
            { height: 38, id: "foniva", width: 76 },
            { height: 38, id: "setia", width: 68 },
            { height: 38, id: "soiva", width: 70 }
          ],
          parentId: null
        },
        {
          categories: [
            { height: 38, id: "sub-cetic", width: 92 },
            { height: 38, id: "sepelios", width: 104 },
            { height: 38, id: "sindical", width: 106 },
            { height: 38, id: "turismo", width: 104 },
            { height: 38, id: "large", width: 130 }
          ],
          parentId: "cetic"
        }
      ]
    });

    const children = layout.nodes.filter((node) => node.levelIndex === 1);

    expect(children[0].left).toBe(0);
    expect(children[children.length - 1].left + children[children.length - 1].width)
      .toBeLessThanOrEqual(640);
  });

  it("keeps the previous connector group reference when geometry did not move", () => {
    const layout = buildCategoryConnectorLayout({
      containerWidth: 640,
      levels: [
        {
          categories: [{ height: 38, id: "cetic", width: 66 }],
          parentId: null
        }
      ]
    });
    const previousGroups = structuredClone(layout.connectorGroups);

    expect(getStableConnectorGroups(layout.connectorGroups, previousGroups)).toBe(
      previousGroups
    );
    expect(getStableConnectorGroups(layout.connectorGroups, [])).toBe(
      layout.connectorGroups
    );
  });
});
