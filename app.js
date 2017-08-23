//** App to help doing BTC Arbitrage in between Markets */
//Load External Dependencies
const LBCClient = require('localbitcoins-api');
const request = require ('request');
//const KrakenClient = require('kraken-api');

//Initialize Parameters
const lbc   = new LBCClient("","");
//const kraken= new KrakenClient("", "");

var ad_id; //set to value when applicable 
var params = {}; 
  
//General configLBC
var configLBC = {
    user : 'starnickel/',   
    sellFee: 0.01,          // %
    maxSellAmount: 1900     // Helps to filter high volume sellers
};

var buyFrom = {
        CountryCode: 'GB/',
        CountryName: "United_Kingdom/",
        Currency: ['GBP','EUR'] ,     //LocalBTC, Kraken
        Payment1: "national-bank-transfer/",
        Payment2: null,          // To be implemented
        CurrPrice: null
    };

var sellTo = {
        CountryCode: 'BR/',
        CountryName: 'Brazil/',
        Currency: 'BRL',       //Used in EX rate         
        Payment1: 'national-bank-transfer/',
        Payment2: 'transfers-with-specific-bank/',
        CurrPrice: null,
        FoxBitOrders: null         //Last Sales Order on Exchange
    };



//Get Current User Feedback Score
//var UserScore = getUserScore(configLBC.user)
sellTo.FoxBitOrders = getLastOrderFoxBit(sellTo.Currency);

//Get Fiat Data
var FiatExRate = {};
getfiatExRate();

var buyOffers = null;
var sellOffers = null;
var buy2Offers = null;
var sell2Offers = null;

retrieveOffersLocalBTC(buyFrom, 'Payment1', function (data){
    console.log(data.data.ad_count + " Buying offers retrieved from "+buyFrom.CountryName);
    buyOffers = data;
    
    retrieveOffersLocalBTC(sellTo, 'Payment1', function (data){
        console.log(data.data.ad_count + " Selling offers *"+sellTo.Payment1+"* retrieved from "+sellTo.CountryName) ;
        sellOffers = data;

        if(sellTo.Payment2){
            retrieveOffersLocalBTC(sellTo, 'Payment2', function (data){
                console.log(data.data.ad_count + " Selling offers*"+sellTo.Payment2+"*  retrieved from "+sellTo.CountryName);
                sell2Offers = data;
                makeAnalysis(buyOffers.data.ad_list,sellOffers.data.ad_list,null,sell2Offers.data.ad_list);

            });    
        }
    });
});

function retrieveOffersLocalBTC(ads, payment, callback){
    lbc.api('buy-bitcoins-online', formatUrl(ads,payment), params, function(error, data) {
        if(error) {
            console.log(error);
        }
        else {
            return callback(data)
        }
    });
}

function makeAnalysis(buy, sell, buy2, sell2)
{   
    console.log('analyzing offers...');

    var cheapBuy = findCheapestAd(buy,null,false)
    var cheapSell = findCheapestAd(sell,null,true)
   
    if(buy2)
        cheapBuy = findCheapestAd(buy2,cheapBuy,false)
    if(sell2)
        cheapSell = findCheapestAd(sell2,cheapSell,true);
   
    //Fees and Values
    var SellingFee = cheapSell.data.temp_price_xe * configLBC.sellFee
    var arbRate =((cheapSell.data.temp_price-SellingFee)/cheapBuy.data.temp_price_xe -1)*100;

    console.log('>>>>>>>>>>> LOCAL BITCOINS <<<<<<<<<<<')    
    console.log('Cheapest BUYING option in '+buyFrom.CountryName+' is '+ 
                cheapBuy.data.currency+' '+rnd(cheapBuy.data.temp_price) + 
                ' i.e. - '+ sellTo.Currency+' '+rnd(cheapBuy.data.temp_price_xe));
    console.log('Cheapest SELLING advertisement in '+sellTo.CountryName+' is '+ 
            cheapSell.data.currency+' '+cheapSell.data.temp_price+ 
                ' i.e. - '+ buyFrom.Currency+' '+rnd(cheapSell.data.temp_price_xe))

    console.log('Current NET Arbitrage rate is '+rnd(arbRate)+'%')
    //console.log('Deducted fee '+SellingFee+'('+configLBC.sellFee*100+'%)' )
    console.log('Buy Ad - '+cheapBuy.actions.public_view)
    console.log('Sell Ad - '+cheapSell.actions.public_view)
    process.exit();        
}

function formatUrl(params, payment){
    return params.CountryCode+params.CountryName+params[payment]
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

function getfiatExRate(){
    
    var symbols=buyFrom.Currency[0]
    
    for (var i = 1 ;i < buyFrom.Currency.length;i++){
        symbols+=','+buyFrom.Currency[i];
    }
    
    var url = 'https://api.fixer.io/latest?base='+sellTo.Currency+'&symbols='+symbols;
    
    request(url, function (error, response, body) {
        if (error){
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('error:', error); // Print the error if one occurred 
        }else{
            body = JSON.parse(body);
            
            for (var key in body.rates) {
                FiatExRate[key] = 1/body.rates[key]             
                
                console.log(key +' x '+sellTo.Currency+' exchange rate is '+FiatExRate[key]);
             }
        }        
      });
}


function findCheapestAd(adlist, prevCheap, isSelling){      
    
    var cheapestOffer = {};

    for (var i =0; i < adlist.length; i++){
        
        if(prevCheap && (prevCheap.data.temp_price <= adlist[i].data.temp_price))
            return prevCheap;
        
        if (isSelling){
            if(!validSellingAd(adlist[i]))
                continue;
        }else{
            if (!validBuyingAd(adlist[i]))
                continue;   
        }
            
        
        cheapestOffer  = adlist[i]
        
        if(isSelling)
            cheapestOffer.data.temp_price_xe = cheapestOffer.data.temp_price / FiatExRate['GBP'];
        else
            cheapestOffer.data.temp_price_xe = cheapestOffer.data.temp_price * FiatExRate[cheapestOffer.data.currency];
        
        return cheapestOffer;
     }  
}

function validBuyingAd(ad){
    //Implement the Ad Filters needed
    if(ad.data.require_trade_volume >=2)
        return false;
    if(ad.data.profile.username === 'jaymalteser')
        return false;

    return true;
}

function validSellingAd(ad){
    if (ad.data.min_amount > configLBC.maxSellAmount)
        return false;
    return true;

}

function rnd(num){
    return Math.round(num * 100) / 100;
}