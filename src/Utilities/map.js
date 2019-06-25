'use strict';

const _ = require('lodash');

const map = (params, data, variablePrefix) =>
    params.map(param => {
        if(_.isString(param) && _.startsWith(param, variablePrefix)) {
            const path = param.slice(1);
            return _.get(data, path);
        }
    });

module.exports = map;
