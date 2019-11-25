const uuid = require("uuid/v4");
const PayTransaction = require('./router/pay_transaction');
const OrderedItem = require('./router/ordered_item');
const moment = require('moment');


async function registAndGetTran(orderId, userId) {
    const amount = Math.floor(Math.random() * (11 - 1) + 1);
    const item = getItemInfoByRandom();
    const itemId = item.id;
    const itemName = item.name;
    const tran = await PayTransaction.registOrderedTransaction(
        orderId, userId, itemName, amount, `TRAN-${userId}`
    );
    console.log(`Registered transaction: ${JSON.stringify(tran, null, 4)}`);
    // ordered item
    await OrderedItem.registOrderedItem(orderId, userId, itemId, itemName, amount, 1);
    return await PayTransaction.getTransaction(orderId);
}

function getItemInfoByRandom() {
    const array = [
        {id: "green_pepper", name: "ピーマン"},
        {id: "kidney_bean", name: "インゲンマメ"},
        {id: "turnip", name: "カブ"},
        {id: "burdock", name: "ゴボウ"},
        {id: "spinach", name: "ホウレンソウ"},
    ];
    const item = array[Math.floor(Math.random() * array.length)];
    console.log(`Got item: ${JSON.stringify(item, null, 4)}`);
    return item;
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