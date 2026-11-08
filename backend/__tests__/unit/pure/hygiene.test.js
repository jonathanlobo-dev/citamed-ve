// Cosas pequeñas que ya nos dieron un susto: que no vuelvan.

const { Sequelize } = require('sequelize');

describe('Redis opcional', () => {
  test('sin REDIS_HOST no se intenta conectar (antes llenaba el log de reintentos)', () => {
    const saved = { host: process.env.REDIS_HOST, url: process.env.REDIS_URL };
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_URL;
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.resetModules();
    const redis = require('../../../src/config/redis');
    expect(redis.redisClient).toBeNull();
    expect(redis.isRedisConnected()).toBe(false);
    log.mockRestore();
    if (saved.host !== undefined) process.env.REDIS_HOST = saved.host;
    if (saved.url !== undefined) process.env.REDIS_URL = saved.url;
  });

  test('sin Redis, ping responde falso sin lanzar error', async () => {
    jest.resetModules();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { ping } = require('../../../src/config/redis');
    await expect(ping()).resolves.toBe(false);
    log.mockRestore();
  });
});

describe('invitación de la asistente', () => {
  const sequelize = new Sequelize('postgres://u:p@localhost:5432/x', { logging: false });
  const DoctorAssistant = require('../../../src/models/DoctorAssistant')(sequelize);

  test('el hash del enlace de invitación nunca sale en una respuesta', () => {
    const link = DoctorAssistant.build({ doctorId: 1, assistantId: 2, status: 'pending', inviteTokenHash: 'abc123secreto' });
    expect(link.inviteTokenHash).toBe('abc123secreto'); // internamente sí existe
    expect(link.toJSON()).not.toHaveProperty('inviteTokenHash');
    expect(JSON.stringify({ data: [link] })).not.toContain('abc123secreto');
  });

  test('el resto de los datos sí salen', () => {
    const link = DoctorAssistant.build({ doctorId: 1, assistantId: 2, status: 'active', canAgenda: true });
    expect(link.toJSON()).toMatchObject({ doctorId: 1, assistantId: 2, status: 'active', canAgenda: true });
  });
});
