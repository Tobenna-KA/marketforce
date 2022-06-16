import { Sequelize } from 'sequelize';
import { WalletSchema } from './schemas/walletSchema.js';
import { TransactionsSchema } from "./schemas/transactionsSchema.js";

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
})

export const Wallets = sequelize.define(
    'Wallet',
    WalletSchema
)

export const Transactions = sequelize.define(
    'Transactions',
    TransactionsSchema
)

// dummy data
const accounts = [
    {
        accountNumber: 100000000001,
        balance: 9000.0,
        phoneNumber: '+254910121115'
    },
    {
        accountNumber: 100000000002,
        balance: 8000.0,
        phoneNumber: '+254910121114'
    },
    {
        accountNumber: 100000000003,
        balance: 11000.0,
        phoneNumber: '+254910121113'
    },
    {
        accountNumber: 100000000004,
        balance: 19000.0,
        phoneNumber: '+254910121112'
    },
    {
        accountNumber: 100000000005,
        balance: 12000.0,
        phoneNumber: '+254910121111'
    },
    {
        accountNumber: 100000000006,
        balance: 10000.0,
        phoneNumber: '+254910121110'
    },
]

const transactions = [
    {
        "transactions": [
            {
                "amount": 100,
                "accountNumber": 100000000003,
                "phoneNumber": "+254910121113"
            },
            {
                "amount": 100,
                "accountNumber": 100000000002,
                "phoneNumber": "+254910121114"
            }
        ],
        "payer_account": 100000000001,
        "idempotency_key": "akdk299112akdka"
    }
]

const mockDb = async () => {
    // define schemas
    await Wallets.drop() // empty db
    await Transactions.drop() // empty db
    await sequelize.sync({ force: true })
    await Wallets.bulkCreate(accounts) // write dummy data
    await Transactions.bulkCreate(transactions) // write dummy data
    console.log(((await Transactions.findOne({
        where: {
            idempotency_key: 'akdk299112akdka'
        }
    }))?.dataValues)?.transactions)
}

export function init () { mockDb().then() }
