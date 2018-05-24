# mercury
A NodeJS wrapper for the open lazada API.

Still a WIP.
Not all endpoints will be covered. Please feel free to contribute

# License
AGPL v3.

I've been seeing a few clones of this repo, I suspect it's from ecommerce companies integrating with the new lazada API before the hard deadline of 31st May (Because it's such a good idea to give a 2 months deadline and spend 1 month of that time waiting for paperwork and approval.), so I want to make this explictly clear.

This software is licensed under the GNU Affero General Public License v3.

Please read the licensing file for terms and conditions, but for a tl;dr,

If you use the software as is in your application, no problem.

If you make ANY changes to it, you MUST make avaliable the source code of the MODIFIED version of this project.

It'd be nice if you can submit it as a PR so that we can all benefit together.

I wrote this SDK adaptation and the subsequent wrappers around the various API Calls without even knowing nodeJS, relying entirely on my knowledge of front-end jquery and basic JS, so this might not be the most optimal way to do it, and I'd really appreciate experienced nodeJS developers who can steer this on the right track, since lazada doesn't seem to have released a node SDK.

# API Calls

## .validateSeller, calls /auth/token/create, 'GET'
```javascript
validateSeller(appkey,secretkey,access_code).then((success)=>{
	console.log("SUCCESS!");
	console.log(success);
}).catch((error)=>{
	console.log("ERROR CAUGHT");
	console.log(error);
});
```

## .getOrderItems, calls /order/items/get, 'GET'
```javascript
getOrderItems(country,app_key,secret_key,access_key,param).then((success)=>{
	console.log((success));
}).catch((error)=>{
	console.log(error);
```

## .getOrders, calls /orders/get, 'GET'
```javascript
// first, define the params and populate w/ whatever you want.
var params = new Object();
param['created_after'] = '2018-03-22T12:27:44+08:00';
param['status'] = 'pending';
param['offset'] = 0; 
param['limit'] = 100;

getOrders(country,access_key,app_key,secret_key,params).then((success)=>{
	console.log((success));
}).catch((error)=>{
	console.log(error);
```
## .updatePriceQuantity, calls /product/price_quantity/update, 'POST
```javascript
	var array_of_json_object =[Object({
			SellerSku:"7YOONA95",
			// price must be a float.
			Quantity:"89999999",
			Price:"100000000"
		})];
	methods.updatePriceQuantity(country,access_key,app_key,secret_key,array_of_json_object).then((success)=>{
		console.log(success);
	}).catch((error)=>{
		console.log(error);
	});
```
## Some Custom API Calls.
## .getAllOrders, a recursive function for .getOrders, 'GET'
```javascript
// first, define the params and populate w/ whatever you want.
var params = new Object();
param['created_after'] = '2018-03-22T12:27:44+08:00';
param['status'] = 'pending';
param['offset'] = 0; // the offset for this function will be incremeneted for each recursion loop until count reaches 0
param['limit'] = 100;

getAllOrders(country,access_key,app_key,secret_key,params,[]).then((success)=>{
	console.log((success));
}).catch((error)=>{
	console.log(error);
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
