//During the test the env variable is set to test

import chai from "chai";
import chaiHttp from "chai-http";
import { app } from '../app.js'
import request from './test_data/requests.json'
import { uuid } from 'uuidv4';
const should = chai.should()

chai.use(chaiHttp)
const _uuid = uuid()

const testTransfers = () => {
    it('Should successfully complete a bulk transfer', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': _uuid})
        .send(request.good_req)
        .end((req, res) => {
            res.should.have.status(200)
            res.body.should.be.a('object')
            res.body.should.have.property('account')
            res.body.should.have.property('message')
            res.body.should.have.property('account')
            res.body.account.should.be.a('object')
            res.body.message.should.be.eq('Transaction completed!')
            res.body.account.should.have.property('accountNumber')
            res.body.account.accountNumber.should.be.eq(request.good_req.payer_account)
            res.body.account.should.have.property('balance')
            res.body.account.balance.should.be.eq(8800)
            done()
        })
    })
}

const testNoIdempotencyKey = () => {
    it(`Should fail[500] with [\'idempotency-key: <required>\']`, done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .send(request.good_req)
        .end((req, res) => {
            res.should.have.status(400)
            res.body.should.be.a('object')
            res.body.should.have.property('error')
            res.body.should.have.property('errorMessage')
            res.body.errorMessage.should.be.a('string')
            res.body.errorMessage.should.be.eq('idempotency-key: <required>')
            done()
        })
    })
}

const testIdempotency = () => {
    it('Should fail[500] with result due to idempotency ', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': _uuid})
        .send(request.good_req)
        .end((req, res) => {
            res.should.have.status(500)
            res.body.should.be.a('object')
            res.body.should.have.property('transactions')
            res.body.should.have.property('idempotency_key')
            res.body.transactions.should.be.a('array')
            res.body.idempotency_key.should.be.a('string')
            res.body.idempotency_key.should.be.eq(_uuid)
            done()
        })
    })
}

const testNoPayerReq = () => {
    it('Should fail due [\'undefined must be number\']', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': uuid()})
        .send(request.no_payer_req)
        .end((req, res) => {
            console.log(res.body)
            res.should.have.status(400)
            res.body.should.be.a('object')
            res.body.should.have.property('error')
            res.body.error.should.be.a('boolean')
            res.body.error.should.be.eq(true)
            res.body.should.have.property('errorMessage')
            res.body.errorMessage.should.be.eq('undefined must be number')
            done()
        })
    })
}

const testUnknownPayer = () => {
    it('Should fail due [\'Unknown payer\']', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': uuid()})
        .send(request.unknown_payer_req)
        .end((req, res) => {
            res.should.have.status(400)
            res.body.should.be.a('object')
            res.body.should.have.property('error')
            res.body.error.should.be.a('boolean')
            res.body.error.should.be.eq(true)
            res.body.should.have.property('errorMessage')
            res.body.errorMessage.should.be.eq('Unknown payer')
            done()
        })
    })
}

const testInsufficientFunds = () => {
    it('Should fail due [\'Insufficient funds.\']', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': uuid()})
        .send(request.insufficient_funds_req)
        .end((req, res) => {
            res.should.have.status(400)
            res.body.should.be.a('object')
            res.body.should.have.property('error')
            res.body.error.should.be.a('boolean')
            res.body.error.should.be.eq(true)
            res.body.should.have.property('errorMessage')
            res.body.errorMessage.should.be.eq('Insufficient funds.')
            done()
        })
    })
}

const testUserNotFound = () => {
    it('Should fail due [\'Unknown user.\']', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': uuid()})
        .send(request.user_not_found_req)
        .end((req, res) => {
            res.should.have.status(400)
            res.body.should.be.a('object')
            res.body.should.have.property('errorMessage')
            res.body.errorMessage.should.contain('Unknown payee')
            res.body.should.have.property('error')
            res.body.error.should.be.a('boolean')
            res.body.error.should.be.eq(true)
            done()
        })
    })
}

const testBadLimitReq = () => {
    it('Should fail due [\'Transfer Limit\']', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .set({ 'idempotency-key': uuid()})
        .send(request.bad_limit_req)
        .end((req, res) => {
            res.should.have.status(400)
            res.body.should.be.a('object')
            res.body.should.have.property('errorMessage')
            res.body.errorMessage.should.be.eq('Transfers are limited to a maximum of 10 transfers at a time')
            res.body.should.have.property('error')
            res.body.error.should.be.a('boolean')
            res.body.error.should.be.eq(true)
            done()
        })
    })
}


describe('Node Service Tests', () => {
    before((done) => {
        // delay for app load
        setTimeout(() => { done() }, 1000)
    });
    
    testTransfers()
    testIdempotency()
    testNoIdempotencyKey()
    testUnknownPayer()
    testNoPayerReq()
    testInsufficientFunds()
    testUserNotFound()
    testBadLimitReq()
})


