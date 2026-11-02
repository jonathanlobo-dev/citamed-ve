// Entorno fijo para las pruebas unitarias: nada de lo que haya en backend/.env debe influir.
process.env.NODE_ENV = 'test';
process.env.TWO_FACTOR_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
delete process.env.PLATFORM_SETTINGS_KEY;
delete process.env.RESEND_API_KEY;
delete process.env.SENDGRID_API_KEY;
delete process.env.VERIFICATION_DEV_MODE;
