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

module.exports = {
  findBestConcert,
};
