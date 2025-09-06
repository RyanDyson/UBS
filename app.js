const express = require("express");
const morganBody = require("morgan-body");
const path = require("path");
const cors = require("cors");
const PORT = process.env.PORT || 5000;

const { robustImputation } = require("./blankety-blank.js");
const { toAdjMatrix, calcMST } = require("./mts.js");
const { findBestConcert } = require("./training-agent.js");
const { generateOptimalSchedule } = require("./princess.js");
const { findExtraChannels } = require("./bureau.js");
const { sortDuolingo } = require("./duolingo-sort.js");
const { tradingFormula } = require("./trading-formula.js");

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

app.post("/investigate", (req, res) => {
  try {
    const { networks } = req.body;

    if (!networks || !Array.isArray(networks)) {
      return res.status(400).json({ error: "Expected array of networks" });
    }

    const result = {
      networks: networks.map((networkData) => ({
        networkId: networkData.networkId,
        extraChannels: findExtraChannels(networkData.network),
      })),
    };

    res.json(result);
  } catch (error) {
    console.error("Investigation error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during investigation" });
  }
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
    answers: [4, 1, 2, 2, 3, 4, 4, 5, 4, 3, 3, 3, 4, 1, 2, 2, 1, 2, 2, 2, 1],
  });
});

app.post("/mst-calculation", async (req, res) => {
  try {
    const { image: image1 } = req.body[0];
    const { image: image2 } = req.body[1];

    const matrix1 = await toAdjMatrix(image1);
    const matrix2 = await toAdjMatrix(image2);

    const mst1 = calcMST(matrix1.matrix || matrix1);
    const mst2 = calcMST(matrix2.matrix || matrix2);

    res.json([{ value: mst1.totalWeight }, { value: mst2.totalWeight }]);
  } catch (error) {
    console.error("MST calculation error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during MST calculation" });
  }
});

//vercel testing
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// Shifts cell grid[row][col] up by one tile
function shift(row, col, grid, direction) {
  if (direction == "UP") {
    grid[row - 1][col] = grid[row][col];
  } else if (direction == "LEFT") {
    grid[row][col - 1] = grid[row][col];
  } else if (direction == "RIGHT") {
    grid[row][col + 1] = grid[row][col];
  } else {
    grid[row + 1][col] = grid[row][col];
  }
  grid[row][col] = null;
}

function LoopUp(grid) {
  // Loop from 2nd Row downwards
  for (let row = 1; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      // Move the col up
      let curRow = row;
      while (curRow != 0 && grid[curRow - 1][col] == null) {
        shift(curRow--, col, grid, "UP");
      }

      // If blocked by another tile above, shift and double
      if (curRow != 0 && grid[curRow - 1][col] == grid[curRow][col]) {
        shift(curRow--, col, grid, "UP");
        grid[curRow][col] *= 2;
      }
    }
  }
  return grid;
}
function LoopDown(grid) {
  // Loop from 3rd Row upwards
  for (let row = 2; row >= 0; row--) {
    for (let col = 0; col < 4; col++) {
      // Move the col down
      let curRow = row;
      while (curRow != 3 && grid[curRow + 1][col] == null) {
        shift(curRow++, col, grid, "DOWN");
      }

      // If blocked by another tile below, shift and double
      if (curRow != 3 && grid[curRow + 1][col] == grid[curRow][col]) {
        shift(curRow++, col, grid, "DOWN");
        grid[curRow][col] *= 2;
      }
    }
  }
  return grid;
}

function LoopRight(grid) {
  // Loop from 3rd column leftwards
  for (let col = 2; col >= 0; col--) {
    for (let row = 0; row < 4; row++) {
      // Move the row to the right
      let curCol = col;
      while (curCol != 3 && grid[row][curCol + 1] == null) {
        shift(row, curCol++, grid, "RIGHT");
      }

      // If blocked by another tile above, shift and double
      if (curCol != 3 && grid[row][curCol + 1] == grid[row][curCol]) {
        shift(row, curCol++, grid, "RIGHT");
        grid[row][curCol] *= 2;
      }
    }
  }
  return grid;
}

function LoopLeft(grid) {
  // Loop from 2nd column rightwards
  for (let col = 1; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      // Move the row to the left
      let curCol = col;
      while (curCol != 0 && grid[row][curCol - 1] == null) {
        shift(row, curCol--, grid, "LEFT");
      }

      // If blocked by another tile above, shift and double
      if (curCol != 0 && grid[row][curCol - 1] == grid[row][curCol]) {
        shift(row, curCol--, grid, "LEFT");
        grid[row][curCol] *= 2;
      }
    }
  }
  return grid;
}

function add2s(grid) {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] == null && Math.random() > 0.7) {
        grid[row][col] = 2;
      }
    }
  }
}

function isWin(grid) {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] == 2048) {
        return true;
      }
    }
  }

  return false;
}

function isSameGrid(grid1, grid2) {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid1[row][col] != grid2[row][col]) {
        return false;
      }
    }
  }
  return true;
}

function isLose(grid) {
  if (!isSameGrid(grid, LoopUp(structuredClone(grid)))) return false;
  if (!isSameGrid(grid, LoopDown(structuredClone(grid)))) return false;
  if (!isSameGrid(grid, LoopRight(structuredClone(grid)))) return false;
  if (!isSameGrid(grid, LoopLeft(structuredClone(grid)))) return false;
  return true;
}

