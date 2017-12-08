//This library implement functions to handle data from Local Bitcoins
const LBCClient = require('localbitcoins-api');
const lbc   = new LBCClient("","");



//General configLBC
var configLBC = {
    user : 'starnickel/',   
    sellFee: 0.01,          // %
    maxSellAmount: 200000,     // Helps to filter high volume sellers
    minSellAmount: 0     // Helps to filter high volume sellers
};



module.exports = {
        getOffers : function (ads, payment, callback){
            return getOffers(ads, payment, callback);
        },

        getUserScore: function(userName, callback){
            return getUserScore(userName,callback);
        },

        findCheapestAd: function(adlist, isSelling,callback){
            return findCheapestAd(adlist,isSelling,callback);
        }

}



function getOffers(ads, payment, callback){
    lbc.api('buy-bitcoins-online', formatUrl(ads,payment), null, function(error, data) {
        if(error) {
            console.log(error);
        }
        else {
            console.log(data.data.ad_count +' '+payment+ " offers from "+ads.CountryName);
            return callback(data)
        }
    });
}

function getUserScore(userName,callback){
    lbc.api('account_info', userName, params, function(error, data) {
        if(error) {
            console.log(error);
            return 0;
        }
        else {
            console.log(userName+" current Feedback Score is "+data.data.feedback_score );
            return callback(data.data.feedback_score);
        }
    });
}

function findCheapestAd(adlist, isSelling,callback){      
    
    var cheapestOffer = {};

    for (var i =0; i < adlist.length; i++){

        if (isSelling){
            if(!validSellingAd(adlist[i]))
                continue;
        }else{
            if (!validBuyingAd(adlist[i]))
                continue;   
        }
                   
        cheapestOffer  = adlist[i]
        
        /*
        if(isSelling)
            cheapestOffer.data.temp_price_xe = cheapestOffer.data.temp_price / FiatExRate['GBP'];
        else
            cheapestOffer.data.temp_price_xe = cheapestOffer.data.temp_price * FiatExRate[cheapestOffer.data.currency];
        */

        return callback(cheapestOffer);
     }  
}


function formatUrl(params, payment){
    return params.CountryCode+params.CountryName+payment;
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
    //Implement the Ad Filters needed
    if (ad.data.min_amount > configLBC.maxSellAmount)
        return false;
    if(ad.data.max_amount < configLBC.minSellAmount)
        return false;
    return true;
}