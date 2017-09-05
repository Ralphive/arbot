//** App to help doing BTC Arbitrage in between Markets */
//** Compare multiple Buying Sources with Multiple Selling Sources */
// Load Node Dependencies
const request = require ('request');

// Load Local Dependencies
const LBCLib = require('./lib/localbtc');
const Fiat = require('./lib/fiat')

 
var FiatExRate = [];
var buyOptions = [];
var SelOptions = [];

var buyFrom = {
        CountryCode: 'GB/',
        CountryName: "United_Kingdom/",
        Currency: ['GBP','EUR'] ,     //LocalBTC, Kraken
        Payment: ["national-bank-transfer/"],
    };

var sellTo = {
        CountryCode: 'BR/',
        CountryName: 'Brazil/',
        Currency: 'BRL',       //Used in EX rate
        Payment: ['national-bank-transfer/','transfers-with-specific-bank/'],
    };

//Get exchange rates    
Fiat.getExRate(sellTo.Currency,buyFrom.Currency, function(rates)
{
    FiatExRate = rates
})


var buyok = false;
var selok = false;
var foxok = false;
var kraok = false;

//Get Selling price on Foxbit
var Url = 'https://api.blinktrade.com/api/v1/'+sellTo.Currency+'/ticker';
getPriceExchange(Url,function(body){
    var fee = 0.0189; //0,5% Taker + 1.39% Withdraw    
    console.log(sellTo.Currency +  ' Foxbit - High:'+body.high+
                            ' - Low: '+body.low+
                            ' - Last: '+body.last);
    SelOptions.push(
        formatOption('FoxBit', rnd(netPrice(body.last,-fee)), sellTo.Currency, 'https://exchange.foxbit.com.br'));
});

//Get Buying price on Kraken
Url = 'https://api.kraken.com/0/public/Ticker?pair=BTC'+buyFrom.Currency[1]
getPriceExchange(Url, function(body){
    var fee = 0.0026; //0,26% Taker Order
    body = body.result.XXBTZEUR;    
    console.log(buyFrom.Currency[1] +  ' Kraken - High:'+body.h[0]+
                            ' - Low: '+body.l[0]+
                             ' - Last: '+body.c[0])
    buyOptions.push(
        formatOption('Kraken', rnd(netPrice(body.c[0],fee)), buyFrom.Currency[1], 'https://www.kraken.com/u/trade'));
})

// Get Buying Options from LocalBtc
retrieveOffers(buyFrom,function(ad){
    //no Fee for buying
    buyOptions.push(
        formatOption('LocalBTC',rnd(ad.data.temp_price),
            ad.data.currency, ad.actions.public_view))
    buyok = true
    makeAnalysisIfDone()
})

// Get Selling Options from LocalBtc
retrieveOffers(sellTo,function(ad){
    var fee = 0.01; //0,1% Sale
    SelOptions.push(
        formatOption('LocalBTC',rnd(netPrice(ad.data.temp_price,-fee)),
            ad.data.currency, ad.actions.public_view))
    selok = true
    makeAnalysisIfDone()
})


function retrieveOffers(params,callback){
    var cb = 0;
    var offers = [];
    for (var i = 0; i <params.Payment.length; i++){
        LBCLib.getOffers(params, params.Payment[i] , function (data){
            cb++;
    
            offers = Array.prototype.concat.apply(offers,data.data.ad_list); 
            if (cb == params.Payment.length)
                LBCLib.findCheapestAd(offers,false,function(cheapestAd){
                   return callback(cheapestAd)                   
                })
        });
    };
}

function makeAnalysisIfDone(){
    if(buyok && selok)
        mankeAnalysis();
};


function mankeAnalysis(){
    //Calculates Arbitrage Price for each buying X selling Option
    console.log('Sera feita analise');

    for(var i = 0; i<buyOptions.length;i++){
        console.log('>>>>>>>>>>>>>>>>> BUY ON '+ buyOptions[i].src+ ' <<<<<<<<<<<<<<<<<')
        console.log('Price: '+buyOptions[i].currency+' '+ buyOptions[i].value)
        for(var j = 0; j<SelOptions.length;j++){
            if (j==0){
                var buylocal = rnd(buyOptions[i].value*FiatExRate[buyOptions[i].currency])
                console.log('Price: '+SelOptions[j].currency+' '+ buylocal)            
            }
            console.log('>>>>>>>>>>>>>>>>> SELL ON '+ SelOptions[j].src+ ' <<<<<<<<<<<<<<<<<')   
            console.log('Price: '+SelOptions[j].currency+' '+ SelOptions[j].value)
            var sellLocal = rnd(SelOptions[j].value/FiatExRate[buyOptions[i].currency])
            console.log('Price: '+buyOptions[i].currency+' '+ sellLocal)            
            console.log('NET ARBITRAGE RATE: '+rnd((SelOptions[j].value/buylocal-1)*100)+'%');      
        }
        console.log('--------------------------------------------------------')   
    }

    process.exit();        
    



}

function getPriceExchange(url,callback){
    request(url, function (error, response, body) {
        if (error){
            // Print the response status code if a response was received 
            console.log('statusCode:', response && response.statusCode); 
            console.log('error:', error); // Print the error if one occurred 
        }else{
            return callback(JSON.parse(body));
        }        
      });
}

function rnd(num){
    return Math.round(num * 100) / 100;
}

function formatOption(src,value, currency, link){
    var option = {
        src: src,
        value: value,
        currency: currency,
        link:link
    }
    return option;
}

function netPrice(value, fee){
    return value*(1+fee);
}