app.post("/2048", (req, res) => {
  const { grid, mergeDirection } = req.body;
  let endGame = "";

  if (mergeDirection == "UP") LoopUp(grid);
  if (mergeDirection == "LEFT") LoopLeft(grid);
  if (mergeDirection == "RIGHT") LoopRight(grid);
  if (mergeDirection == "DOWN") LoopDown(grid);

  if (isWin(grid)) endGame = "win";
  else if (isLose(grid)) endGame = "lose";

  // randomly replace any null into 2
  // add2s(grid);

  res.json({
    nextGrid: grid,
    endGame,
  });
});
//princess-diaries
app.post("/princess-diaries", (req, res) => {
  const result = generateOptimalSchedule(req.body);
  res.json(result);
});

// duolingo-sort
app.post("/duolingo-sort", (req, res) => {
  try {
    const { part, challenge, challengeInput } = req.body;
    const { unsortedList } = challengeInput;

    if (!part || !unsortedList || !Array.isArray(unsortedList)) {
      return res.status(400).json({
        error: "Invalid input format",
      });
    }

    const sortedList = sortDuolingo(part, unsortedList);

    res.json({
      sortedList,
    });
  } catch (error) {
    console.error("Duolingo sort error:", error);
    res.status(500).json({
      error: "Internal server error during sorting",
    });
  }
});

app.post("/trading-formula", (req, res) => {
  try {
    const requests = req.body;

    if (!Array.isArray(requests)) {
      return res
        .status(400)
        .json({ error: "Expected array of formula requests" });
    }

    const results = requests.map((request) => {
      const { name, formula, variables, type } = request;
      return tradingFormula(name, formula, variables, type);
    });

    res.json(results);
  } catch (error) {
    console.error("Trading formula error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during formula evaluation" });
  }
});

app.post("/The-Ink-Archive", (req, res) => {
  const input = req.body; // array of challenges with { ratios, goods }

  const responses = input.map(({ ratios, goods }) => {
    const n = goods.length;

    // Build edges and a lookup map for direct rate access
    const edges = [];
    const rateMap = {};
    ratios.forEach(([u, v, rate]) => {
      edges.push({ u, v, rate });
      if (!rateMap[u]) rateMap[u] = {};
      rateMap[u][v] = rate;
    });

    // Convert to -log scale for Bellman-Ford
    const logEdges = edges.map((e) => ({
      u: e.u,
      v: e.v,
      w: -Math.log(e.rate),
    }));

    function findArbitrage() {
      for (let start = 0; start < n; start++) {
        let dist = new Array(n).fill(Infinity);
        let parent = new Array(n).fill(-1);
        dist[start] = 0;

        // Relaxation phase
        for (let k = 0; k < n - 1; k++) {
          for (const { u, v, w } of logEdges) {
            if (dist[u] + w < dist[v]) {
              dist[v] = dist[u] + w;
              parent[v] = u;
            }
          }
        }

        // Check for negative cycle
        for (const { u, v, w } of logEdges) {
          if (dist[u] + w < dist[v]) {
            // Found cycle: backtrack
            let x = v;
            for (let i = 0; i < n; i++) x = parent[x];

            const cycleNodes = [];
            const seen = new Set();
            let cur = x;
            while (!seen.has(cur)) {
              seen.add(cur);
              cur = parent[cur];
            }

            const cycle = [];
            const startNode = cur;
            cycle.push(startNode);
            cur = parent[startNode];
            while (cur !== startNode) {
              cycle.push(cur);
              cur = parent[cur];
            }
            cycle.reverse();
            cycle.push(startNode);

            // Calculate product using rateMap
            let product = 1;
            for (let i = 0; i < cycle.length - 1; i++) {
              const from = cycle[i],
                to = cycle[i + 1];
              const rate =
                rateMap[from] && rateMap[from][to] ? rateMap[from][to] : 0;
              product *= rate;
            }

            const gain = (product - 1) * 100;
            return { path: cycle.map((i) => goods[i]), gain };
          }
        }
      }
      return { path: [], gain: 0 };
    }

    return findArbitrage();
  });

  res.json(responses);
});

app.post("/the-mages-gambit", (req, res) => {
  try {
    const scenarios = req.body;

    const results = scenarios.map(({ intel, reserve, fronts, stamina }) => {
      let currentMana = reserve;
      let currentStamina = stamina;
      let totalTime = 0;
      let lastAttackedFront = null;
      let lastActionWasAttack = false;

      for (let i = 0; i < intel.length; i++) {
        const [front, manaCost] = intel[i];

        // Check if we need cooldown before this attack
        if (currentMana < manaCost || currentStamina === 0) {
          // Need cooldown
          totalTime += 10;
          currentMana = reserve;
          currentStamina = stamina;
          lastActionWasAttack = false;
        }

        // Perform the attack
        currentMana -= manaCost;
        currentStamina--;

        // Check if this is consecutive attack on same front
        if (lastActionWasAttack && lastAttackedFront === front) {
          // No extra time needed for consecutive attack on same front
        } else {
          // Need 10 minutes for new target or first attack
          totalTime += 10;
        }

        lastAttackedFront = front;
        lastActionWasAttack = true;
      }

      // Final cooldown to be ready for expedition
      totalTime += 10;

      return { time: totalTime };
    });

    res.json(results);
  } catch (error) {
    console.error("Mage's Gambit error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//host

module.exports = app;
