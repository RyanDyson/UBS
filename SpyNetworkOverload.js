const edge = {
    spy1: "Karina",
    spy2: "Giselle"
}

const sample = {
    "networks": [
      {
        "networkId": "network1",
        "network": [
          {
            "spy1": "Karina",
            "spy2": "Giselle"
          },
          {
            "spy1": "Karina",
            "spy2": "Winter"
          },
          {
            "spy1": "Karina",
            "spy2": "Ningning"
          },
          {
            "spy1": "Giselle",
            "spy2": "Winter"
          }
        ]
      }
    ]
  }


/**
 * @param {(typeof edge)[]} edgeList 
 */
function createGraph(edgeList) {
    const obj = {}
    for (const edge of edgeList) {
        if (!(edge.spy1 in obj)) obj[edge.spy1] = []
        if (!(edge.spy2 in obj)) obj[edge.spy2] = []
        obj[spy1].push(edge)
        obj[spy2].push(edge)
    }
    return obj
}

/**
 * @param {(typeof edge)[]} edgeList 
 * @param {Object.<string, (typeof edge)[]>} graph
 * @param 
 */
function createRootedSpanningTree(graph, edgeList, parent = null, spanningTree = {}) {
    if (parent == null) {
        spanningTree[parent] = graph[parent].map(({}) => {

        })
    }
    const invalids = []
    for (const edge of edgeList) {
        if (edge.spy1 in nodes || edge.spy2 in nodes) {
            invalids.push(edge)
        } else {
            spanningTree.push(edge)
        }
    }

    return {invalids, spanningTree}
}

/**
 * @param {(typeof edge)[]} edgeList 
 */
function undirectedToDirectedTree(edgeList, graph) {

}

/** 
 * @param {(typeof edge)[]} graph 
 * @returns {(typeof edge)[]}
 */
function GetGraphLoops(graph) {
    // Array of edges -> Object<node, edge>
    const newgraph = createGraph(graph)
    const {invalids, spanningTree} = createSpanningTree(graph)

}