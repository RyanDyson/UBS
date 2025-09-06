const express = require("express");
const morganBody = require("morgan-body");
const path = require("path");
const PORT = process.env.PORT || 5000;

const { robustImputation } = require("./blankety-blank.js");
const { toAdjMatrix } = require("./mts.js");
const { findBestConcert } = require("./training-agent.js");
const { generateOptimalSchedule } = require("./princess.js");
const { findExtraChannels } = require("./bureau.js");

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
    answers: [4, 1, 2, 2, 3, 4, 4, 5, 4],
  });
});

app.post("/mst-calcuation", async (req, res) => {
  try {
    const { image: image1 } = req.body[0];
    const { image: image2 } = req.body[1];

    const matrix1 = await toAdjMatrix(image1);
    const matrix2 = await toAdjMatrix(image2);

    res.json({
      matrix1,
      matrix2,
    });
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

//princess-diaries
app.post("/princess-diaries", (req, res) => {
  const result = generateOptimalSchedule(req.body);
  res.json(result);
});

module.exports = app;
