import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
};

const BASE_URL = 'http://EC2-IP-ADDRESS-HERE';

//Need to grab a new Token each time to run this test
const TOKEN = 'REAL-JWT-TOKEN-HERE';

export default function () {
  const params = {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  const res = http.get(`${BASE_URL}/api/notes`, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has notes': (r) => r.body.length > 0,
  });

  sleep(1);
}