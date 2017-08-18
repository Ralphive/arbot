//** App to help doing BTC Arbitrage in between Markets */
var LBCClient = require('localbitcoins-api');
var lbc = new LBCClient("","");
var ad_id; //set to value when applicable 
var params = {}; 


//
 
//Parameters
var buyFrom = {
        CountryCode: 'GB/',
        CountryName: "United_Kingdom/",
        Payment1: "national-bank-transfer/",
        Payment2: null};

var sellTo = {
        CountryCode: 'BR/',
        CountryName: 'Brazil/',
        Payment1: 'national-bank-transfer/',
        Payment2: null};


var buyOffers = null;
var sellOffers = null;

lbc.api('buy-bitcoins-online', formatUrl(buyFrom), params, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data.data.ad_count + " BUYING OFFERS RETRIEVED FROM "+buyFrom.CountryName);
        buyOffers = data;
        
        lbc.api('sell-bitcoins-online', formatUrl(sellTo), params, function(error, data) {
            if(error) {
                console.log(error);
            }
            else {
                console.log(data.data.ad_count + " SELLING OFFERS RETRIEVED FROM "+sellTo.CountryName);
                sellOffers = data;
                makeAnalysis(buyOffers,sellOffers);
            }
        });
    }
});

function formatUrl(params){
    return params.CountryCode+params.CountryName+params.Payment1
}