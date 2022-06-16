import { Accounts, sequelize } from "../db.js";

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
    const result = await Accounts.increment(
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

const notifyUsers = (notificationList) => Promise.all(notificationList.map(notifyUser))

const notificationMessage = ({ accountNumber, amount }) =>
    `Your account ${accountNumber} has been credited with KES ${amount} at ${new Date().toISOString()}`


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
                await sequelize.transaction(async (t) => {
                    // update payer balance
                    await Accounts.increment(
                        'balance',
                        {
                            by: -totalPayoutCost,
                            where: { accountNumber: payer.accountNumber },
                            lock: t.LOCK.UPDATE, // lock any updates to this user until transaction is committed
                        }, t
                    )
                    
                    // make all payments
                    for (const transfer of transferList) {
                        await payUser(transfer, { transaction: t })
                        // get data to use in notifying user
                        notificationList.push({
                            phoneNumber: transfer.phoneNumber,
                            message: notificationMessage(transfer)
                        })
                    }
                    await notifyUsers(notificationList)
                    payer.balance -= totalPayoutCost
                    cb(payer, null)
                });
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
