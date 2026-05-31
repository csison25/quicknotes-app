const adminMiddleware = require("../middleware/adminMiddleware");

describe("adminMiddleware", () => {

  test("allows admin users", () => {
    const req = {
      user: {
        role: "admin"
      }
    };

    const res = {};

    const next = jest.fn();

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("blocks non-admin users", () => {
    const req = {
      user: {
        role: "user"
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

});