function buildGraph(connections) {
  const graph = new Map();
  const edges = [];

  for (const connection of connections) {
    const { spy1, spy2 } = connection;

    if (!graph.has(spy1)) graph.set(spy1, new Set());
    if (!graph.has(spy2)) graph.set(spy2, new Set());

    graph.get(spy1).add(spy2);
    graph.get(spy2).add(spy1);

    edges.push({ spy1, spy2 });
  }

  return { graph, edges };
}

function isConnected(graph, excludeEdge = null) {
  if (graph.size === 0) return true;

  const tempGraph = new Map();
  for (const [node, neighbors] of graph) {
    tempGraph.set(node, new Set(neighbors));
  }

  if (excludeEdge) {
    const { spy1, spy2 } = excludeEdge;
    if (tempGraph.has(spy1)) tempGraph.get(spy1).delete(spy2);
    if (tempGraph.has(spy2)) tempGraph.get(spy2).delete(spy1);
  }

  const visited = new Set();
  const queue = [tempGraph.keys().next().value];
  visited.add(queue[0]);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = tempGraph.get(current) || new Set();

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === tempGraph.size;
}

function findExtraChannels(network) {
  const { graph, edges } = buildGraph(network);
  const extraChannels = [];

  for (const edge of edges) {
    if (isConnected(graph, edge)) {
      extraChannels.push(edge);
    }
  }

  return extraChannels;
}

module.exports = {
  buildGraph,
  isConnected,
  findExtraChannels,
};
