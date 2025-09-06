const express = require("express");
const morganBody = require("morgan-body");
const PORT = process.env.PORT || 5000;

const app = express().use(express.json());
morganBody(app, { noColors: process.env.NODE_ENV === "production" });

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

app.post("/ticketing-agent", (req, res) => {
  const { customers, concerts, priority } = req.body;
  res.json(
    Object.fromEntries(
      customers.map((x) => [x.name, findBestConcert(x, concerts, priority)])
    )
  );
});

app
  .post("/square", (req, res) => {
    const output = parseInt(req.body.input) ** 2;
    res.json(output);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
