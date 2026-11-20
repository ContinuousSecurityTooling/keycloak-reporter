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

  test('uses a winston ecs logger when json logging is enabled', async () => {
    const mockLoggerInstance = { info: jest.fn() };
    const mockCreateLogger = jest.fn().mockReturnValue(mockLoggerInstance);
    const mockConsoleTransport = jest.fn();
    const mockEcsFormat = jest.fn().mockReturnValue('ecs-format');

    jest.doMock('../src/config.js', () => ({ jsonLogFormat: true }));
    jest.doMock('winston', () => ({
      createLogger: mockCreateLogger,
      transports: { Console: mockConsoleTransport },
    }));
    jest.doMock('@elastic/ecs-winston-format', () => ({ ecsFormat: mockEcsFormat }));

    const { default: logger } = await import('../lib/logger.js');

    expect(logger).toBe(mockLoggerInstance);
    expect(mockEcsFormat).toHaveBeenCalledTimes(1);
    expect(mockConsoleTransport).toHaveBeenCalledTimes(1);
    expect(mockCreateLogger).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'ecs-format' })
    );
  });
});
