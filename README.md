<h1 align="center">Transactions</h1>

<p align="center">
  Transactions processing library
</p>

<p align="center">
  <a href="https://circleci.com/gh/crowdanalyzer/transactions/tree/master">
    <img alt="CircleCI" src="https://circleci.com/gh/crowdanalyzer/transactions/tree/master.svg?style=shield&circle-token=79d3b9ba3c54691eb05b833d9cc63e151bd77cc8">
  </a>
</p>

# Installation
```
npm i @crowdanalyzer/transactions
```

# Usage Example

```js
const executor = require('@crowdanalyzer/transactions');
const execute = executor();

const result = await execute([
  {
        id: 'task__create_user',
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
            params: ['$task__create_user._id'],
        },
    },
    {
        id: 'task__charge_user',
        name: 'Charge user',
        do: {
            func: (userName, userId, amount) =>
                Promise.resolve(`User ${userName} with id (${userId}) was charged ${amount}$`),

            params: ['$task__create_user.name', '$task__create_user._id', 100],
        },
        undo: {
            func: (userName, userId, amount) =>
                Promise.resolve(`User ${userName} with id (${userId}) was refunded ${amount}$`),

            params: ['$task__create_user.name', '$task__create_user._id', 100],
        },
    },
    {
        id: 'task__notification_sent',
        name: 'Sent notification to user',
        do: {
            func: () =>
                Promise.resolve(`Email was sent to the user notifying him with the transaction`),
        },
    },
    {
        id: 'task__transaction_save',
        name: 'Save transaction',
        do: {
            func: chargingResponse =>
                Promise.resolve(`Saved transaction: ${chargingResponse}`),
            params: ['$task__charge_user'],
        },
    }
]);

/**
 * {
 *    task__create_user: {
 *        email: 'john.doe@crowdanalyzer.com',
 *        name: 'John Doe',
 *        _id: '873627854326',
 *    },
 *    task__charge_user: 'User John Doe with id (873627854326) was charged 100$',
 *    task__notification_sent:
 *    'Email was sent to the user notifying him with the transaction',
 *    task__transaction_save:
 *    'Saved transaction: User John Doe with id (873627854326) was charged 100$',
 *  }
 */

```