import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


const BASE_URL = "http://localhost:3000"

export const options = {
    stages: [
        // Smoke tests (Tests to ensure basic functionality)
        { duration: '3s', target: 3 }, // Only 3 users for the first 3 seconds.
        
        // Load tests (Normal day traffic)
        { duration: '1m', target: 1000 }, // simulate ramp-up of traffic from 3 to 1000 users over the next 1 minute.
        { duration: '2m', target: 1000 }, // stay at 100 users for 10 minutes
        { duration: '3m', target: 0 }, // ramp-down to 0 users

        // TODO: Stress tests (Finding the breaking point)
        // Assesses the availability and stability of the system under extremely heavy load.

        // TODO: Spike testing
    ],
    thresholds: {
        'http_req_duration': ['p(99)<1000'], // 99% of requests must complete below 1s
        'url was shortened': ['p(99)<1000']  // 99% of requests must complete below 1s
    },
};

export function handleSummary(data) {
    return {
        "/home/k6/summary.json": JSON.stringify(data),
        "/home/k6/summary.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

export default function () {
    const shortUrlEndpoint = `${BASE_URL}/api/create`
    const payload = { originalUrl: "https://google.com" }
    const headers = { 'Content-Type': 'application/json' }

    const res = http.post(shortUrlEndpoint, JSON.stringify(payload), { headers });

    check(res, {
        'status was 200': (r) => r.status == 200,
        'url was shortened': (r) => r.body == JSON.stringify({ "shortUrl": "localhost:3000/99999e" }),
    });

    sleep(1);
}
