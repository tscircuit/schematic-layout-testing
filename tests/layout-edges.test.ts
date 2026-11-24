import { describe, test, expect } from "vitest"
import { buildLayoutEdges } from "../src/lib/layout-edges"

const port = (portId: string, componentId: string) => ({
  type: "source_port",
  source_port_id: portId,
  source_component_id: componentId,
})

const trace = (portIds: string[]) => ({
  type: "source_trace",
  connected_source_port_ids: portIds,
})

describe("buildLayoutEdges", () => {
  test("a two-port net produces one edge, preserving existing behavior", () => {
    const soup = [
      port("p1", "compA"),
      port("p2", "compB"),
      trace(["p1", "p2"]),
    ]
    expect(buildLayoutEdges(soup)).toEqual([{ from: "compA", to: "compB" }])
  })

  test("a multi-port net links every component, not just the first two", () => {
    const soup = [
      port("p1", "compA"),
      port("p2", "compB"),
      port("p3", "compC"),
      trace(["p1", "p2", "p3"]),
    ]
    const edges = buildLayoutEdges(soup)
    // compC must be pulled toward the net or it is placed as if unconnected
    expect(edges).toContainEqual({ from: "compA", to: "compC" })
    expect(edges).toContainEqual({ from: "compA", to: "compB" })
  })

  test("a single-port net produces no edge instead of crashing", () => {
    const soup = [port("p1", "compA"), trace(["p1"])]
    expect(() => buildLayoutEdges(soup)).not.toThrow()
    expect(buildLayoutEdges(soup)).toEqual([])
  })

  test("a net shorting two ports of one component produces no self loop", () => {
    const soup = [
      port("p1", "compA"),
      port("p2", "compA"),
      trace(["p1", "p2"]),
    ]
    expect(buildLayoutEdges(soup)).toEqual([])
  })

  test("duplicate connections between the same components are deduplicated", () => {
    const soup = [
      port("p1", "compA"),
      port("p2", "compB"),
      port("p3", "compA"),
      port("p4", "compB"),
      trace(["p1", "p2"]),
      trace(["p3", "p4"]),
    ]
    expect(buildLayoutEdges(soup)).toEqual([{ from: "compA", to: "compB" }])
  })
})
