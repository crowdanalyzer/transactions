'use strict';

const REFERENCE_PREFIX = '$';

const get = (obj, path) =>
    String.prototype.split
        .call(path, /[,[\].]+?/)
        .filter(Boolean)
        .reduce(
            (last, part) =>
                'object' === typeof last && last.hasOwnProperty(part) ? last[part] : undefined,
            obj
        );

const map = (params = [], data) =>
    params.map(param => {
        if('string' === typeof param && REFERENCE_PREFIX === param[0]) {
            const path = param.slice(1);
            return get(data, path) || param;
        }

        return param;
    });

module.exports = (logger = console) => {
    /**
     * @description execute tasks sequentially and if any of them failed
     * it will execute executed tasks compensations
     * @param {Array} transaction
     */
    const execute = async transaction => {
        const stepsResult = {};
        const compensations = [];
        for(const step of transaction) {
            try {
                // executing each step
                const params = map(step.do.params, stepsResult);
                stepsResult[step.id] = await step.do.func(...params);
                if('object' === typeof step.undo) {
                    compensations.unshift(step);
                }
            } catch(error) {
                // stop transaction and execute compensations if any step failed
                Object.assign(error, { step_id: step.id, action: 'do' });
                logger.error(error);
                await executeCompensations(compensations, stepsResult);
                break;
            }
        }

        return stepsResult;
    };

    const executeCompensations = async(compensations, stepsResult) => {
        for(const compensation of compensations) {
            try {
                const params = map(compensation.undo.params, stepsResult);
                const result = await compensation.undo.func(...params);
                stepsResult[`${compensation.id}_compensation`] = result;
            } catch(error) {
                Object.assign(error, { step_id: compensations.id, action: 'undo' });
                error.step_id = compensation.id;
                logger.error(error);
            }
        }
    };

    return execute;
};
