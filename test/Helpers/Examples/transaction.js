'use strict';

module.exports = [
    {
        id: 't1',
        do: {
            function: () => {},
            params: [
                {
                    email: 'dev@crowdanalyzer.com',
                    name: 'Dev Account',
                },
            ],
        },
        undo: {
            function: () => {},
            params: ['$t1.customer_id'],
        },
    },
    {
        id: 't2',
        do: {
            function: () => {},
            params: ['$t1'],
        },
        undo: {
            function: () => {},
            params: ['$t1'],
        },
    },
    {
        id: 't3',
        do: {
            function: () => {},
            params: ['$t2._id'],
        },
    },
    {
        id: 't4',
        do: {
            function: () => {},
            params: [
                {
                    customer_id: '$t1.customer_id',
                },
            ],
        },
        undo: {
            function: () => {},
            params: ['$t4.subscription_id'],
        },
    },
];
