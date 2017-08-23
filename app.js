//** App to help doing BTC Arbitrage in between Markets */
//Load External Dependencies
var LBCClient = require('localbitcoins-api');
var request = require ('request');

//Initialize Parameters
var lbc = new LBCClient("","");
var ad_id; //set to value when applicable 
var params = {}; 
  
//General Config
var config = {
    LBCuser : 'starnickel/',    // Your username on LocalBitcoin,
    EXsrc:  'http://api.coindesk.com/v1/bpi/currentprice/', // Exchange Rate source
    sellFee: 0.01,           // 1% fees on Local Btc Selling
    maxSellAmount: 1900 // Helps to filter high volume sellers
};

var buyFrom = {
        CountryCode: 'GB/',
        CountryName: "United_Kingdom/",
        Currency: 'GBP',       //Used in EX rate 
        Payment1: "national-bank-transfer/",
        Payment2: null,          // To be implemented
        CurrPrice: null
    };

var sellTo = {
        CountryCode: 'BR/',
        CountryName: 'Brazil/',
        Currency: 'BRL',       //Used in EX rate         
        Payment1: 'national-bank-transfer/',
        Payment2: null,
        CurrPrice: null,
        FoxBitOrders: null         //Last Sales Order on Exchange
    };



//Get Current User Feedback Score
var UserScore = getUserScore(config.LBCuser)

console.log('Retrieving Exchange Rates from '+ config.EXsrc)
//Get BTC Data
//buyFrom.CurrPrice = getExRate(buyFrom.Currency);
//sellTo.CurrPrice  = getExRate(sellTo.Currency);
sellTo.FoxBitOrders = getLastOrderFoxBit(sellTo.Currency);

//Get Fiat Data
FiatExRate = getfiatExRate();

var buyOffers = null;
var sellOffers = null;

retrieveOffersLocalBTC(buyFrom, function (data){
    console.log(data.data.ad_count + " Buying offers retrieved from "+buyFrom.CountryName);
    buyOffers = data;
    
    retrieveOffersLocalBTC(sellTo, function (data){
        console.log(data.data.ad_count + " SELLING offers retrieved from "+sellTo.CountryName);
        sellOffers = data;
        makeAnalysis(buyOffers.data.ad_list,sellOffers.data.ad_list);
    });
});


function retrieveOffersLocalBTC(ads, callback){
    lbc.api('buy-bitcoins-online', formatUrl(ads), params, function(error, data) {
        if(error) {
            console.log(error);
        }
        else {
            return callback(data)
        }
    });
}


function makeAnalysis(buy, sell)
{   
    console.log('analyzing offers...');

    var ibuy = 0;
    var isell = 0;
    var cheapBuy = {};
    var cheapSell = {};

    //Find cheapest applicable buying option
    for (ibuy; ibuy<buy.length; ibuy++){
        //To implemente logic for finding cheapest available ad

        if (buy[ibuy].data.require_trade_volume >=2)
            continue;
        cheapBuy  = buy[ibuy]
        cheapBuy.data.temp_price_xe = cheapBuy.data.temp_price * fiatExRate;
        break;
    }

    //Find cheapest applicable selling option
    for (isell; isell<sell.length; isell++){
        //To implemente logic for finding cheapest available ad
        
        if (sell[isell].data.min_amount > config.maxSellAmount)
            continue;
        
        
        cheapSell  = sell[isell]
        cheapSell.data.temp_price_xe = cheapSell.data.temp_price / fiatExRate;
        break;
    }
    
    //Fees and Values
    var SellingFee = cheapSell.data.temp_price_xe * config.sellFee
    var arbRate =((cheapSell.data.temp_price-SellingFee)/cheapBuy.data.temp_price_xe -1)*100;
    
    arbRate = Math.round(arbRate * 100) / 100;
    SellingFee = Math.round(SellingFee * 100) / 100;


    console.log('Cheapest BUYING option in '+buyFrom.CountryName+' is '+ 
                cheapBuy.data.currency+' '+cheapBuy.data.temp_price + 
                ' i.e. - '+ sellTo.Currency+' '+cheapBuy.data.temp_price_xe);

    
    console.log('>>>>>>>>>>>Local Bitcoins <<<<<<<<<<<')
    console.log('Cheapest SELLING advertisement in '+sellTo.CountryName+' is '+ 
            cheapSell.data.currency+' '+cheapSell.data.temp_price+ 
                'i.e. - '+ buyFrom.Currency+' '+(cheapSell.data.temp_price_xe))

    console.log('Current NET Arbitrage rate is '+arbRate+'%')
    //console.log('Deducted fee '+SellingFee+'('+config.sellFee*100+'%)' )
    console.log('Buy Ad - '+cheapBuy.actions.public_view)
    console.log('Sell Ad - '+cheapSell.actions.public_view)
    process.exit();        
}

function formatUrl(params){
    return params.CountryCode+params.CountryName+params.Payment1
}

function getUserScore(userName){
    lbc.api('account_info', userName, params, function(error, data) {
        if(error) {
            console.log(error);
            return 0;
        }
        else {
            console.log("Your  Current Feedback Score "+data.data.feedback_score );
            return data.data.feedback_score;
        }
    });
}

function getExRate(currency){
    
    request(config.EXsrc+currency+'/.json', function (error, response, body) {
        if (error){
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('error:', error); // Print the error if one occurred 
        }else{
            body = JSON.parse(body);
            console.log(currency + ' Exchange rate on ' + body.time.updated + ' is '+ body.bpi[currency].rate_float )
            return body.bpi[currency].rate_float;

        }        
        console.log('body:', body); // Print the HTML for the Google homepage. 
      });
}

function getLastOrderFoxBit(currency){
    
    var url = 'https://api.blinktrade.com/api/v1/'+currency+'/ticker';

    request(url, function (error, response, body) {
        if (error){
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('error:', error); // Print the error if one occurred 
        }else{
            body = JSON.parse(body);
            console.log(currency +  ' Foxbit - High:'+body.high+
                                    ' - Low: '+body.low+
                                    ' - Last: '+body.last);
            return body;

        }        
        console.log('body:', body); // Print the HTML for the Google homepage. 
      });
}

function getfiatExRate(currency){
    
    var url = 'https://api.fixer.io/latest?base='+buyFrom.Currency+'&symbols='+sellTo.Currency
    
    request(url, function (error, response, body) {
        if (error){
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('error:', error); // Print the error if one occurred 
        }else{
            body = JSON.parse(body);
            fiatExRate = body.rates[sellTo.Currency];
            console.log(buyFrom.Currency +' x '+sellTo.Currency+' exchange rate is '+body.rates[sellTo.Currency]);
            return (body.rates[sellTo.Currency]);
        }        
      });
}