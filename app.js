import express from 'express'
import {processTransfers, createTransaction, updateTransaction} from './lib/transactions.js'
import { init, Wallets, Transactions } from './db.js'
import { addSchemas, validateJson, extractSchemaError} from "./lib/schema.js";

export const app = express()
const port = 3311
const LIMIT = 10

// middle ware to allow express to handle request body
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// initialize schemas
addSchemas()
// initialize mock db
init()


/**
 * middle layer for making sure idempotency is observed over post requests
 * @param req
 * @param res
 * @param next
 */
const idempotencyMiddleWare = async (req, res, next) => {
    try {
        const idempotencyKey = req.headers['idempotency-key']
        
        if (!idempotencyKey) {
            return res.status(400)
            .send({ error: true, errorMessage: 'idempotency-key: <required>'})
        }
    
        const transaction = await Transactions.findOne({
            where: {
                idempotency_key: idempotencyKey,
                payer_account: req.body.payer_account
            }
        })
        
        if (transaction) {
            // return transaction to client with an HTTP Error
            return res.status(500).send(transaction)
        }
        
        next()
    } catch (e) {
        res.status(500).send({ error: true, errorMessage: e?.message ? e.message : 'Server Error'})
    }
}


/**
 * POST request endpoint for processing transfers
 */
app.post('/api/v1/transfers', idempotencyMiddleWare, async (req, res) => {
    let status = 200
    const transactions = req.body.transactions || [] // extract a list of transfers
    
    try {
        const accountNumber = req.body.payer_account// extract a list of transfers
        const validReq = validateJson('transactionReq', req.body)
        
        if (!validReq.result) {
            res.status(status = 400)
                .send({
                    error: true,
                    errorMessage: extractSchemaError(validReq)
                })
        } else {
            // create transaction since it wasn't found previously at idempotencyMiddleWare
            await createTransaction({
                idempotency_key: req.headers['idempotency-key'],
                payer_account: req.body.payer_account,
                transactions: req.body.transactions
            })
    
            // get payer
            const payer = (await Wallets.findOne({where: {accountNumber}}))?.dataValues
    
            if (transactions.length < LIMIT) {
                await processTransfers(payer, transactions, async (account, error) => {
                    if (error) {
                        res.status(status = 400).send({
                            error: true,
                            errorMessage: error.errorMessage || 'Failed to complete transaction completed!'
                        })
                    } else {
                        res.status(200).send({error: false, message: 'Transaction completed!', account})
                    }
                })
            } else {
                res.status(status = 400).send({
                    error: true,
                    errorMessage: 'Transfers are limited to a maximum of 10 transfers at a time'
                })
            }
        }
    
        // update transaction lock status
        await updateTransaction(
            {
                lock_status: 'RELEASED',
                transactions,
                responseStatus: status
            },
            {
                where: {
                    idempotency_key: req.headers['idempotency-key'],
                    payer_account: req.body.payer_account,
                }
            },
        )
    } catch (e) {
        console.log(e)
        res.status(status = 500).send({
            error: true,
            errorMessage: 'Server Error',
            serverError: process.env.NODE_ENV === 'development' ? e.message : ''
        })
    }
    
    
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})