export interface LayoutEdge {
  from: string
  to: string
}

interface SoupElementLike {
  type: string
  source_port_id?: string
  source_component_id?: string
  connected_source_port_ids?: string[]
}

/**
 * Builds vis-network layout edges from the source traces of a soup.
 *
 * Each edge pulls two components together in the force-directed layout.
 * A source trace is a net that can connect any number of ports; the
 * components of all its ports are linked as a star centered on the first
 * port's component. Self loops and duplicate edges are dropped because
 * they add no layout information.
 */
export const buildLayoutEdges = (soup: SoupElementLike[]): LayoutEdge[] => {
  const edges: LayoutEdge[] = []
  const seen = new Set<string>()
  for (const st of soup.filter((e) => e.type === "source_trace")) {
    const sps = soup.filter(
      (e) =>
        e.type === "source_port" &&
        st.connected_source_port_ids!.includes(e.source_port_id!)
    )

    const first = sps[0]
    if (!first) continue
    for (const sp of sps.slice(1)) {
      if (sp.source_component_id === first.source_component_id) continue
      const edge = {
        from: first.source_component_id!,
        to: sp.source_component_id!,
      }
      const key = [edge.from, edge.to].sort().join(" ")
      if (seen.has(key)) continue
      seen.add(key)
      edges.push(edge)
    }
  }
  return edges
}
