require("dotenv").config();
const { Specialty } = require("../../../src/models");

describe("Specialty Model", () => {
  test("debe tener especialidades pre-cargadas", async () => {
    const specialties = await Specialty.findAll();
    expect(specialties.length).toBeGreaterThan(0);
  });

  test("debe tener estructura correcta", async () => {
    const specialty = await Specialty.findByPk(1);
    expect(specialty).toBeDefined();
    expect(specialty.name).toBeDefined();
    expect(typeof specialty.name).toBe("string");
  });
});