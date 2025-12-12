require("dotenv").config();
const { User, DoctorProfile, Specialty } = require("../../../src/models");

describe("DoctorProfile Model", () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: "doctor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5) + "@test.com",
      password: "TestPass123!",
      firstName: "Dr.",
      lastName: "Test",
      role: "doctor"
    });
  });

  test("debe crear un perfil de doctor valido", async () => {
    const profile = await DoctorProfile.create({
      userId: testUser.id,
      firstName: "Carlos",
      lastName: "Test",
      specialtyId: 1,
      licenseNumber: "TEST-" + Date.now(),
      consultationFee: 50,
      acceptingNewPatients: true
    });
    expect(profile.userId).toBe(testUser.id);
    expect(profile.specialtyId).toBe(1);
    expect(profile.licenseNumber).toContain("TEST");
  });

  test("debe tener relacion con User", async () => {
    const profile = await DoctorProfile.create({
      userId: testUser.id,
      firstName: "Carlos",
      lastName: "Test",
      specialtyId: 1,
      licenseNumber: "TEST-" + Date.now()
    });
    const profileWithUser = await DoctorProfile.findByPk(profile.id, { include: [{ model: User, as: "user" }] });
    expect(profileWithUser.user).toBeDefined();
    expect(profileWithUser.user.id).toBe(testUser.id);
  });

  test("debe tener relacion con Specialty", async () => {
    const profile = await DoctorProfile.create({
      userId: testUser.id,
      firstName: "Carlos",
      lastName: "Test",
      specialtyId: 1,
      licenseNumber: "TEST-" + Date.now()
    });
    const profileWithSpecialty = await DoctorProfile.findByPk(profile.id, { include: [{ model: Specialty, as: "specialty" }] });
    expect(profileWithSpecialty.specialty).toBeDefined();
    expect(profileWithSpecialty.specialty.id).toBe(1);
  });

  test("debe tener valores por defecto correctos", async () => {
    const profile = await DoctorProfile.create({
      userId: testUser.id,
      firstName: "Carlos",
      lastName: "Test",
      specialtyId: 1,
      licenseNumber: "TEST-" + Date.now()
    });
    expect(profile.isVerified).toBe(false);
    expect(profile.acceptingNewPatients).toBe(true);
    expect(profile.experienceYears).toBe(0);
  });
});