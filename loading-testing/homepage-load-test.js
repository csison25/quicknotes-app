import http from "k6/http";
import { sleep } from "k6";

export const options = {
  vus: 50,
  duration: "30s",
};

export default function () {
  const res = http.get("http://EC2-IP-ADDRESS-HERE/");

  // Optional status check
  if (res.status !== 200) {
    console.error(`Request failed with status ${res.status}`);
  }

  sleep(1);
}