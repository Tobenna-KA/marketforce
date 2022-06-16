import {Wallets, sequelize, Transactions} from "../db.js";

/**
 * Pay a user a given amount
 * @param accountNumber
 * @param phoneNumber
 * @param amount
 * @param transaction
 * @returns {Promise<*>}
 */
const payUser = async ({ accountNumber, phoneNumber, amount }, transaction) => {
    // make a payment
    const result = await Wallets.increment(
            'balance',
            {
                by: amount,
                where: { accountNumber },
                lock: transaction.transaction.LOCK.UPDATE,
            },
            transaction
        )
    
    if (!result || result.length < 1 || result[0].length < 2 || result[0][1] !== 1) {
        throw new Error(`Unknown payee: ${accountNumber}`)
    }
    
    return result
}


/**
 * use this function to inform a user about a transaction
 * @param phoneNumber
 * @param message
 * @returns {Promise<void>}
 */
const notifyUser = async ({phoneNumber, message}) => {
    // send text to user
}

/**
 * TODO Notify a user by text
 * @param notificationList
 * @returns {Promise<Awaited<unknown>[]>}
 */
const notifyUsers = (notificationList) => Promise.all(notificationList.map(notifyUser))

/**
 * Function could be run by a cron job to set idempotency values to null
 * after every 24hrs in the DB to make sure they don't clash in the future
 */
const resetIdempotency = () => {}

/**
 * Generate a notification message with given parameters
 * @param accountNumber
 * @param amount
 * @returns {`Your account ${string} has been credited with KES ${string} at ${string}`}
 */
const notificationMessage = ({ accountNumber, amount }) =>
    `Your account ${accountNumber} has been credited with KES ${amount} at ${new Date().toISOString()}`

/**
 * Create a transaction
 * @param transaction { object }
 * @returns {Promise<transaction>}
 */
export async function createTransaction(transaction) {
    return Transactions.create(transaction)
}

/**
 * Update a transaction
 * @param transaction { object }
 * @param whereQuery { object }
 * @returns {Promise<transaction>}
 */
export async function updateTransaction(transaction, whereQuery) {
    return Transactions.update(transaction, whereQuery)
}

/**
 * Handle bulk transfer. L
 * @param payer { object }
 * @param transferList { array }
 * @param cb { function }
 * @returns {Promise<void>}
 */
export async function processTransfers(payer, transferList, cb) {
    try {
        // get current account state for user making payment
        if (payer) {
            // make a summation of amount to be paid
            const totalPayoutCost = transferList.reduce((prev, cur) => prev + cur.amount, 0)
            const notificationList = []
            
            // if total payment amount is less <= user bank balance
            if (payer.balance >= totalPayoutCost) {
                // start a managed transaction
                sequelize.transaction(async (t) => {
                    // update payer balance
                    await Wallets.increment(
                        'balance',
                        {
                            by: -totalPayoutCost,
                            where: { accountNumber: payer.accountNumber },
                            lock: t.LOCK.UPDATE, // lock any updates to this user until transaction is committed
                        }, t
                    )
                    payer.balance -= totalPayoutCost
                    
                    // make all payments
                    for (const transfer of transferList) {
                        await payUser(transfer, { transaction: t })
                        // get data to use in notifying user
                        notificationList.push({
                            phoneNumber: transfer.phoneNumber,
                            message: notificationMessage(transfer)
                        })
                    }
                }).then(async () => {
                    // process notification after transaction has been committed to prevent Locking for too long
                    await notifyUsers(notificationList)
                    cb(payer, null)
                }).
                catch(e => cb(
                    null,
                    {
                        error: true,
                        errorMessage: e?.message ? e.message : 'Error processing transactions'
                    }
                ))
            } else {
                cb(null, { error: true, errorMessage: 'Insufficient funds.' })
            }
        } else {
            cb(null, { error: true, errorMessage: 'Unknown payer'})
        }
    } catch (e) {
        cb(
            null,
            {
                error: true,
                errorMessage: e?.message ? e.message : 'Error processing transactions'
            }
        )
    }
}

export default {}
