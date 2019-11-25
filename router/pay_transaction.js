require("dotenv").config();
const debug = require("debug")("line-pay:pay_transaction");
const kintone = require('@kintone/kintone-js-sdk');
const moment = require('moment');

const DOMAIN_NAME = process.env.KINTONE_DOMAIN_NAME;
const API_TOKEN = process.env.KINTONE_TRANSACTION_APP_API_TOKEN;
const APP_ID = process.env.KINTONE_TRANSACTION_APP_ID;

const PAY_STATE_ORDERED = 'ORDERED';
const PAY_STATE_PAYING = 'PAYING';
const PAY_STATE_PAID = 'PAID';

const CURRENCY_JPY = "JPY";

/*
    決済情報
    - order_id
    - user_id
    - title
    - amount
    - pay_state
    - transaction_id
    - ordered_date
    - paid_date
    - shipping_method
    - shipping_fee_amount
*/
module.exports =  class PayTransaction {
    constructor(orderId, userId) {
        this.orderId = orderId;
        this.userId = userId;
    }
    
    // kintone の認証
    static auth() {
        debug(`auth called!`);
        // kintone Authentication
        const kintoneAuth = new kintone.Auth();
        kintoneAuth.setApiToken({apiToken: API_TOKEN});
        debug(`kintoneAuth: ${kintoneAuth}`);
        const kintoneConnection = new kintone.Connection({domain: DOMAIN_NAME, auth: kintoneAuth});
        const kintoneRecord = new kintone.Record({connection: kintoneConnection});
        return kintoneRecord;
    }

    // kintone からPayTransaction に変換する
    static convertPayTransactionFromKintoneRecord(record) {
        debug(`convertPayTransactionFromKintoneRecord called! OrderId: ${JSON.stringify(record, null, 4)}`);
        const tran = new PayTransaction(record.order_id.value, record.user_id.value);
        tran.currency = record.currency.value;
        tran.title = record.title.value;
        tran.transactionId = record.transaction_id.value;
        tran.amount = parseInt(record.amount.value);
        tran.payState = record.pay_state.value;
        tran.shippingMethod = record.shipping_method.value;
        tran.orderedDate = moment(record.ordered_date.value);
        tran.paidDate = moment(record.paid_date.value);
        tran.shippingFeeAmount = parseInt(record.shipping_fee_amount.value);
        tran.kintoneRecordId = record.$id.value;
        debug(`Parsed transaction: ${JSON.stringify(tran, null, 4)}`);
        return tran;
    }

    // 決済情報をkintone から取得する
    static async getTransaction(orderId) {
        debug(`getTransaction called! OrderId: ${JSON.stringify(orderId, null, 4)}`);
        const kintoneRecord = PayTransaction.auth();
        const app = APP_ID;
        const query = `order_id = "${orderId}" order by ordered_date desc limit 1`;
        debug(`Query: ${query}`);
        const totalCount = true;
        let result = null;
        await kintoneRecord.getRecords({app, query, totalCount}).then((rsp) => {
            debug(`Got transaction: ${JSON.stringify(rsp, null, 4)}`);
            let record = rsp.records[0];
            const tran = PayTransaction.convertPayTransactionFromKintoneRecord(record);
            result = tran;
        }).catch((err) => {
            // This SDK return err with KintoneAPIException
            debug(err);
            debug(`ERROR OBJECT: ${JSON.stringify(err.error)}`);
        });
        return result;
    }
    
    /*
        注文時の決済情報を登録する
        pay_state will set as ORDERED
    */
    static async registOrderedTransaction(orderId, userId, title, amount, transactionId) {
        debug(`registOrderedTransaction called!`);
        const app = APP_ID;
        // Build record for kintone app
        const record = {
            order_id: {
                value: orderId
            },
            user_id: {
                value: userId
            },
            title: {
                value: title
            },
            amount: {
                value: amount
            },
            transaction_id: {
                value: transactionId
            },
            currency: {
                value: CURRENCY_JPY
            },
            pay_state: {
                value: PAY_STATE_ORDERED
            },
            ordered_date: {
                value: moment().toISOString()
            }
        };
        // Add to kintone
        const kintoneRecord = PayTransaction.auth();
        let result = null;
        await kintoneRecord.addRecord({app, record}).then((rsp) => {
            debug(rsp);
            const recordId = rsp.id;
            const tran = PayTransaction.getTransaction(orderId);
            result = tran;
        }).catch((err) => {
            debug(err);
            debug(`ERROR OBJECT: ${JSON.stringify(err.error)}`);
        });
        return result;
    }

    /*
        決済情報に配送情報を追加する
        pay_state will set as PAYING
    */
    async updateShippingInfo(shippingMethod, shippingFeeAmount) {
        debug(`updateShippingInfo called! shippingMethod: ${shippingMethod}`);
        const app = APP_ID;
        const updateKey = {
            field: 'order_id',
            value: this.orderId
        };
        const record = {
            shipping_method: {
                value: shippingMethod
            },
            shipping_fee_amount: {
                value: shippingFeeAmount
            },
            pay_state: {
                value: PAY_STATE_PAYING
            }
        };
        // update
        let result = null;
        const kintoneRecord = PayTransaction.auth();
        await kintoneRecord.updateRecordByUpdateKey({app, updateKey, record}).then((rsp) => {
            debug(rsp);
            const recordId = rsp.id;
            const tran = PayTransaction.getTransaction(this.orderId);
            result = tran;
        }).catch((err) => {
            debug(err);
            debug(`ERROR OBJECT: ${JSON.stringify(err.error)}`);
        });
        return result;
    }

    /*
        決済情報を決済完了とする
        pay_state will set as PAID
    */
    async setPaid(paidDate) {
        debug(`setPaid called! paidDate: ${paidDate}`);
        const app = APP_ID;
        if (!paidDate) {
            paidDate = moment();
        }
        const updateKey = {
            field: 'order_id',
            value: this.orderId
        };
        const record = {
            paid_date: {
                value: paidDate.toISOString()
            },
            pay_state: {
                value: PAY_STATE_PAID
            }
        };
        // update
        let result = null;
        const kintoneRecord = PayTransaction.auth();
        await kintoneRecord.updateRecordByUpdateKey({app, updateKey, record}).then((rsp) => {
            debug(rsp);
            const recordId = rsp.id;
            const tran = PayTransaction.getTransaction(this.orderId);
            result = tran;
        }).catch((err) => {
            debug(err);
            debug(`ERROR OBJECT: ${JSON.stringify(err.error)}`);
        });
        return result;
    }
    
}


