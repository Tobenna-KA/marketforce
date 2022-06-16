//During the test the env variable is set to test

import chai from "chai";
import chaiHttp from "chai-http";
import { app } from '../app.js'
import request from './test_data/requests.json'
const should = chai.should()

chai.use(chaiHttp)

const testTransfers = () => {
    it('Should successfully complete a bulk transfer', done => {
        chai.request(app)
        .post('/api/v1/transfers')
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

const testNoPayerReq = () => {
    it('Should fail due [\'undefined must be number\']', done => {
        chai.request(app)
        .post('/api/v1/transfers')
        .send(request.no_payer_req)
        .end((req, res) => {
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
        setTimeout(() => { done() }, 3000)
    });
    
    testTransfers()
    testUnknownPayer()
    testNoPayerReq()
    testInsufficientFunds()
    testUserNotFound()
    testBadLimitReq()
})


