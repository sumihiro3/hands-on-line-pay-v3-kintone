require("dotenv").config();
const debug = require("debug")("line-pay:pay_transaction");
const kintone = require('@kintone/kintone-js-sdk');

const DOMAIN_NAME = process.env.KINTONE_DOMAIN_NAME;
const API_TOKEN = process.env.KINTONE_ORDER_ITEM_APP_API_TOKEN;
const APP_ID = process.env.KINTONE_ORDER_ITEM_APP_ID;

/*
    注文情報
    - order_id
    - user_id
    - item_id
    - item_name
    - unit_price
    - quantity
*/
module.exports =  class OrderedItem {
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
    
    /*
        注文情報を登録する
    */
    static async registOrderedItem(orderId, userId, item_id, item_name, unitPrice, quantity) {
        debug(`registOrderedItem called!`);
        const app = APP_ID;
        // Build record for kintone app
        const record = {
            order_id: {
                value: orderId
            },
            user_id: {
                value: userId
            },
            item_id: {
                value: item_id
            },
            item_name: {
                value: item_name
            },
            unit_price: {
                value: unitPrice
            },
            quantity: {
                value: quantity
            }
        };
        // Add to kintone
        const kintoneRecord = OrderedItem.auth();
        await kintoneRecord.addRecord({app, record}).then((rsp) => {
            debug(rsp);
        }).catch((err) => {
            debug(err);
            debug(`ERROR OBJECT: ${JSON.stringify(err.error)}`);
        });
    }
}


