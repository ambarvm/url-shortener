import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = "http://localhost:3000"

export const options = {
    stages: [
        { duration: '10s', target: 50 },
    ],
};

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
