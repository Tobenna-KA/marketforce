# MarketForce Backend Interview
At Marketforce, our retailers do a lot of transfers using their Rejareja Wallet. As such we need an
endpoint that, given some customer data, will allow bulk transfer of money to other Wallet
accounts. The endpoint should limit sending to up to 10 accounts at a go.
## Given this requirement
1. Create a small NodeJs application that serves the endpoint called /transfers.
2. It should allow upto 10 transfers simultaneously from the same account.
## Data required.
- Account Number
- Amount
- Phone Number


``TIP``: Ensure the right API standards are applied and the code has the necessary tests for this
  work.


# GETTING STARTED
- `npm i` to install application dependencies
- `npm run start` to start application
- `npm run test` to test the application

To easily test concurrency with an application like Apache `ab`, run:
- `npm run load_test` to start server with `IGNORE_IDEMPOTENCY` = `true`
- followed by the command `ab -n 100 -c 10 -p data.json -T application/json -rk http://localhost:3311/api/v1/transfers`

<b>PS. for the purpose of this exercise I have committed `.env` files even though they should normally not be added to the repo

# API

```http
POST /api/v1/transfers
```

#### Request header
| Parameter         | Type      | Description                                                                                                                      |
|:------------------|:----------|:---------------------------------------------------------------------------------------------------------------------------------|
| `Idempotency-Key` | `string` | **Required**. Unique key e.g ``uuidv4`` with enough entropy to prevent collisions. Used to make sure the same request isn't repeated |


#### Request body
| Parameter      | Type            | Description                        |
|:---------------|:----------------|:-----------------------------------|
| `transactions` | `array<object>` | **Required**. list of transactions |
| `payer_account` | `number`        | **Required**. payer id             |


## Responses
A successful ``200`` response from this endpoint would return a response of structure like below

```javascript
{
  "account": object,
  "error": bool,
  "message": string
}
```
#### Example Response
```javascript
{
    "error": false,
    "message": "Transaction completed!",
    "account": {
        "id": 1,
        "accountNumber": 100000000001,
        "balance": 8800,
        "phoneNumber": "+254910121115",
        "createdAt": "2022-06-16T22:41:00.958Z",
        "updatedAt": "2022-06-16T22:41:00.958Z"
    }
}
```
another important possible response could be ```500``` error due to a non-unique ```Idempotency-Key```
such a request would return the contents and the status of the initial request with that token

```javascript
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
    "id": 2,
    "payer_account": 100000000001,
    "idempotency_key": "caahshenxzzwouweal8",
    "lock_status": "RELEASED",
    "responseStatus": 200,
    "createdAt": "2022-06-16T23:08:58.513Z",
    "updatedAt": "2022-06-16T23:08:58.535Z"
}
```
## Status Codes

This API returns the following status codes:

| Status Code | Description |
| :--- | :--- |
| 200 | `OK` |
| 400 | `BAD REQUEST` |
| 404 | `NOT FOUND` |
| 500 | `INTERNAL SERVER ERROR` |

