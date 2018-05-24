/*
Mercury
Copyright (C) 2018 @ Jing Kai 

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

Author: Jing Kai

Last updated: 24-05-2018

Current Version: 0.1.1

File Name: LazOps.js

File Description: An implementation of the lazada SDK, written in NodeJS

This implementation has little to no validation.
It makes the fatal assumption that... the user is smart.
addFile not tested as we dont have any testing account to test.

How to get the stream - for file uploading.
const fs = require('fs');
var contents = fs.readFileSync('inject.txt').toString();

*/

const crypto = require('crypto');
var request = require('request');
const FormData = require('form-data');

// for debugging purposes
const util = require('util');
var globalLog = require('global-request-logger');
//globalLog.initialize();



class LazopRequest
{
	constructor(api_name,httpMethod = 'POST'){
		this.apiName = api_name;
		this.httpMethod = httpMethod;
		this.udfParams = new Object();
		this.fileParams = new Object();
		this.headerParams = new Object();
	}
	addApiParam(key,value)
	{
		// we explictly cast it to string.
		this.udfParams[String(key)] = String(value);
	}
	addFileParam(key,content,mimeType='application/octet-stream')
	{
		key = String(key); // explicitly casting to string.
		var file = new Object();
		file['type'] = mimeType;
		file['content'] = content;
		file['name'] = key;
		this.fileParams[key] = file;
	}
	addHttpHeaderParam(key,value)
	{
		// explicitly casting to string yet again.
		this.headerParams[String(key)] = String(value);
	}
}


class LazopClient {
    // everyone seems to have different ideas about how to 
    // create and construct private vars.
    // I'm not going to declare private functions in this class.
    // I hope that Node will support proper encapsulation soon...
    constructor(gateway, appkey, secretkey) {
        // constructor
       this.gatewayUrl = gateway;
       this.signMethod = 'hmac'
        this.appkey = appkey;
        this.secretkey = secretkey;
    }
    /*
    execute is the primary entry point for this object.
    */
    execute(lazReqObj, accessToken = null) {
        var sysParams = new Object();
        sysParams["app_key"] = this.appkey;
        sysParams["sign_method"] = this.signMethod;
       	sysParams["timestamp"] = new Date().getTime();
      

        if (null != accessToken) {
            sysParams["access_token"] = accessToken;
        }
        
        var api_params = lazReqObj.udfParams;
        var requestUrl = this.gatewayUrl;

        // ensures that if the user enters, ie
        // https://lazada.com.sg/
        // the last / is sliced.
        if (requestUrl.endsWith("/")) {
                requestUrl = requestUrl.substring(0, requestUrl.length - 1);
            }
        requestUrl += lazReqObj.apiName;
        requestUrl += "?";
        sysParams["sign"] = this.generateSign(lazReqObj.apiName, this.mergeObjects(api_params, sysParams));
        const keys = Object.keys(sysParams);
        Object.keys(sysParams).forEach(function(key) {
            requestUrl += key;
            requestUrl += "=";
            requestUrl += encodeURIComponent(sysParams[key]);
            requestUrl += "&";
        });
        // removes the last & that was appended
        requestUrl = requestUrl.substring(0, requestUrl.length - 1);
        if (lazReqObj.httpMethod == "POST") {
           	 return this.generate_post_req(requestUrl, api_params, lazReqObj.fileParams, lazReqObj.headerParams);
            } else {

        	 return this.generate_get_req(requestUrl, api_params, lazReqObj.headerParams);
            }
        }
        /*
         */
        generateSign(apiName, params) {
            var sorted = this.kSort(params);
            const signed_string = this.generateString(apiName, sorted);
            var hash = this.generateHash(this.secretkey, signed_string);
            hash = hash.toUpperCase();
            return hash;
        }
        // a node JS function to replicate ksort in php array - sort the keys in ascending order.
        kSort(obj) {
            const keys = Object.keys(obj).sort(),
                sortedObj = {};

            for (var i in keys) {
                sortedObj[keys[i]] = obj[keys[i]];
            }

            return sortedObj;
        }
        generateString(apiName, paramsObj) {
            var string_to_be_signed = '';
            // construct the string to be hashed
            string_to_be_signed += apiName;
            const keys = Object.keys(paramsObj);
            Object.keys(paramsObj).forEach(function(key) {
                string_to_be_signed += String(key);
                string_to_be_signed += String(paramsObj[key]);

            });
            return string_to_be_signed;
        }
        generateHash(secretkey, string_to_be_signed) {
            var hmac = crypto.createHmac('md5', secretkey);
            hmac.update(string_to_be_signed);

            return hmac.digest('hex');
        }
        mergeObjects(object1, object2) {
            // this may be updated with an implementation of
            // *args or *kwargs to allow merging for > 2 obj.
            // in a more dynamic manner.
            var mergedObj = new Object();
            Object.keys(object1).forEach(function(key) {
                mergedObj[key] = object1[key];
            });
            Object.keys(object2).forEach(function(key) {
                mergedObj[key] = object2[key];
            });
            return mergedObj;
        }
        generate_post_req(url, postFields = null, fileFields = null, headerFields = null) {
        
            /*
            When I was learning node and the request module, 
            I was confused as to why the form could be modified after 
            the post method was called. Buried in the request docs is 
            the explanation - the form "can be modified until the request 
            is fired on the next cycle of the event-loop"*/
            var options = new Object();
            options['url'] = url;
            if (null != headerFields) {
                options['headers'] = {};
                var keys = Object.keys(headerFields);

                for (var i = 0; i < keys.length; i++) {
	                options['headers'][keys[i]] = headerFields[keys[i]];
	            }
            }
            return new Promise((resolve, reject) => {
                var req = request.post(url, function(err, resp, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(body);
                    }
                });
                var form = req.form();
                // following lazada syntax
                // https://github.com/request/request
                // RTFD.
                if (null != fileFields) {
                	var keys = Object.keys(fileFields);

                    for (var i = 0; i < keys.length; i++) {

		                 form.append('file', fileFields[keys[i]]['content'], {
                            filename: fileFields[keys[i]]['name'],
                            contentType: fileFields[keys[i]]['type']
                        });
		            }
                  
                }
                if (null != postFields) {

                	 var keys = Object.keys(postFields);

                    for (var i = 0; i < keys.length; i++) {
		                form.append(keys[i], postFields[keys[i]]);
		            }
                }

            }).then((success) => {
                return success;
            }).catch((error) => {
                return error;
            });


        }
        generate_get_req(url, apiFields = null, headerFields = null){
        	const api_obj_keys = Object.keys(apiFields);
        	for(var i=0; i < api_obj_keys.length; i++){
        		url += '&';
        		url += api_obj_keys[i];
        		url += '=';
        		url += encodeURIComponent(apiFields[api_obj_keys[i]]);
        	}
        	console.log(apiFields);
            var options = new Object();
            options['url'] = url;
        	if (null != headerFields) {
                options['headers'] = {};
                const keys = Object.keys(headerFields);

                for (var i = 0; i < keys.length; i++) {
	                options['headers'][keys[i]] = headerFields[keys[i]];
	            }
            }
            return new Promise((resolve, reject) => {
                var req = request.get(url, function(err, resp, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(body);
                    }
                });
               

            }).then((success) => {
                return success;
            }).catch((error) => {
                return error;
            });

        }

 }
 // exports both classes for external use
module.exports = {
  LazopRequest : LazopRequest,
  LazopClient : LazopClient
}
