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

# API

### `executer([logger=console])`
  Create an executer instance
  - `logger` an optional logger instance, defaults to `console`

### `executer().execute(transactions)`
  Executes tasks sequentially and if any of them failed it will execute executed tasks compensations

  - `transactions` an array of `transaction` objects, any object have the following schema
    ```js
    {
        // transaction unique id
        id: 'task__create_user',
        // transaction name
        name: 'Create user',
        do: {
            // the transaction function to execute, will accept params passed in `do.params` below
            func: user => Promise.resolve(Object.assign(user, { _id: '873627854326' })),

            // an array of params passed to `do.func`
            params: [
                {
                    email: 'john.doe@crowdanalyzer.com',
                    name: 'John Doe',
                },
            ],
        },
        undo: {
            // transaction to execute as a compensation in case of transaction failure
            func: userId => Promise.resolve(`User with id (${userId}) was removed`),

            // an array of params passed to `undo.func`, notice the reference to a previous transaction with its id
            // using `$` identifier, this access the evaluated value of this transaction
            params: ['$task__create_user._id'],
        },
    }
    ```


# Examples

## Transaction Execution Results
```js
const executer = require('@crowdanalyzer/transactions');
const execute = executer();

const run = async() => {
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
        },
    ]);

    return result;
};

run().then(console.log);

/** Output:
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

## Transaction Failure
```js
const executer = require('@crowdanalyzer/transactions');
const execute = executer();

const run = async() => {
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
                func: (userName, userId, amount) => {
                    const error = new Error('Something went wrong !');
                    error.meta = { userName, userId, amount };
                    return Promise.reject(error);
                },

                params: ['$task__create_user.name', '$task__create_user._id', 100],
            },
            undo: {
                func: (userName, userId, amount) =>
                    Promise.resolve(`User ${userName} with id (${userId}) was refunded ${amount}$`),

                params: ['$task__create_user.name', '$task__create_user._id', 100],
            },
        },
    ]);

    return result;
};

run().then(console.log);

/** Output:
 * {
 *   Error: Something went wrong !
 *   <stack>
 * meta: {
 *    userName: 'John Doe', userId: '873627854326', amount: 100 },
 *    step_id: 'task__charge_user',
 *    action: 'do'
 *  }
 *
 * {
 *     task__create_user: {
 *         email: 'john.doe@crowdanalyzer.com',
 *         name: 'John Doe',
 *         _id: '873627854326',
 *     },
 *     task__create_user_compensation: 'User with id (873627854326) was removed'
 * }
*/
```