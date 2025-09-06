import { robustImputation } from "./blankety-blank.js";
import { toAdjMatrix } from "./mts.js";
import { findBestConcert } from "./training-agent.js";

const express = require("express");
const morganBody = require("morgan-body");
const path = require("path");
const jimp = require("jimp");
const cv = require("./opencv.js");
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json({ limit: "100mb" }));
morganBody(app, { noColors: process.env.NODE_ENV === "production" });

app
  .post("/square", (req, res) => {
    const output = parseInt(req.body.input) ** 2;
    res.json(output);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

/**
 * @param {Array} customer
 * @param {Array} concerts
 * @returns {string}
 * push comment
 */

// Payload routes - always return file content
const payloads = [
  "crackme",
  "sqlinject",
  "stack",
  "shellcode",
  "hashclash-mini",
  "hashclash",
];
for (const payload of payloads) {
  const filename = "payload_" + payload;
  app.get("/" + filename, (req, res) => {
    const filePath =
      process.env.VERCEL_URL || process.env.VERCEL
        ? path.join(process.cwd(), filename)
        : path.join(__dirname, filename);

    res.sendFile(filePath);
  });
}

function linearInterpolate(arr) {
  const result = [...arr];

  let firstValid = result.findIndex((x) => x !== null);
  if (firstValid > 0) {
    for (let i = 0; i < firstValid; i++) {
      result[i] = result[firstValid];
    }
  }

  let lastValid = -1;
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i] !== null) {
      lastValid = i;
      break;
    }
  }
  if (lastValid < result.length - 1) {
    for (let i = lastValid + 1; i < result.length; i++) {
      result[i] = result[lastValid];
    }
  }

  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) {
      let prevIdx = i - 1;
      let nextIdx = i + 1;

      while (prevIdx >= 0 && result[prevIdx] === null) prevIdx--;
      while (nextIdx < result.length && result[nextIdx] === null) nextIdx++;

      if (prevIdx >= 0 && nextIdx < result.length) {
        const prevVal = result[prevIdx];
        const nextVal = result[nextIdx];
        const ratio = (i - prevIdx) / (nextIdx - prevIdx);
        result[i] = prevVal + ratio * (nextVal - prevVal);
      }
    }
  }

  return result;
}

function movingAverage(arr, window = 5) {
  const result = [...arr];

  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) {
      let sum = 0;
      let count = 0;

      const start = Math.max(0, i - window);
      const end = Math.min(result.length, i + window + 1);

      for (let j = start; j < end; j++) {
        if (result[j] !== null) {
          sum += result[j];
          count++;
        }
      }

      if (count > 0) {
        result[i] = sum / count;
      }
    }
  }

  return result;
}

function polynomialFit(arr, degree = 2) {
  const result = [...arr];

  const validPoints = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== null) {
      validPoints.push({ x: i, y: arr[i] });
    }
  }

  if (validPoints.length < degree + 1) {
    return linearInterpolate(arr);
  }
  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) {
      const nearbyPoints = validPoints
        .filter((p) => Math.abs(p.x - i) <= 50)
        .sort((a, b) => Math.abs(a.x - i) - Math.abs(b.x - i))
        .slice(0, Math.max(10, degree + 3));

      if (nearbyPoints.length >= 2) {
        const n = nearbyPoints.length;
        const sumX = nearbyPoints.reduce((sum, p) => sum + p.x, 0);
        const sumY = nearbyPoints.reduce((sum, p) => sum + p.y, 0);
        const sumXY = nearbyPoints.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = nearbyPoints.reduce((sum, p) => sum + p.x * p.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        result[i] = slope * i + intercept;
      }
    }
  }

  return result;
}

function robustImputation(arr) {
  let result = [...arr];

  result = linearInterpolate(result);

  const validValues = result.filter((x) => x !== null && !isNaN(x));
  if (validValues.length > 10) {
    const trend = detectTrend(result);
    if (Math.abs(trend) > 0.01) {
      const polyResult = polynomialFit(arr);
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === null) {
          const trendWeight = Math.min(1, Math.abs(trend) * 10);
          result[i] =
            result[i] * (1 - trendWeight) + polyResult[i] * trendWeight;
        }
      }
    }
  }

  const smoothed = [...result];
  for (let i = 1; i < result.length - 1; i++) {
    if (arr[i] === null) {
      smoothed[i] =
        0.25 * result[i - 1] + 0.5 * result[i] + 0.25 * result[i + 1];
    }
  }

  for (let i = 0; i < smoothed.length; i++) {
    if (isNaN(smoothed[i]) || !isFinite(smoothed[i])) {
      smoothed[i] = 0;
    }
  }

  return smoothed;
}

