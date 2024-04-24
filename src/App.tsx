/**
 * DID:
 * 1. Schematic should reflect graph positions
 *
 * TODO:
 * 2. Automatic alignment post-process
 * 3. Initial positions based on ports
 * 4. Rotate components 90, 180 etc. where lines cross
 *
 */
import "./App.css"
import { useEffect, useReducer, useRef, useState } from "react"
import initialSoup from "./assets/soup.json"
import type { Soup } from "@tscircuit/builder"
import { Schematic } from "@tscircuit/schematic-viewer"
import { transformSchematicElements } from "@tscircuit/builder"
import { Network } from "vis-network"
import { translate } from "transformation-matrix"

const nodes = initialSoup
  .filter((e) => e.type === "schematic_component")
  .map((e: Soup.SchematicComponent) => {
    const sc = initialSoup.find(
      (e2) =>
        e2.type === "source_component" &&
        e2.source_component_id === e.source_component_id
    )

    return {
      id: e.source_component_id,
      name: sc!.name ?? "unknown",
      label: sc!.name ?? "unknown",
    }
  })

const edges = initialSoup
  .filter((e) => e.type === "source_trace")
  .map(
    (st: { source_trace_id: string; connected_source_port_ids: string[] }) => {
      const sps = initialSoup.filter(
        (e) =>
          e.type === "source_port" &&
          st.connected_source_port_ids.includes(e.source_port_id)
      )

      return {
        from: sps[0].source_component_id,
        to: sps[1].source_component_id,
      }
    }
  )

function App() {
  // const [network, setNetwork] = useState<any>(null)
  const [counter, incCounter] = useReducer((prev) => prev + 1, 0)
  const graphRef = useRef()
  const netRef = useRef()

  const [soup, setSoup] = useState<Soup.AnySoupElement>(initialSoup)

  function updateSchematicForGraph() {
    const net = netRef.current
    if (!net) return
    // look at what graph solved
    const newSoup = JSON.parse(JSON.stringify(initialSoup)).filter(
      (a) => a.type !== "schematic_trace"
    )

    for (const [source_component_id, screenPosition] of Object.entries(
      net.getPositions(nodes.map((n) => n.id))
    )) {
      const schematic_component = newSoup.find(
        (e) =>
          e.type === "schematic_component" &&
          e.source_component_id === source_component_id
      )

      const schematic_component_children = newSoup.filter(
        (e) =>
          e.schematic_component_id ===
          schematic_component.schematic_component_id
      )

      transformSchematicElements(
        schematic_component_children,
        translate(-schematic_component.center.x, -schematic_component.center.y)
      )
      // schematic_component.center = { x: 0, y: 0 }
      schematic_component.center = {
        x: (screenPosition.x / 200) * 5,
        y: (screenPosition.y / 200) * -5,
      }
      transformSchematicElements(
        schematic_component_children,
        translate(schematic_component.center.x, schematic_component.center.y)
      )
    }

    for (const og_schematic_trace of initialSoup.filter(
      (e) => e.type === "source_trace"
    )) {
      const sps = initialSoup.filter(
        (e) =>
          e.type === "source_port" &&
          og_schematic_trace.connected_source_port_ids.includes(
            e.source_port_id
          )
      )

      const schps = newSoup.filter(
        (e) =>
          e.type === "schematic_port" &&
          sps.map((sp) => sp.source_port_id).includes(e.source_port_id)
      )

      const new_schematic_trace = {
        type: "schematic_trace",
        source_trace_id: og_schematic_trace.source_trace_id,
        schematic_trace_id: og_schematic_trace.schematic_trace_id,
        edges: [
          {
            from: {
              x: schps[0].center.x,
              y: schps[0].center.y,
            },
            to: {
              x: schps[1].center.x,
              y: schps[1].center.y,
            },
          },
        ],
      }

      newSoup.push(new_schematic_trace)
    }

    setSoup(newSoup)
    incCounter()
  }

  useEffect(() => {
    if (!graphRef.current) return
    const net = new Network(
      graphRef.current,
      { nodes, edges },
      {
        layout: {
          hierarchical: false,
        },
        height: "700px",
      }
    )
    netRef.current = net

    setTimeout(() => {
      updateSchematicForGraph()
    }, 1_000)
  }, [graphRef.current])

  return (
    <div>
      <button
        onClick={() => {
          updateSchematicForGraph()
        }}
      >
        update schematic
      </button>
      <div ref={graphRef}></div>
      {/* <Graph
        graph={{
          nodes,
          edges,
        }}
        options={{
          layout: {
            hierarchical: false,
          },
          height: "700px",
        }}
      /> */}
      <Schematic
        key={counter}
        soup={[...soup].map((elm) => {
          if (elm.type === "schematic_component") {
            return { ...elm }
          }
          return elm
        })}
        style={{
          width: 1200,
          height: 800,
        }}
      />
      <Schematic
        soup={[...initialSoup]}
        style={{
          width: 1200,
          height: 800,
        }}
      />
    </div>
  )
}

export default App
