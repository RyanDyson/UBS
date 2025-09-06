const express = require("express");
const morganBody = require("morgan-body");
const PORT = process.env.PORT || 5000;

const app = express().use(express.json());
morganBody(app, { noColors: process.env.NODE_ENV === "production" });

app.use(express.json({ limit: "1000mb" }));

/**
 * @param {Array} customer
 * @param {Array} concerts
 * @returns {string}
 * push comment
 */
function findBestConcert(customer, concerts, priority) {
  function dist([x0, y0], [x1, y1]) {
    return Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);
  }

  function distToLatency(dist) {
    if (dist <= 1) return 30;
    if (dist <= 4) return 20;
    if (dist <= 9) return 10;
    return 0;
  }

  // Get the distances
  /** @type {[string, number][]} */
  const values = concerts.map(({ name, booking_center_location }) => {
    const pointsFromLatency = distToLatency(
      dist(customer.location, booking_center_location)
    );
    const pointsFromCC = priority[customer.credit_card] == name ? 50 : 0;
    return [name, pointsFromLatency + pointsFromCC];
  });

  const max = values.reduce((prev, cur) => (prev[1] > cur[1] ? prev : cur));
  return max[0];
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

app
  .post("/square", (req, res) => {
    const output = parseInt(req.body.input) ** 2;
    res.json(output);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

module.exports = app;