function detectTrend(arr) {
  const validPoints = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== null && !isNaN(arr[i])) {
      validPoints.push({ x: i, y: arr[i] });
    }
  }

  if (validPoints.length < 2) return 0;

  const n = validPoints.length;
  const sumX = validPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = validPoints.reduce((sum, p) => sum + p.y, 0);
  const sumXY = validPoints.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = validPoints.reduce((sum, p) => sum + p.x * p.x, 0);

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

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

app.post("/investigate", (req, res) => {
  const networks = req.body;

  const result = {
    networks: networks.map((networkData) => ({
      networkId: networkData.networkId,
      extraChannels: findExtraChannels(networkData.network),
    })),
  };

  res.json(result);
});

app.post("/blankety", (req, res) => {
  try {
    const { series } = req.body;
    if (!series || !Array.isArray(series) || series.length !== 100) {
      return res.status(400).json({ error: "Expected array of 100 series" });
    }

    const answer = [];

    for (let i = 0; i < series.length; i++) {
      const currentSeries = series[i];

      if (!Array.isArray(currentSeries) || currentSeries.length !== 1000) {
        return res.status(400).json({
          error: `Series ${i} must have exactly 1000 elements`,
        });
      }

      const imputed = robustImputation(currentSeries);
      answer.push(imputed);
    }

    res.json({ answer });
  } catch (error) {
    console.error("Imputation error:", error);
    res.status(500).json({ error: "Internal server error during imputation" });
  }
});

app.post("/ticketing-agent", (req, res) => {
  const { customers, concerts, priority } = req.body;
  res.json(
    Object.fromEntries(
      customers.map((x) => [x.name, findBestConcert(x, concerts, priority)])
    )
  );
});

app.get("/trivia", (req, res) => {
  res.json({
    answers: [4, 1, 2, 2, 3, 4, 4, 5, 4],
  });
});

app.post("/mst-calcuation", (req, res) => {
  const { image: image1 } = req.body[0];
  const { image: image2 } = req.body[1];

  const matrix1 = toAdjMatrix(image1);
  const matrix2 = toAdjMatrix(image2);
});

//vercel testing
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

class OptimizedTaskScheduler {
  constructor(subway) {
    this.stationCount = this.getStationCount(subway);
    this.travelCosts = this.precomputeAllTravelCosts(subway);
  }

  getStationCount(subway) {
    const stations = new Set();
    for (const connection of subway) {
      stations.add(connection.connection[0]);
      stations.add(connection.connection[1]);
    }
    return stations.size;
  }

  precomputeAllTravelCosts(subway) {
    // Floyd-Warshall algorithm for all-pairs shortest path
    const stations = new Set();
    for (const connection of subway) {
      stations.add(connection.connection[0]);
      stations.add(connection.connection[1]);
    }

    const stationList = Array.from(stations).sort((a, b) => a - b);
    const n = stationList.length;
    const indexMap = {};
    stationList.forEach((station, index) => {
      indexMap[station] = index;
    });

    // Initialize cost matrix
    const dist = Array(n)
      .fill()
      .map(() => Array(n).fill(Infinity));
    for (let i = 0; i < n; i++) {
      dist[i][i] = 0;
    }

    // Fill direct connections
    for (const connection of subway) {
      const [u, v] = connection.connection;
      const fee = connection.fee;
      const i = indexMap[u];
      const j = indexMap[v];
      dist[i][j] = fee;
      dist[j][i] = fee;
    }

    // Floyd-Warshall algorithm
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }

    // Create easy access map
    const costMap = {};
    for (let i = 0; i < n; i++) {
      const u = stationList[i];
      costMap[u] = {};
      for (let j = 0; j < n; j++) {
        const v = stationList[j];
        costMap[u][v] = dist[i][j];
      }
    }

