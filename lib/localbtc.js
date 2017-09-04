//This library implement functions to handle data from Local Bitcoins

//General configLBC
var configLBC = {
    user : 'starnickel/',   
    sellFee: 0.01,          // %
    maxSellAmount: 1900,     // Helps to filter high volume sellers
    minSellAmount: 150     // Helps to filter high volume sellers
};



module.exports = {
        validSellingAd : function (ad){                
                return validSellingAd(ad);
        },

        validBuyingAd : function (ad){ 
            return validBuyingAd(ad);
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
    //Implement the Ad Filters needed
    if (ad.data.min_amount > configLBC.maxSellAmount)
        return false;
    if(ad.data.max_amount < configLBC.minSellAmount)
        return false;
    return true;
}