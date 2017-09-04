//This library implement functions regarding Fiat Currency manipulation
const request = require ('request');


module.exports = {
    getExRate : function (base, symbols, callback){                
            return getExRate(base, symbols, callback);
    },

    validBuyingAd : function (ad){ 
            validBuyingAd(s3, bucket, user, files,rek, callback);
    }
}

function getExRate(base, symbols,callback){
    
    var symbolString= symbols[0];
    
    for (var i = 1 ;i < symbols.length;i++){
        symbolString+=','+symbols[i];
    }
    
    var url = 'https://api.fixer.io/latest?base='+base+'&symbols='+symbolString;
    
    request(url, function (error, response, body) {
        if (error){
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('error:', error); // Print the error if one occurred 
        }else{
            body = JSON.parse(body);
            
            var FiatExRate = [];
            for (var key in body.rates) {
                FiatExRate[key] = 1/body.rates[key]             
                
                console.log(key +' x '+base+' exchange rate is '+FiatExRate[key]);
             }
             callback(FiatExRate);
        }        
      });  

}