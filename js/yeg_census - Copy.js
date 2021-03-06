var yegGeojson = false;
var yegCensus = false;
var yegCensus2 = false;

//Edmonton geojson
d3.json("data/NCensus_Income.geojson", function(data) {

    yegGeojson = data;

    if (yegCensus && yegCensus2) renderCharts(yegCensus, yegCensus2, yegGeojson);
});



//Census data
d3.csv("data/NCensus_Income_flat.csv", function(data) {

    yegCensus = data;

    if (yegGeojson && yegCensus2) renderCharts(yegCensus, yegCensus2, yegGeojson);
});

d3.csv("data/NCensus_Income.csv", function(data2) {

    yegCensus2 = data2;

    if (yegGeojson && yegCensus) renderCharts(yegCensus, yegCensus2, yegGeojson);
});

function renderCharts(data, data2, geojson) {

    //Clean data use only the properties needed
    //This is data from NCensus_Income.csv
    dataParsed = data.map(function(d) {
    // idx,name,census_type,census_type_value,pct_category,
    //pct,LI_greater_than_MC,Pct_LowIncome_less_than_60K,
    //Pct_MiddleClass_60K_to_150K,Pct_Over_150K,
    //POINT_X,POINT_Y,Assessed_Value_Sum,Avg_Assessed_Value

        return {
            Neighbouhood: d.name,
            AvgAssessedPropVal: d.Avg_Assessed_Value,
            census_type: d.census_type,
            census_type_value: d.census_type_value,
            pct_category: d.pct_category,
            pct_val: d.pct,
            Pct_LowIncome_less_than_60K: d.Pct_LowIncome_less_than_60K,
            Pct_MiddleClass_60K_to_150K: d.Pct_MiddleClass_60K_to_150K,
            Pct_Over_150K: d.Pct_Over_150K,
            Latitude: d.POINT_Y,
            Longitude: d.POINT_X
        };
    });
    delete data;

    data2Parsed = data2.map(function(d) {
        return {
            Neighbouhood: d.name,
            LIgreaterThanMC: d.LI_greater_than_MC,
            Latitude: d.POINT_Y,
            Longitude: d.POINT_X
        }
    });
    delete data2


    //Crossfilter instance
    var ndx = crossfilter(dataParsed);
    var ndx2 = crossfilter(data2Parsed);
    var groupName = "Census2016";



    //Define Dimensions
    var neighbourhoodsDim = ndx.dimension(function(d) { return d.Neighbouhood; });
    var neighbourhoodsDim2 = ndx2.dimension(function(d) { return d.Neighbouhood; });
    var LIncome_greater = ndx2.dimension(function(d) { return d.LIgreaterThanMC; });
    var avgPropValue = ndx.dimension(function(d) { return d.AvgAssessedPropVal; });

    var neighbourCoordsDim = ndx2.dimension(function(d) { return [d.Neighbouhood, d.Latitude, d.Longitude]; });
    var neighbourIncomeDim = ndx.dimension(function(d) { return d.pct_category; });


    //Define groups
    var groupByPct = function(d) { return d.pct_val; };
    var groupByIncCat = function(d) { return d.LIgreaterThanMC };
    // var neighbourhoodGroup = neighbourhoodsDim.group().reduce(groupByIncCat);
    var incomeGroup = neighbourIncomeDim.group().reduceSum(groupByPct);

    var coordsGroup = neighbourCoordsDim.group();
    var sumofAllInfractions = ndx.groupAll().reduceSum(groupByPct);

    var neighbourhoodGroupMap = neighbourhoodsDim2.group().reduceSum(groupByIncCat);
    var neighbourhoodGroup = neighbourhoodsDim.group().reduceSum(groupByPct);


    //Define values (to be used by chart(s))
    //Got the colors from http://colorbrewer2.org
    var pieColors = ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'];
    var mapColors =  ['#a8ddb5','#43a2ca'];
    var pieScaleColors = d3.scale.quantize().domain([0, pieColors.length - 1]).range(pieColors);
    var neighCoords = coordsGroup.all().map(function(d) {

        //Array with the 390 neighbourhoods and respective center coordinates
        //only need to access the data
        d.key[1] = +d.key[1];
        d.key[2] = +d.key[2];

        return {
        name: d.key[0],
        coord: [d.key[1], d.key[2]]
        };
    });

    //dispose the dimension and group not needed for interactive user filtering
    neighbourCoordsDim.dispose();
    coordsGroup.dispose();
    delete neighbourhoodsDim;
    delete neighbourhoodsDim2;
    delete coordsGroup;


    //Charts, number display, filterCount, and select menu
    var dcMap = dc.leafletChoroplethChart("#map-plot", groupName);
    var pie = dc.pieChart("#pie-plot", groupName);
    // var heatMap = dc.heatMap("#heat-plot", groupName);
    // var bubbleCloud = dc.bubbleCloud("#bubble-plot", groupName);
    // var totalDisplay = dc.numberDisplay("#number-stat", groupName);
    var neighbourSelections = dc.selectMenu("#select-container",groupName);
    var recordCounter = dc.dataCount("#records-count", groupName);

    //dataCount
    recordCounter.dimension(ndx)
                    .group(ndx.groupAll());
                // .html({some:'<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records.'});

    //selection menu
    neighbourSelections.dimension(neighbourhoodsDim)
                        .group(neighbourhoodGroup)
                        .multiple(false)
                        .numberVisible(11)
                        .controlsUseVisibility(true)
                        .title(function (d) {return d.key})
                        .filterDisplayed(function () {return true;}); // This should make sure values less than 1 are not removed from the selection menue


    //Leaflet Map
    //update colors and leaflet map legend with filtered data
    var choro = function() {

        //filtered data
        // var neighbourhoodsArray = neighbourhoodGroup.all();
        var neighbourhoodsArray = neighbourhoodGroupMap.all();

        var northEast = L.latLng(53.71784098729247, -113.170166015625);
        var southWest = L.latLng(53.39151868998397, -113.719482421875);
        var bounds = L.latLngBounds(southWest, northEast);

            return dcMap
                        .mapOptions({
                            center:[53.5550, -113.4450],
                            zoom: 10,
                            scrollWheelZoom: true,
                            maxBounds: bounds,
                            minZoom: 10
                        })
                        .dimension(neighbourhoodsDim2)
                        //.group(neighbourhoodGroup)
                        .group(neighbourhoodGroupMap)
                        .geojson(geojson)
                        .colors(mapColors)
                        .colorDomain([d3.min(neighbourhoodsArray, dc.pluck('value')),
                                    d3.max(neighbourhoodsArray, dc.pluck('value'))])
                        .colorAccessor(function(d) { return d.value; })
                        .featureKeyAccessor(function(feature) { return feature.properties.name; })
                        .legend(dc.leafletLegend().position('bottomright'));
    };


    //pie chart
    pie
        .dimension(neighbourIncomeDim)
        .group(incomeGroup)
        .radius(60)
        .innerRadius(40)
        .cx(320)
        .cy(90)
        .externalLabels(20)
        .label(function(d) {return ( d.value * 100 ).toFixed(1) + '%'; })
        .title(function(d) { return d.key + ': ' + ( d.value * 100 ).toFixed(1) + '%'; })
        .colorAccessor(function(d, i){return i;})
        .colors(pieScaleColors)
        .legend(dc.legend())
        .ordering(function(d) { return d.key; })
        .on('pretransition.legend', function(chart) {

            //https://github.com/dc-js/dc.js/blob/master/web/examples/pie-external-labels.html
            //solution for adding dynamic data to legend
            chart.selectAll('.dc-legend-item text')
                .text('')
                .append('tspan')
                .text(function(d) { return d.name; })
                .append('tspan')
                .attr('x', 200)
                .attr('text-anchor', 'end')
                // format value to display as percentage instead of decimal
                .text(function(d) { return ( d.data * 100 ).toFixed(1) + '%'; });
            })
        .on("renderlet.pie", function(chart) {

            //click to null, to not cause a duplicate for the leaflet legend
            d3.selectAll(".dc-legend-item").on("click", null);
            d3.selectAll("g.pie-slice path").on("click", null);
            d3.selectAll("g.pie-label-group text").on("click", null);
            });
    //the pie chart no to filter when clicked
    pie.filter = function() {};


    // //number display
    // totalDisplay
    //             .group(sumofAllInfractions)
    //             .valueAccessor(function(d) { return d; })
    //             .formatNumber(d3.format(","));


    choro(); //draw chropleth

    //Update choropleth if any of these charts gets filtered
    // var notGeojsonCharts = [heat(), bubbleCloud ,neighbourSelections];
    var notGeojsonCharts = [neighbourSelections];



    notGeojsonCharts.forEach(function(chart) {
        chart.on("filtered.notGeojson", function(chart, filter) {

            erase('div.leaflet-bottom.leaflet-right div');//remove previous choropleth legend
            choro();
        });
    });

    //the leaflet map can only be accessed after rendering of the dc choropleth
    //the map is in within the dc name space
    choro().on("renderlet.choro", function(choropleth, filter){

        //the leaflet map instance
        var map = choro().map();

        //black and white basemap
        var OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png');

        OpenStreetMap_BlackAndWhite.addTo(map);


        //after the neighbourhood selection has rendered add event listeners
        //listener to place marker and myinfo div on map
        neighbourSelections.on("renderlet.selectMenu", function(selectMenu, filter) {

            //retrives the name by get method
            //defined at values for charts
            var search = d3.map(neighCoords, function(d) { return d.name;});

            //neighbouhood options to add click listener
            var neighbourOptions = selectMenu.selectAll("option.dc-select-option");

            //select all option to delete marker and myinfo div
            var selectAllOption = selectMenu.select("select.dc-select-menu option");

            selectAllOption.on("click.selectAll", function(){

                erase('div.leaflet-top.leaflet-right div');//remove previous myinfo div
                erase("div.leaflet-marker-pane img");//remove previous marker
                erase("div.leaflet-shadow-pane img");//remove previous shade
            });


            neighbourOptions.on('click.option', function(d){

                //retrive coordinate of clicked neighbourhood
                //and use it to place the location marker
                var name = d.key;
                var lat = search.get(name).coord[0];
                var long = search.get(name).coord[1];

                var markerLocation = new L.LatLng( lat,long);
                var info = L.control();//myinfo div

                info.onAdd = function(map) {

                    this._div = L.DomUtil.create("div", "myinfo");
                    this.update();
                    return this._div;
                };

                info.update = function (props) {

                    this._div.innerHTML = name;
                };

                //not efficient and DRY(Don't Repeat Yourself)
                //potential solution construct and control a custom layer
                erase('div.leaflet-top.leaflet-right div');//remove previous myinfo div
                erase("div.leaflet-marker-pane img");//remove previous marker
                erase("div.leaflet-shadow-pane img");//remove previous shade

                info.addTo(map);

                var marker = L.marker(markerLocation).addTo(map);//marker
            });
        });
    });


    //to remove duplicate or previous divs
    var erase = function(selector) { d3.select(selector).remove(); };


    dc.renderAll(groupName);
}
