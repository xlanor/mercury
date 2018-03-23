var lazOps = require('./LazOps.js');

// returns a promise.
function getOrders(country,access_key,app_key,secret_key,api_parameters){
	return new Promise((resolve,reject)=>{
		if (![country,access_key,app_key,secret_key,api_parameters].every(Boolean)) {
		     reject("No parameter can be empty");
		}
		const country_check = checkCountry(country,access_key);

		if("gateway" in country_check){
			resolve(country_check);
		}else{
			reject(country_check);
		}
	}).then((success_arr)=>{
		var client = new lazOps.LazopClient(success_arr['gateway'],app_key, secret_key);
		var requestClient = new lazOps.LazopRequest('/orders/get','GET');
		var param_keys = Object.keys(api_parameters);

        for (var i = 0; i < param_keys.length; i++) {
        	requestClient.addApiParam(param_keys[i],api_parameters[param_keys[i]])
        }
		return client.execute(requestClient,access_key);

	}).then((success)=>{
		return(success);
	}).catch((error)=>{
		throw(error);
	});
}

// A Function to check for valid country and return the appropirate gateway
function checkCountry(country,access_key){
	switch(country)
	{
		case "sg":
				return({"gateway":"https://api.lazada.sg/rest","accesskey":access_key})
				break;
		case "my":
				return({"gateway":"https://api.lazada.com.my/rest","accesskey":access_key})
				break;
		default:return({"error":"Unsupported gateway"});
				break;
	}
}

/*
A recursive function.  
*/
function getAllOrders(country,access_key,app_key,secret_key,api_parameters,array_of_orders){
	
	cur_loop = ((api_parameters['offset'] / 100) > 0)? api_parameters['offset'] / 100 : api_parameters['offset'];
	console.log("LOOP "+ cur_loop);
	return new Promise((resolve,reject)=>{
		resolve(getOrders(country,access_key,app_key,secret_key,api_parameters));
	}).then((success)=>{
		success = JSON.parse(success);
			console.log("SUCCESS CODE: "+parseInt(success.code));
			if("type" in success){
				if(success.type == "ISP" || success.type =="SYSTEM")
				{
					if(success.code == 6){
						// for unknown reasons lazada's api throws an internal error when your offset grows too big, ie: > 10000.
						throw("INTERNAL LAZADA ERROR");
					}
					console.log("THEIR PROBLEM");

					return getAllOrders(country,access_key,app_key,secret_key,api_parameters,array_of_orders);
				}
				else{
					throw(success);
				}
			}
		
			console.log("NOERR");
			if (parseInt(success.data.count) > 0){
				for(var i=0; i< success.data.count; i++){
					array_of_orders.push(success.data.orders[i]);
				}
				api_parameters['offset'] += 100;
				return getAllOrders(country,access_key,app_key,secret_key,api_parameters,array_of_orders);
			}else{
				console.log("ENDEX");
				return (array_of_orders);
			}	
			
		

	}).catch((error)=>{
		throw(error);
	});
}

// we modify the lazada response to add the order code into this

function getOrderItems(country,app_key,secret_key,access_code,api_parameters){
	return new Promise((resolve,reject)=>{
		if (![country,access_key,app_key,secret_key,api_parameters].every(Boolean)) {
		     reject("No parameter can be empty");
		}
		const country_check = checkCountry(country,access_key);
		if("gateway" in country_check){
			resolve(country_check);
		}else{
			reject(country_check);
		}

	}).then((success_arr)=>{
		var client = new lazOps.LazopClient(success_arr['gateway'],app_key, secret_key);
		var requestClient = new lazOps.LazopRequest("/order/items/get",'GET');
		var param_keys = Object.keys(api_parameters);

        for (var i = 0; i < param_keys.length; i++) {
        	requestClient.addApiParam(param_keys[i],api_parameters[param_keys[i]])
        }
		return client.execute(requestClient,access_key);

	}).then((success)=>{
		success = JSON.parse(success);
		var order_id = api_parameters['order_id'];
		var returnObject = new Object();
		returnObject[order_id] = success.data;
		console.log(returnObject[order_id]);
		return(returnObject);
	}).catch((error)=>{
		throw(error);
	});
}

function validateSeller(app_key,secret_key,access_code){
	/*
	For validation it appears a different api is used.
	*/
	var client = new lazOps.LazopClient("https://auth.lazada.com/rest",app_key, secret_key);
	var requestClient2 = new lazOps.LazopRequest('/auth/token/create','GET');
	requestClient2.addApiParam('code', access_code);
	return new Promise((resolve,reject)=>{
		resolve(client.execute(requestClient2));
	}).then((success)=>{
		success = JSON.parse(success);
		if(success.type){
			throw(success);
		}else{
			return(success);
		}
	}).catch((error)=>{
		throw(error);
	});
}

function handleChainedPromise(array_of_promises,order_array){
	// we accept order-array so that we can resolve it and then chain it further down.
	return Promise.all(array_of_promises).then((success)=>{
		
		return({"list_of_items":success, "list_of_orders":order_array});
	}).catch((error)=>{
		throw(error);
	})

}

function mergeOrderList(combined_list){
	for(var i=0; i < combined_list.list_of_items.length; i++){
		var key = Object.keys(combined_list.list_of_items[i])[0];
		var list_of_items = combined_list.list_of_items[i][key];
		//console.log(key);
		//console.log(combined_list.list_of_items[i]);
		for(var j=0; j< combined_list.list_of_orders.length;j++){
			if(combined_list.list_of_orders[j].order_number == key){
				combined_list.list_of_orders[j]['order_items'] = list_of_items;
			}
		}
	}
	return combined_list;
}
