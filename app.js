const express = require('express');
const morganBody = require('morgan-body');
const PORT = process.env.PORT || 5000;

const app = express().use(express.json());
morganBody(app, { noColors: process.env.NODE_ENV === 'production' });

app
  .post("/square", (req, res) => {
    const output = parseInt(req.body.input) ** 2;
    res.json(output);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

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
        const dist = Array(n).fill().map(() => Array(n).fill(Infinity));
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
        const taskTravelCosts = Array(n).fill().map(() => Array(n).fill(Infinity));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                taskTravelCosts[i][j] = this.getTravelCost(
                    sortedTasks[i].station,
                    sortedTasks[j].station
                );
            }
        }
        
        // Precompute start station to task costs
        const startToTaskCosts = sortedTasks.map(task => 
            this.getTravelCost(startStation, task.station)
        );
        
        // Precompute task to start station costs
        const taskToStartCosts = sortedTasks.map(task => 
            this.getTravelCost(task.station, startStation)
        );
        
        // DP state: dp[i] = { score, fee, prevIndex } for best schedule ending at task i
        const dp = Array(n).fill().map(() => ({
            score: -Infinity,
            fee: Infinity,
            prevIndex: -1
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
                    prevIndex: -1
                };
                
                const totalFee = dp[i].fee + taskToStartCosts[i];
                if (dp[i].score > bestScore || 
                    (dp[i].score === bestScore && totalFee < bestFee)) {
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
                        
                        if (newScore > dp[j].score || 
                            (newScore === dp[j].score && newFee < dp[j].fee)) {
                            dp[j] = {
                                score: newScore,
                                fee: newFee,
                                prevIndex: i
                            };
                            
                            const totalFee = newFee + taskToStartCosts[j];
                            if (newScore > bestScore || 
                                (newScore === bestScore && totalFee < bestFee)) {
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
                const travelCost = this.getTravelCost(startStation, task.station) + 
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
                bestFee = this.getTravelCost(startStation, bestTask.station) + 
                         this.getTravelCost(bestTask.station, startStation);
            }
        }
        
        return {
            max_score: bestScore === -Infinity ? 0 : bestScore,
            min_fee: bestFee === Infinity ? 0 : bestFee,
            schedule: schedule.map(task => task.name)
        };
    }
}

// Main processing function
function generateOptimalSchedule(input) {
    const { tasks, subway, starting_station } = input;
    console.log(input)
    
    if (!tasks || tasks.length === 0) {
        return {
            max_score: 0,
            min_fee: 0,
            schedule: []
        };
    }
    
    const scheduler = new OptimizedTaskScheduler(subway);
    return scheduler.findOptimalSchedule(tasks, starting_station);
}

app.post("/princess-diaries", (req, res) => {
  const result = generateOptimalSchedule(req.body);
  res.json( {result} );
  })