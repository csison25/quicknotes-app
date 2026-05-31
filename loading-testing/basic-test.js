import http from "k6/http";
import { sleep } from "k6";

export const options = {
  vus: 5,
  duration: "10s",
};

export default function () {
  http.get("http://EC2-IP-ADDRESS-HERE//");
  sleep(1);
}