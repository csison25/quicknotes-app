const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

jest.mock("jsonwebtoken");

describe("authMiddleware", () => {

  test("returns 401 when token is missing", () => {
    const req = {
      headers: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 403 for invalid token", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const req = {
      headers: {
        authorization: "Bearer badtoken"
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("allows valid token", () => {
    jwt.verify.mockReturnValue({
      id: 1,
      role: "user"
    });

    const req = {
      headers: {
        authorization: "Bearer validtoken"
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

});