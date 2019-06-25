'use strict';

const _ = require('lodash');
const retry = require('@crowdanalyzer/retry');
const map = require('./Utilities/map');

module.export = (config, eventEmitter) => {
    const retryConfig = _.pick(config, ['max_retries', 'initial_delay', 'ceiling_timeout']);

    const execute = async transaction => {
        const stepsResult = {};
        const compensations = [];
        for(const step of transaction) {
            try {
                // try executing each step
                const params = map(step.params, stepsResult, config.reference_prefix);
                const retryDoing = retry(step.do.func, config.retry_strategy, retryConfig);
                const result = await retryDoing(...params);
                stepsResult[step.id] = result;
                compensations.unshift(step.undo);
            } catch(error) {
                // stop transaction and try executing compensations if any step failed
                eventEmitter.publish(error);
                await executeCompensations(compensations, stepsResult);
                break;
            }
        }

        return stepsResult;
    };

    const executeCompensations = async(compensations, stepsResult) => {
        for(const compensation of compensations) {
            try {
                const params = map(compensation.params, stepsResult, config.reference_prefix);
                const retryUndoing = retry(compensation.func, config.retry_strategy, retryConfig);
                await retryUndoing(...params);
            } catch(error) {
                eventEmitter.publish(error);
            }
        }
    };

    return execute;
};
