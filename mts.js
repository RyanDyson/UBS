const { Jimp } = require("jimp");
const { cv } = require("./opencv.js");

async function toAdjMatrix(image) {
  try {
    const jimpSrc = await Jimp.read(image);
    const src = cv.matFromImageData(jimpSrc.bitmap);

    let gray;
    if (src.channels === 3) {
      gray = src.cvtColor(cv.COLOR_BGR2GRAY);
    } else {
      gray = src.clone();
    }

    const nodes = detectNodes();
    const adjMatrix = detectEdges(gray, nodes);

    src.delete();
    if (gray !== src) {
      gray.delete();
    }

    return {
      matrix: adjMatrix,
      nodes: nodes,
      nodeCount: nodes.length,
    };
  } catch (error) {
    console.error(error);
  }
}

function findClosestNode(point, nodes, tolerance = 20) {
  let closest = null;
  let minDistance = tolerance;

  nodes.forEach((node) => {
    const distance = Math.sqrt(
      Math.pow(point.x - node.x, 2) + Math.pow(point.y - node.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = node;
    }
  });

  return closest;
}

function isPointInRect(point, rect, tolerance = 30) {
  return (
    point.x >= rect.x - tolerance &&
    point.x <= rect.x + rect.width + tolerance &&
    point.y >= rect.y - tolerance &&
    point.y <= rect.y + rect.height + tolerance
  );
}

function detectEdgesByCountours(mask, nodes, adjMatrix) {
  const contours = mask.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  contours.forEach((contour) => {
    if (contour.area < 10) return;

    const rect = contour.boundingRect();
    const nearbyNodes = nodes.filter((node) => {
      return isPointInRect(node, rect, 30);
    });

    if (nearbyNodes.length >= 2) {
      for (let i = 0; i < nearbyNodes.length; i++) {
        for (let j = i + 1; j < nearbyNodes.length; j++) {
          const startNode = nearbyNodes[i];
          const endNode = nearbyNodes[j];
          const dist = Math.sqrt(
            Math.pow(startNode.x - endNode.x, 2) +
              Math.pow(startNode.y - endNode.y, 2)
          );
          adjMatrix[startNode.id][endNode.id] = dist;
          adjMatrix[endNode.id][startNode.id] = dist;
        }
      }
    }
  });
}

function detectEdges(grayscale, nodes) {
  const nodeCount = nodes.length;
  const adjMatrix = Array(nodeCount)
    .fill()
    .map(() => Array(nodeCount).fill(0));

  const mask = grayscale.clone();
  nodes.forEach((node) => {
    mask.drawCircle(
      new cv.Point2(node.x, node.y),
      node.radius + 3,
      new cv.Vec3(0, 0, 0),
      -1
    );
  });

  const edges = mask.canny(50, 150);

  const lines = edges.houghLinesP(1, Math.PI / 180, 30, 20, 10);
  lines.forEach((line) => {
    const start = {
      x: line.x,
      y: line.y,
    };
    const end = { x: line.z, y: line.w };
    const startNode = findClosestNode(start, nodes);
    const endNode = findClosestNode(end, nodes);

    if (startNode && endNode && startNode.id !== endNode.id) {
      const dist = Math.sqrt(
        Math.pow(startNode.x - endNode.x, 2) +
          Math.pow(startNode.y - endNode.y, 2)
      );
      adjMatrix[startNode.id][endNode.id] = dist;
      adjMatrix[endNode.id][startNode.id] = dist;
    }
  });
}

function detectNodes(grayscale) {
  const circles = grayscale.HoughCircles(
    cv.HOUGH_GRADIENT,
    1,
    30,
    100,
    20,
    5,
    50
  );

  const nodes = circles.map((circle, index) => ({
    id: index,
    x: Math.round(circle.x),
    y: Math.round(circle.y),
    radius: Math.round(circle.z),
  }));

  return nodes;
}

function calcMST(adjMatrix) {
  const n = adjMatrix.length;
  if (n === 0) return { edges: [], totalWeight: 0 };

  // Prim's algorithm implementation
  const visited = new Array(n).fill(false);
  const key = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const mstEdges = [];

  // Start from vertex 0
  key[0] = 0;

  for (let count = 0; count < n - 1; count++) {
    // Find minimum key vertex not yet in MST
    let minKey = Infinity;
    let minIndex = -1;

    for (let v = 0; v < n; v++) {
      if (!visited[v] && key[v] < minKey) {
        minKey = key[v];
        minIndex = v;
      }
    }

    if (minIndex === -1) break; // No more connected vertices

    visited[minIndex] = true;

    // Add edge to MST (except for the first vertex)
    if (parent[minIndex] !== -1) {
      mstEdges.push({
        from: parent[minIndex],
        to: minIndex,
        weight: adjMatrix[parent[minIndex]][minIndex],
      });
    }

    // Update key values of adjacent vertices
    for (let v = 0; v < n; v++) {
      if (
        !visited[v] &&
        adjMatrix[minIndex][v] !== 0 &&
        adjMatrix[minIndex][v] < key[v]
      ) {
        key[v] = adjMatrix[minIndex][v];
        parent[v] = minIndex;
      }
    }
  }

  // Calculate total weight
  const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);

  return {
    edges: mstEdges,
    totalWeight: totalWeight,
    numVertices: n,
  };
}

module.exports = {
  toAdjMatrix,
  calcMST,
};
