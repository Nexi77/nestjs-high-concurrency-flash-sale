import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 500 },
    { duration: '15s', target: 500 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    'checks{check:status_ok}': ['rate > 0.99'],
    http_req_duration: ['p(95)<300'],
  },
};

export default function () {
  const url = 'http://localhost:3000/tickets/buy';

  const payload = JSON.stringify({
    ticketId: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
    customerEmail: `user_${__VU}_${__ITER}@example.com`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    status_ok: (r) => r.status === 201 || r.status === 400,
  });

  sleep(0.1);
}
