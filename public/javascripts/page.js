var dt = null
$(function() {
    "use strict";

    loadData();
    setInterval("loadData();",10000); 

});


function loadData(){
    $.get( 'getData', function(data) {
        console.log(JSON.stringify(data));
        updateTable(data);
    })
    .fail(function (jqXHR, textStatus, error) {
        console.log("Error Getting data: " + error);
    });
}


function updateTable(data){
    var dataSet = [];
    

    for (var i = 0; i < data.length;i++){
        
        for (var j = 0; j < data[i].sell.length;j++){
            var item = [formatLink(data[i].src,data[i].link), 
                        data[i].value, 
                        data[i].currency, 
                        data[i].localValue,
                        data[i].localCurrency,
                        formatLink(data[i].sell[j].src,data[i].sell[j].link),
                        data[i].sell[j].value, 
                        data[i].sell[j].currency,
                        data[i].sell[j].arbitrage]
            dataSet.push(item);
            
        }
        
    }
    dt = $('#resultTable').DataTable();
/*
    if (!dt){
       dt = $(document).ready(function() {
            dt = $('#resultTable').DataTable({
                data: dataSet,
                columns: [
                    { title: "Source" },
                    { title: "Price" },
                    { title: "Currency" },
                    { title: "Local Price" },
                    { title: "Local Curr" },
                    { title: "Destination" },
                    { title: "Dest Price" },
                    { title: "Dest Currency" },
                    { title: "Arbitrage" }
                ],
                "order": [[ 8, "desc" ]],
                'paging'      : false,
                'searching'   : false,
                'ordering'    : true,
                'info'        : true,
                'autoWidth'   : true
            });
        });
        updateBoxes(data);
        return;
    }
    */

    dt.clear();
    dt.rows.add(dataSet);
    dt.draw();
    updateBoxes(data);
    
}

function updateBoxes(data){
    var row = dt.row(':eq(0)').data();
    
    //Refresh Arbitrage Rate
    refreshBox('#box1',row[8]+'<sup style="font-size: 20px">%</sup>');   

    refreshBox('#box2', '<h3>'+row[1]+'</h3><p>Buying on <strong>'+row[0]+'</strong></p>');
    refreshClass('#box2cur','fa fa-'+row[2].toLowerCase())

    refreshBox('#box3', '<h3>'+row[6]+'</h3><p>Selling on <strong>'+row[5]+'</strong></p>');
    refreshClass('#box3icon','fa fa-'+box3Icon(row[5]));
  
    $.get( 'getRates', function(data) {
        var htmlb4 = ''
        for (key in data){
            htmlb4 += '<sup style="font-size: 20px"><i class="fa  fa-'+key.toLowerCase()+'"></i></sup>'+data[key]
        }
        refreshBox('#box4', htmlb4);
    })
}



function refreshBox(boxId, value){
	
	var actValue =  $(boxId).html();

	//console.log('actValue = ' + actValue);
	
	if (actValue == value){
		return;
	}

	$(boxId).fadeOut('slow', function() {
		$(boxId).empty();
		$(boxId).append(
			value);	
		$(boxId).fadeIn('slow');
	});
}

function refreshClass(boxId, value){
	
	var actValue =  $(boxId).attr('class');;
	
	if (actValue == value){
		return;
	}

	$(boxId).fadeOut('slow', function() {
		$(boxId).empty();
		$(boxId).attr('class',
			value);	
		$(boxId).fadeIn('slow');
	});
}

function box3Icon(dest){
    if (dest == 'FoxBit'){
        return 'firefox'
    }

    return 'ion ion-social-bitcoin-outline' 
}

function formatLink(input, link){
    return( '<a href="'+link+'" target="_blank">'+input+'</a>')
}