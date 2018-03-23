# mercury
A NodeJS wrapper for the open lazada API.

Still a WIP

# API Calls

## /auth/token/create, 'GET'
```javascript
// Note that currently to auth you need to use auth.lazada.com or api.lazada.com, whereas for
// normal get orders and stuff you need to use country specific gateways.
var client = new lazOps.LazopClient('http://api.lazada.com/rest','appkey','secretkey');
var requestClient2 = new lazOps.LazopRequest('/auth/token/create','GET');
requestClient2.addApiParam('code','authcode');
client.execute(requestClient2).then((success)=>{
  console.log(success);
}).catch((error)=>{
  console.log(error);
});
```
## /auth/token/create, 'POST'
```javascript
// Note that currently to auth you need to use auth.lazada.com or api.lazada.com, whereas for
// normal get orders and stuff you need to use country specific gateways.
var client = new lazOps.LazopClient('http://api.lazada.com/rest','appkey','secretkey');
var requestClient = new lazOps.LazopRequest('/auth/token/create');
requestClient.addApiParam('code','authcode');
client.execute(requestClient).then((success)=>{
  console.log(success);
}).catch((error)=>{
  console.log(error);
});
```

# Some Samples

## Getting Orders With Items
```javascript
function getNewOrdersWithItems(){
    // populates your parameters
    var param = new Object();
    param['created_after'] = '2018-03-22T12:27:44+08:00';
    param['status'] = 'pending';
    param['offset'] = 0;
    param['limit'] = 100;

    getAllOrders('sg',access_key,app_key,secret_key,param,[]).then((success)=>{
      return success;
    }).then((list_of_orders)=>{
      // list_of_orders is the list of all orders based on parameters.
      // recursion handles offsets.
      var promise_arr = [];
      // we utilize Promise.all to execute multiple calls simultaneously to getOrderItems
      for(var i=0; i < list_of_orders.length; i++){
        var order_item_params = new Object();
        order_item_params['order_id'] = list_of_orders[i]['order_id'];
        promise_arr.push(getOrderItems('sg',app_key,secret_key,access_key,order_item_params));	
      }
      return handleChainedPromise(promise_arr,list_of_orders);
    }).then((list_of_items_and_orders)=>{
      // we merge the items and orders
      return mergeOrderList(list_of_items_and_orders);
    }).then((mergedOrderList)=>{
      // now we have the orders with items
      console.log(mergedOrderList);
    }).catch((error)=>{
      console.log(error);
    });
}
```
