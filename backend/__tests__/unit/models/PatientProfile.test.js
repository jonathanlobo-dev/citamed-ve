require("dotenv").config();
const { User, PatientProfile } = require("../../../src/models");

describe("PatientProfile Model", () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: "patient_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5) + "@test.com",
      password: "TestPass123!",
      firstName: "Test",
      lastName: "Patient",
      role: "patient"
    });
  });

  test("debe crear un perfil de paciente valido", async () => {
    const profile = await PatientProfile.create({
      userId: testUser.id,
      firstName: "Maria",
      lastName: "Test",
      dateOfBirth: new Date("1990-01-01"),
      gender: "female"
    });
    expect(profile.userId).toBe(testUser.id);
    expect(profile.gender).toBe("female");
  });

  test("debe tener relacion con User", async () => {
    const profile = await PatientProfile.create({
      userId: testUser.id,
      firstName: "Maria",
      lastName: "Test"
    });
    const profileWithUser = await PatientProfile.findByPk(profile.id, { include: [{ model: User, as: "user" }] });
    expect(profileWithUser.user).toBeDefined();
    expect(profileWithUser.user.id).toBe(testUser.id);
  });

  test("debe aceptar generos validos", async () => {
    const genders = ["male", "female", "other"];
    for (const gender of genders) {
      const user = await User.create({
        email: "patient_gender_" + gender + "_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5) + "@test.com",
        password: "TestPass123!",
        firstName: "Test",
        lastName: "Patient",
        role: "patient"
      });
      const profile = await PatientProfile.create({ userId: user.id, firstName: "Test", lastName: gender, gender });
      expect(profile.gender).toBe(gender);
    }
  });
});