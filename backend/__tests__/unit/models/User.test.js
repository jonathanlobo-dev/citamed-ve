require("dotenv").config();
const { User } = require("../../../src/models");
const bcrypt = require("bcryptjs");

describe("User Model", () => {
  describe("Validaciones", () => {
    test("debe crear un usuario valido", async () => {
      const userData = {
        email: "test_" + Date.now() + "@test.com",
        password: "TestPass123!",
        firstName: "Test",
        lastName: "User",
        role: "patient"
      };
      const user = await User.create(userData);
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBeDefined();
    });

    test("debe rechazar email invalido", async () => {
      const userData = {
        email: "email-sin-arroba",
        password: "TestPass123!",
        firstName: "Test",
        lastName: "User",
        role: "patient"
      };
      await expect(User.create(userData)).rejects.toThrow();
    });

    test("debe rechazar email duplicado", async () => {
      const email = "duplicate_" + Date.now() + "@test.com";
      await User.create({ email, password: "TestPass123!", firstName: "User", lastName: "One", role: "patient" });
      await expect(User.create({ email, password: "TestPass123!", firstName: "User", lastName: "Two", role: "patient" })).rejects.toThrow();
    });

    test("debe hashear la contrasena antes de crear", async () => {
      const plainPassword = "TestPass123!";
      const user = await User.create({ email: "hash_" + Date.now() + "@test.com", password: plainPassword, firstName: "Test", lastName: "User", role: "patient" });
      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(50);
      const isValid = await bcrypt.compare(plainPassword, user.password);
      expect(isValid).toBe(true);
    });

    test("debe aceptar roles validos", async () => {
      const roles = ["patient", "doctor", "provider"];
      for (const role of roles) {
        const user = await User.create({ email: "role_" + role + "_" + Date.now() + "@test.com", password: "TestPass123!", firstName: "Test", lastName: role, role });
        expect(user.role).toBe(role);
      }
    });
  });
});