    return costMap;
  }

  getTravelCost(fromStation, toStation) {
    return this.travelCosts[fromStation]?.[toStation] ?? Infinity;
  }

  findOptimalSchedule(tasks, startStation) {
    // Sort tasks by end time for efficient DP
    const sortedTasks = [...tasks].sort((a, b) => a.end - b.end);
    const n = sortedTasks.length;

    // Precompute all travel costs between task stations
    const taskTravelCosts = Array(n)
      .fill()
      .map(() => Array(n).fill(Infinity));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        taskTravelCosts[i][j] = this.getTravelCost(
          sortedTasks[i].station,
          sortedTasks[j].station
        );
      }
    }

    // Precompute start station to task costs
    const startToTaskCosts = sortedTasks.map((task) =>
      this.getTravelCost(startStation, task.station)
    );

    // Precompute task to start station costs
    const taskToStartCosts = sortedTasks.map((task) =>
      this.getTravelCost(task.station, startStation)
    );

    // DP state: dp[i] = { score, fee, prevIndex } for best schedule ending at task i
    const dp = Array(n)
      .fill()
      .map(() => ({
        score: -Infinity,
        fee: Infinity,
        prevIndex: -1,
      }));

    let bestScore = -Infinity;
    let bestFee = Infinity;
    let bestEndIndex = -1;

    // Initialize DP with single-task schedules
    for (let i = 0; i < n; i++) {
      if (startToTaskCosts[i] < Infinity) {
        dp[i] = {
          score: sortedTasks[i].score,
          fee: startToTaskCosts[i],
          prevIndex: -1,
        };

        const totalFee = dp[i].fee + taskToStartCosts[i];
        if (
          dp[i].score > bestScore ||
          (dp[i].score === bestScore && totalFee < bestFee)
        ) {
          bestScore = dp[i].score;
          bestFee = totalFee;
          bestEndIndex = i;
        }
      }
    }

    // Fill DP table
    for (let i = 0; i < n; i++) {
      if (dp[i].score === -Infinity) continue;

      for (let j = i + 1; j < n; j++) {
        // Check if task j can be scheduled after task i (no time overlap)
        if (sortedTasks[i].end <= sortedTasks[j].start) {
          const travelCost = taskTravelCosts[i][j];
          if (travelCost < Infinity) {
            const newScore = dp[i].score + sortedTasks[j].score;
            const newFee = dp[i].fee + travelCost;

            if (
              newScore > dp[j].score ||
              (newScore === dp[j].score && newFee < dp[j].fee)
            ) {
              dp[j] = {
                score: newScore,
                fee: newFee,
                prevIndex: i,
              };

              const totalFee = newFee + taskToStartCosts[j];
              if (
                newScore > bestScore ||
                (newScore === bestScore && totalFee < bestFee)
              ) {
                bestScore = newScore;
                bestFee = totalFee;
                bestEndIndex = j;
              }
            }
          }
        }
      }
    }

    // Reconstruct optimal schedule
    const schedule = [];
    let currentIndex = bestEndIndex;

    while (currentIndex >= 0) {
      schedule.unshift(sortedTasks[currentIndex]);
      currentIndex = dp[currentIndex].prevIndex;
    }

    // Ensure at least one task (as per requirement)
    if (schedule.length === 0 && tasks.length > 0) {
      // Fallback: choose the task with best net score
      let bestNetScore = -Infinity;
      let bestTask = null;

      for (const task of tasks) {
        const travelCost =
          this.getTravelCost(startStation, task.station) +
          this.getTravelCost(task.station, startStation);
        const netScore = task.score - travelCost;

        if (netScore > bestNetScore) {
          bestNetScore = netScore;
          bestTask = task;
        }
      }

      if (bestTask) {
        schedule.push(bestTask);
        bestScore = bestTask.score;
        bestFee =
          this.getTravelCost(startStation, bestTask.station) +
          this.getTravelCost(bestTask.station, startStation);
      }
    }

    return {
      max_score: bestScore === -Infinity ? 0 : bestScore,
      min_fee: bestFee === Infinity ? 0 : bestFee,
      schedule: schedule.map((task) => task.name),
    };
  }
}

// Main processing function
function generateOptimalSchedule(input) {
  const { tasks, subway, starting_station } = input;
  console.log(input);

  if (!tasks || tasks.length === 0) {
    return {
      max_score: 0,
      min_fee: 0,
      schedule: [],
    };
  }

  const scheduler = new OptimizedTaskScheduler(subway);
  return scheduler.findOptimalSchedule(tasks, starting_station);
}

app.post("/princess-diaries", (req, res) => {
  const result = generateOptimalSchedule(req.body);
  res.json({ result });
});

module.exports = app;

//princess-diaries
