const uuid = require("uuid/v4");
const PayTransaction = require('./router/pay_transaction');
const moment = require('moment');


async function registAndGetTran(orderId, userId) {
    const amount = Math.floor(Math.random() * (11 - 1) + 1);
    const tran = await PayTransaction.registOrderedTransaction(
        orderId, userId, 'ピーマン', amount, "TRAN-001"
    );
    console.log(`Registered transaction: ${JSON.stringify(tran, null, 4)}`);
    return await PayTransaction.getTransaction(orderId);
}

async function exec(userId) {
    // const userId = uuid();
    const orderId = uuid();
    let tran = await registAndGetTran(orderId, userId);
    console.log(`Returned transaction: ${JSON.stringify(tran, null, 4)}`);
    // update shipping info
    tran = await tran.updateShippingInfo("shipping99", 1)
    console.log(`Updated transaction: ${JSON.stringify(tran, null, 4)}`);
    // set paid
    tran = await tran.setPaid(moment());
    console.log(`Compteled transaction: ${JSON.stringify(tran, null, 4)}`);
}

const userList = [
    'User001',
    'User002',
    'User003',
    'User004',
    'User005',
    'User006',
    'User007',
    'User008',
    'User009',
    'User010',
    'User011'
]

userList.forEach(user => {
    exec(user);
});