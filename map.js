var map = L.map('map', {
    maxZoom: 12,
}).setView([49.7417517, 15.3350758], 6);

//map.scrollWheelZoom.disable()

L.tileLayer('https://samizdat.cz/tiles/ton_b1/{z}/{x}/{y}.png', {
    attribution: 'mapová data © přispěvatelé <a target="_blank" href="http://osm.org">OpenStreetMap</a>, obrazový podkres <a target="_blank" href="http://stamen.com">Stamen</a>, <a target="_blank" href="https://samizdat.cz">Samizdat</a>',
    maxZoom: 12,
}).addTo(map);

var labels = L.tileLayer('https://samizdat.cz/tiles/ton_l2/{z}/{x}/{y}.png')

var idx = {
    0: {'Color': 'FFFFFF', 'ColorText': '000000', 'Description': 'neúplná data'},
    1: {'Color': '4393c3', 'ColorText': '000000', 'Description': 'velmi dobrá'},
    2: {'Color': 'fddbc7', 'ColorText': '000000', 'Description': 'dobrá'},
    3: {'Color': 'f4a582', 'ColorText': '000000', 'Description': 'uspokojivá'},
    4: {'Color': 'd6604d', 'ColorText': '000000', 'Description': 'vyhovující'},
    5: {'Color': 'b2182b', 'ColorText': 'FFFFFF', 'Description': 'špatná'},
    6: {'Color': '67001f', 'ColorText': 'FFFFFF', 'Description': 'velmi špatná'}
};

var colors = {
    'NO2': 'rgba(228,26,28, .5)',
    'CO': 'rgba(55,126,184, .5)',
    'PM10': 'rgba(77,175,74, .5)',
    'PM2_5': 'rgba(152,78,163, .5)',
    'O3': 'rgba(255,127,0, .5)'
};

function stationColor(val) {
    if (val <= 1.2118) {return '#2c7bb6'}
    else if (val <= 1.7290) {return '#abd9e9'}
    else if (val <= 2.0614) {return '#ffffbf'}
    else if (val <= 2.4012) {return '#fdae61'}
        else {return '#d7191c'}
};

$.getJSON('data/stations.json', function(data) {
    $.each(data, function(key, val){
        var ccle = L.circleMarker(L.latLng(val.lat, val.lon), {
            radius: 9,
            weight: 1,
            opacity: 0.5,
            color: '#737373',
            fillColor: stationColor(val.ix),
            fillOpacity: 0.6,
            stationId: key,
            vals: val
        })
        ccle.addTo(map)
        ccle.on('click', function(e) {
            console.log()
            drawChart(e.target.options.stationId, e.target.options)
        })
    })
    labels.addTo(map);
});

function drawChart(stationId, details) {
    $.getJSON('data/' + stationId + '.json', function(data) {
        var pol = {};
        Object.keys(data).forEach(function(key) {
            var date = key;
            Object.keys(data[key]).forEach(function(polKey) {
                if (!(polKey in pol)) {
                    pol[polKey] = [];
                };
                if (data[key][polKey] !== null) {
                    var d = date.split('.');
                    pol[polKey].push([Date.UTC(parseInt(d[2]), parseInt(d[1]) - 1, parseInt(d[0])) - 1, data[key][polKey]]);
                }; 
            })
        });

        series = [];
        Object.keys(pol).forEach(function(key){
            if (pol[key].length > 0) {
                series.push({
                    'name': key.replace('_', '.'),
                    'color': colors[key],
                    'data': pol[key]
                })
            }
        });
        Highcharts.chart('bchart', {
            chart: {
                type: 'scatter'
            },
            credits: {
                enabled: false
            },
            title: {
                text: 'Stanice ' + details.vals.name + ', kraj ' + details.vals.region_name+ ', ' + details.vals.state_name
            },
            subtitle: {
                text: 'Průměrná úroveň znečištění: ' + Math.round(details.vals.ix) + ' (' + idx[Math.round(details.vals.ix)].Description + ')'
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %m. %Y',
                    year: '%Y'
                },
                title: {
                    text: 'datum'
                }
            },
            yAxis: {
                title: {
                    text: 'znečištění'
                },
                min: 0
            },
            tooltip: {
                headerFormat: '<b>Částice {series.name}</b><br>',
                pointFormat: '{point.x:%e. %m. %Y}: {point.y:.2f} µg/m³'
            },

            plotOptions: {
                scatter: {
                    marker: {
                        radius: 4,
                        symbol: 'circle',
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                }
            },
            series: series
        });
    });
};