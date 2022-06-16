import { Sequelize } from 'sequelize';
import { AccountSchema } from './schemas/account.js';

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
})

export const Accounts = sequelize.define(
    'Accounts',
    AccountSchema
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

const mockDb = async () => {
    // define schemas
    await Accounts.drop() // empty db
    await sequelize.sync({ force: true })
    await Accounts.bulkCreate(accounts) // write dummy data
}

export function init () { mockDb().then() }
