'use strict';

const sinon = require('sinon');
const expect = require('./Helpers/expect');
const executer = require('../index');
const transactionSample = require('./Helpers/Examples/transaction');
const _ = require('lodash');

describe('executer', () => {
    describe('execute', () => {
        let transaction;
        let execute;
        let logger;

        beforeEach(() => {
            transaction = _.cloneDeep(transactionSample);
            logger = {
                error: sinon.fake(),
            };
            execute = executer(logger);
        });

        it('should accept logger, execute transaction, and return tasks result', async() => {
            const actionSpy1 = sinon.spy(transaction[0].do, 'func');
            const actionSpy2 = sinon.spy(transaction[1].do, 'func');
            const actionSpy3 = sinon.spy(transaction[2].do, 'func');
            const actionSpy4 = sinon.spy(transaction[3].do, 'func');
            const compensationSpy1 = sinon.spy(transaction[0].undo, 'func');
            const compensationSpy2 = sinon.spy(transaction[1].undo, 'func');
            const result = await execute(transaction);

            expect(result).to.deep.equal({
                t1: {
                    _id: '873627854326',
                    email: 'john.doe@crowdanalyzer.com',
                    name: 'John Doe',
                },
                t2: 'User John Doe with id (873627854326) was charged 100$',
                t3: 'Email was sent to the user notifying him with the transaction',
                t4: 'Saved transaction: User John Doe with id (873627854326) was charged 100$',
            });
            expect(logger.error).to.have.callCount(0);
            expect(actionSpy1).to.have.been.calledOnceWithExactly(
                sinon.match({
                    email: 'john.doe@crowdanalyzer.com',
                    name: 'John Doe',
                })
            );
            expect(actionSpy2).to.have.been.calledOnceWithExactly('John Doe', '873627854326', 100);
            expect(actionSpy3).to.have.been.calledOnceWithExactly();
            expect(actionSpy4).to.have.been.calledOnceWithExactly(
                'User John Doe with id (873627854326) was charged 100$'
            );
            expect(compensationSpy1).to.have.callCount(0);
            expect(compensationSpy2).to.have.callCount(0);
            expect(actionSpy1).to.have.been.calledBefore(actionSpy2);
            expect(actionSpy2).to.have.been.calledBefore(actionSpy3);
            expect(actionSpy3).to.have.been.calledBefore(actionSpy4);
        });

        it(
            'should stop executing tasks when error happen, log it, and ' +
                ' start executing previous tasks compensations',
            async() => {
                const error = new Error('step failed');
                transaction[2].do.func = () => Promise.reject(error);
                const actionSpy1 = sinon.spy(transaction[0].do, 'func');
                const actionSpy2 = sinon.spy(transaction[1].do, 'func');
                const actionSpy3 = sinon.spy(transaction[2].do, 'func');
                const actionSpy4 = sinon.spy(transaction[3].do, 'func');
                const compensationSpy1 = sinon.spy(transaction[0].undo, 'func');
                const compensationSpy2 = sinon.spy(transaction[1].undo, 'func');
                const result = await execute(transaction);

                expect(result).to.deep.equal({
                    t1: {
                        _id: '873627854326',
                        email: 'john.doe@crowdanalyzer.com',
                        name: 'John Doe',
                    },
                    t2: 'User John Doe with id (873627854326) was charged 100$',
                    t1_compensation: 'User with id (873627854326) was removed',
                    t2_compensation: 'User John Doe with id (873627854326) was refunded 100$',
                });
                expect(logger.error).to.have.been.calledOnceWithExactly(error);
                expect(error.step_id).to.be.equal('t3');
                expect(error.action).to.be.equal('do');
                expect(
                    actionSpy1.calledOnceWithExactly(
                        sinon.match({
                            email: 'john.doe@crowdanalyzer.com',
                            name: 'John Doe',
                        })
                    )
                );
                expect(actionSpy2).to.have.been.calledOnceWithExactly(
                    'John Doe',
                    '873627854326',
                    100
                );
                expect(actionSpy3).to.have.been.calledOnceWithExactly();
                expect(actionSpy4).to.have.callCount(0);
                expect(compensationSpy2).to.have.been.calledOnceWithExactly(
                    'John Doe',
                    '873627854326',
                    100
                );
                expect(compensationSpy1.calledOnceWithExactly('873627854326'));
                expect(actionSpy1).to.have.been.calledBefore(actionSpy2);
                expect(actionSpy2).to.have.been.calledBefore(actionSpy3);
                expect(actionSpy3).to.have.been.calledBefore(compensationSpy2);
                expect(compensationSpy2).to.have.been.calledBefore(compensationSpy1);
            }
        );

        it(
            'should log any error occur while executing compensation ' +
                'along with compensation step id and action',
            async() => {
                const stepError = new Error('step failed');
                const compensationError = new Error('compensation failed');
                transaction[2].do.func = () => Promise.reject(stepError);
                transaction[1].undo.func = () => Promise.reject(compensationError);
                const actionSpy1 = sinon.spy(transaction[0].do, 'func');
                const actionSpy2 = sinon.spy(transaction[1].do, 'func');
                const actionSpy3 = sinon.spy(transaction[2].do, 'func');
                const actionSpy4 = sinon.spy(transaction[3].do, 'func');
                const compensationSpy1 = sinon.spy(transaction[0].undo, 'func');
                const compensationSpy2 = sinon.spy(transaction[1].undo, 'func');
                const result = await execute(transaction);

                expect(result).to.deep.equal({
                    t1: {
                        _id: '873627854326',
                        email: 'john.doe@crowdanalyzer.com',
                        name: 'John Doe',
                    },
                    t2: 'User John Doe with id (873627854326) was charged 100$',
                    t1_compensation: 'User with id (873627854326) was removed',
                });
                expect(logger.error).to.have.callCount(2);
                expect(logger.error).to.have.been.calledWithExactly(stepError);
                expect(logger.error).to.have.been.calledWithExactly(compensationError);
                expect(stepError.step_id).to.be.equal('t3');
                expect(stepError.action).to.be.equal('do');
                expect(
                    actionSpy1.calledOnceWithExactly(
                        sinon.match({
                            email: 'john.doe@crowdanalyzer.com',
                            name: 'John Doe',
                        })
                    )
                );
                expect(actionSpy2).to.have.been.calledOnceWithExactly(
                    'John Doe',
                    '873627854326',
                    100
                );
                expect(actionSpy3).to.have.been.calledOnceWithExactly();
                expect(actionSpy4).to.have.callCount(0);
                expect(compensationSpy2).to.have.been.calledOnceWithExactly(
                    'John Doe',
                    '873627854326',
                    100
                );
                expect(compensationSpy1.calledOnceWithExactly('873627854326'));
                expect(actionSpy1).to.have.been.calledBefore(actionSpy2);
                expect(actionSpy2).to.have.been.calledBefore(actionSpy3);
                expect(actionSpy3).to.have.been.calledBefore(compensationSpy2);
                expect(compensationSpy2).to.have.been.calledBefore(compensationSpy1);
            }
        );

        it('should default `logger` to `console`', async() => {
            const execute = executer();
            const error = new Error('step failed');
            transaction[2].do.func = () => Promise.reject(error);
            sinon.stub(console, 'error');
            await execute(transaction);

            expect(console.error).to.have.been.calledOnceWithExactly(error);
        });

        it('should not resolve params path if it is not valid path`', async() => {
            transaction[1].do.params = ['$t1.invalid_path', '$t1._id', 200];
            const actionSpy = sinon.spy(transaction[1].do, 'func');
            await execute(transaction);
            expect(actionSpy).to.have.been.calledOnceWithExactly(
                '$t1.invalid_path',
                '873627854326',
                200
            );
        });
    });
});
