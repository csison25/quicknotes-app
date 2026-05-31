const request = require("supertest");

process.env.NODE_ENV = "test";

const app = require("../server");

describe("API Integration Tests", () => {

  test("GET /health returns ok", async () => {
    const res = await request(app)
      .get("/health");

    expect(res.statusCode).toBe(200);

    expect(res.body).toEqual({
      status: "ok"
    });
  });

  test("POST /api/test returns submitted data", async () => {
    const res = await request(app)
      .post("/api/test")
      .send({
        message: "hello"
      });

    expect(res.statusCode).toBe(200);

    expect(res.body).toEqual({
      received: "hello"
    });
  });

});