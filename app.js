import express from 'express'
import { processTransfers } from './lib/transactions.js'
import { init, Accounts } from './db.js'
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
 * POST request endpoint for processing transfers
 */
app.post('/api/v1/transfers', async (req, res) => {
    try {
        const transactions = req.body.transactions || [] // extract a list of transfers
        const accountNumber = req.body.payer_account// extract a list of transfers
        const validReq = validateJson('transactionReq', req.body)
        
        if (!validReq.result) {
            return res.status(400)
                .send({
                    error: true,
                    errorMessage: extractSchemaError(validReq)
                })
        }
        
        // get payer
        const payer = (await Accounts.findOne({ where: { accountNumber } }))?.dataValues
        
        if (transactions.length < LIMIT) {
            await processTransfers(payer, transactions, (account, error) => {
                if (error) {
                    return res.status(400).send({
                        error: true,
                        errorMessage: error.errorMessage || 'Failed to complete transaction completed!'
                    })
                }
                
                res.status(200).send({ error: false, message: 'Transaction completed!', account })
            })
        } else  {
            res.status(400).send({
                error: true,
                errorMessage: 'Transfers are limited to a maximum of 10 transfers at a time'
            })
        }
    } catch (e) {
        console.log(e)
        res.status(500).send({
            error: true,
            errorMessage: 'Server Error',
            serverError: process.env.NODE_ENV === 'development' ? e.message : ''
        })
    }
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})