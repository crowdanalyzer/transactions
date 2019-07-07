'use strict';

module.exports = [
    {
        id: 't1',
        name: 'Create user',
        do: {
            func: user => 
                Promise.resolve(Object.assign(user, { _id: '873627854326' })),
            params: [
                {
                    email: 'john.doe@crowdanalyzer.com',
                    name: 'John Doe',
                },
            ],
        },
        undo: {
            func: userId => 
                Promise.resolve(`User with id (${userId}) was removed`),
            params: ['$t1._id'],
        },
    },
    {
        id: 't2',
        name: 'Charge user',
        do: {
            func: (userName, userId, amount) =>
                Promise.resolve(`User ${userName} with id (${userId}) was charged ${amount}$`),

            params: ['$t1.name', '$t1._id', 100],
        },
        undo: {
            func: (userName, userId, amount) =>
                Promise.resolve(`User ${userName} with id (${userId}) was refunded ${amount}$`),

            params: ['$t1.name', '$t1._id', 100],
        },
    },
    {
        id: 't3',
        name: 'Sent notification to user',
        do: {
            func: () =>
                Promise.resolve(`Email was sent to the user notifying him with the transaction`),
        },
    },
    {
        id: 't4',
        name: 'Save transaction',
        do: {
            func: chargingResponse => 
                Promise.resolve(`Saved transaction: ${chargingResponse}`),
            params: ['$t2'],
        },
    },
];
