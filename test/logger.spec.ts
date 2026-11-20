describe('logger', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config.js');
    jest.dontMock('winston');
    jest.dontMock('@elastic/ecs-winston-format');
  });

  test('uses console when json logging is disabled', async () => {
    jest.doMock('../src/config.js', () => ({ jsonLogFormat: false }));
    const { default: logger } = await import('../lib/logger.js');
    expect(logger).toBe(console);
  });

  // NB: AppConfig (lib/utils.ts) declares a `json` field but its constructor never
  // assigns it, so `appConfig.json` in logger.ts is always undefined and the
  // winston/ECS branch below is unreachable in practice. This test documents that
  // actual (likely unintended) behavior rather than the intended-looking one.
  test('still falls back to console even when jsonLogFormat is enabled, due to a bug in AppConfig', async () => {
    const mockCreateLogger = jest.fn();

    jest.doMock('../src/config.js', () => ({ jsonLogFormat: true }));
    jest.doMock('winston', () => ({
      createLogger: mockCreateLogger,
      transports: { Console: jest.fn() },
    }));
    jest.doMock('@elastic/ecs-winston-format', () => ({ ecsFormat: jest.fn() }));

    const { default: logger } = await import('../lib/logger.js');

    expect(logger).toBe(console);
    expect(mockCreateLogger).not.toHaveBeenCalled();
  });
});
