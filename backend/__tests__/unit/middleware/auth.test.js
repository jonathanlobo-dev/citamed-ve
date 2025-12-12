require("dotenv").config();
const jwt = require("jsonwebtoken");
const { authMiddleware, requireRole } = require("../../../src/middleware/auth");

// Mock del modelo User
jest.mock("../../../src/models/index", () => ({
  User: {
    findByPk: jest.fn()
  }
}));

const { User } = require("../../../src/models/index");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("authMiddleware (verifyToken)", () => {
    test("debe llamar next() con token JWT valido", async () => {
      const mockUser = { id: 1, email: "test@test.com", role: "patient" };
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1h" });

      req.headers.authorization = "Bearer " + token;
      User.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(req.user).toEqual({ id: 1, email: "test@test.com", role: "patient" });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("debe retornar 401 sin token", async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token no proporcionado. Acceso denegado."
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("debe retornar 401 con token invalido", async () => {
      req.headers.authorization = "Bearer token_invalido_123";

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Token inválido o expirado"
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("debe retornar 401 con token expirado", async () => {
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "-1h" });
      req.headers.authorization = "Bearer " + token;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Token inválido o expirado"
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("debe retornar 401 cuando usuario no existe en BD", async () => {
      const token = jwt.sign({ id: 999 }, process.env.JWT_SECRET, { expiresIn: "1h" });
      req.headers.authorization = "Bearer " + token;
      User.findByPk.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuario no encontrado"
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    test("debe llamar next() con rol correcto", () => {
      req.user = { id: 1, email: "test@test.com", role: "patient" };
      const middleware = requireRole(["patient"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("debe llamar next() con multiples roles validos", () => {
      req.user = { id: 1, email: "doctor@test.com", role: "doctor" };
      const middleware = requireRole(["patient", "doctor", "admin"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("debe retornar 403 con rol incorrecto", () => {
      req.user = { id: 1, email: "patient@test.com", role: "patient" };
      const middleware = requireRole(["doctor", "admin"]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "No tienes permisos para acceder a este recurso"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("debe retornar 401 sin usuario en request", () => {
      req.user = null;
      const middleware = requireRole(["patient"]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "No autenticado"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("debe validar rol provider correctamente", () => {
      req.user = { id: 1, email: "provider@test.com", role: "provider" };
      const middleware = requireRole(["provider"]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
