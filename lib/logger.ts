import winston from 'winston';
import { ecsFormat } from '@elastic/ecs-winston-format';
import config from '../src/config.js';
import { getAppConfig } from './utils.js';

const appConfig = getAppConfig(config, process.argv);

const logger = appConfig.json
  ? winston.createLogger({
      format: ecsFormat(/* options */),
      transports: [new winston.transports.Console()],
    })
  : console;

export default logger;
