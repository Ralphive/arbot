//** App to help doing BTC Arbitrage in between Markets */
//** Compare multiple Buying Sources with Multiple Selling Sources */
// Load Node Dependencies
const request = require ('request');
var express = require('express');
var bodyParser = require('body-parser');

var path = require('path');
var port = 8080

//Configure Express 
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Load Local Dependencies
const LBCLib = require('./lib/localbtc');
const Fiat = require('./lib/fiat')

 
var FiatExRate = [];
var buyOptions = [];
var SelOptions = [];
var output = [];

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

var buyok = false;
var selok = false;
var foxok = false;
var kraok = false;

/** Endpoints */
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/getData', function(req, res){ 
        res.send(output);        
});

app.get('/getRates', function(req, res){ 
    var outex = {};
    for (var key in FiatExRate) {
        outex[key] = rnd(FiatExRate[key])
     }

    res.send(outex);        
});
  



function run(callback){
    try{
        buyOptions = [];
        SelOptions = [];
        buyok = false;
        selok = false;
        foxok = false;
        kraok = false;
        coiok = false;
    
        //Get exchange rates    
        Fiat.getExRate(sellTo.Currency,buyFrom.Currency, function(rates)
        {
            if (rates){
                FiatExRate = rates;
            }
        })
    
        //Get Selling price on Foxbit
        var Url = 'https://api.blinktrade.com/api/v1/'+sellTo.Currency+'/ticker?crypto_currency=BTC';
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
            try{
            
                body = body.result.XXBTZEUR;    
                console.log(buyFrom.Currency[1] +  ' Kraken - High:'+body.h[0]+
                                        ' - Low: '+body.l[0]+
                                        ' - Last: '+body.c[0])
                buyOptions.push(
                    formatOption('Kraken', rnd(netPrice(body.c[0],fee)), 
                                buyFrom.Currency[1], 'https://www.kraken.com/u/trade'));
                buyok = true
                makeAnalysisIfDone(callback)
            }
            catch (e){
                console.error("Error retrieving Kraken Prices");
            }
    
        })

        //Get Buying price on CoinBase 
        for(var j = 0; j < buyFrom.Currency.length; j++){
            Url = 'https://api.coinbase.com/v2/prices/BTC-'+buyFrom.Currency[j]+'/buy'
            getPriceExchange(Url, function(body){
                var fee = 0.0025; //0,25% Taker Order
                body = body.data;    
                console.log('Coinbase '+body.base + ' price: '+body.currency+' '+ body.amount)
                buyOptions.push(
                    formatOption('Coinbase', rnd(netPrice(body.amount,fee)), body.currency, 'https://www.gdax.com'));
                    buyok = true
                    makeAnalysisIfDone(callback)
            })     
        }
       
        // Get Buying Options from LocalBtc
        retrieveOffers(buyFrom,function(ad){
            //no Fee for buying
            buyOptions.push(
                formatOption('LocalBTC',rnd(ad.data.temp_price),
                    ad.data.currency, ad.actions.public_view))
            buyok = true
            makeAnalysisIfDone(callback)

        })
    
        // Get Selling Options from LocalBtc
        retrieveOffers(sellTo,function(ad){
            var fee = 0.01; //0,1% Sale
            SelOptions.push(
                formatOption('LocalBTC',rnd(netPrice(ad.data.temp_price,-fee)),
                    ad.data.currency, ad.actions.public_view))
            selok = true
            makeAnalysisIfDone(callback)
        })
    }   
    catch (e) {
        console.log("RUN EXCEPTION");
        console.log(e);
        console.log("leaving catch block");
    }
}



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

function makeAnalysisIfDone(callback){
    if(buyok && selok)
        mankeAnalysis(callback);
};


function mankeAnalysis(callback){
    //Calculates Arbitrage Price for each buying X selling Option
    output = [buyOptions.length];
    for(var i = 0; i<buyOptions.length;i++){
        console.log('>>>>>>>>>>>>>>>>> BUY ON '+ buyOptions[i].src+ ' <<<<<<<<<<<<<<<<<')
        console.log('Price: '+buyOptions[i].currency+' '+ buyOptions[i].value)
        output[i]=buyOptions[i];
        for(var j = 0; j<SelOptions.length;j++){
            if (j==0){
                var buylocal = rnd(buyOptions[i].value*FiatExRate[buyOptions[i].currency])
                console.log('Price: '+SelOptions[j].currency+' '+ buylocal)            
                
                output[i].localValue = buylocal;
                output[i].localCurrency = SelOptions[j].currency;
                output[i].exRate = rnd(FiatExRate[buyOptions[i].currency])
                output[i].sell = [SelOptions.length];                
            }
            console.log('>>>>>>>>>>>>>>>>> SELL ON '+ SelOptions[j].src+ ' <<<<<<<<<<<<<<<<<')   
            console.log('Price: '+SelOptions[j].currency+' '+ SelOptions[j].value)
            var sellLocal = rnd(SelOptions[j].value/FiatExRate[buyOptions[i].currency])
            console.log('Price: '+buyOptions[i].currency+' '+ sellLocal)            
            var arbitrage = rnd((SelOptions[j].value/buylocal-1)*100);
            console.log('NET ARBITRAGE RATE: '+ arbitrage+'%'); 
            console.log('Link: '+ SelOptions[j].link); 
            
            output[i].sell[j] = JSON.parse(JSON.stringify(SelOptions[j])); //To not reference the array
            output[i].sell[j].arbitrage = arbitrage;                        //When updating in here
        }
        console.log('--------------------------------------------------------')   
    }
    output
    callback(output);
}

function getPriceExchange(url,callback){
    request(url, function (error, response, body) {
        if (error || response.statusCode != 200){
            // Print the response status code if a response was received 
            console.log('error call on '+ url); 
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

var server = app.listen(port, function(){
    console.log('Server listening on port '+port);
    
    
    run(function(data){
        output = data
    })
    setInterval(run,10000,function(data){
        output = data
    })
  });
  