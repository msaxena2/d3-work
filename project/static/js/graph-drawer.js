/** js file responsible for drawing all the d3 and rickshaw graphs
*   To add a graph, add the object to the global space, and then add the graph
*   drawing function.
**/

//globals
var pJson;
var pie = d3.layout.pie();
var begin_year;
var end_year;
//Width and height
var bar_w = $("#class-bar-chart").width();
var bar_h = bar_w - 50;
var line_w = bar_w;
var line_h = bar_h; 
var pi_w = $("#speciality_piechart").width() - 80;
var pi_h= pi_w;
var radar_w = $("#class-bar-chart").width() - 60;
var radar_h = radar_w;
var bubble_w = $("#chart_510").width();
var bubble_h = bubble_w/2;
var color = d3.scale.category10();
var outerRadius = pi_w / 2;
var innerRadius = 0;
var arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);
//references to various charts. Can be used later for modification/resizing on update etc.
var radar_svg;
var bar_graph;
var recalls_chart;
var radar_chart;
var preview;
var circle_radius = bubble_h;
var rad_510;
var format = function(n) {

    var map = {
    0: '2007',
    1: '2008',
    2: '2009',
    3: '2010',
    4: '2011',
    5: '2012'
    };

    return map[n];
}

function ajax_caller(){
    $.ajax({
    // the URL for the request
    url: "backend/csv_processor.php",

    type: "GET",
    // the type of data we expect back
    dataType : "json",
    // code to run if the request succeeds;
    // the response is passed to the function
    success: function( json ) {
        $('#controls').show();
        $('#main-graph-container').show();
        $('#wait-div').hide();
        pJson=json;
        begin_year = pJson["StartYear"];
        end_year = pJson["EndYear"];
        draw_charts(begin_year, end_year);

        
    },

    });
}

//function to set slider ticks
function set_slider_ticks(){
    var $slider =  $('#timeline');
    var max =  $slider.slider("option", "max");    
    var spacing =  $slider.width() / (max);

    $slider.find('.ui-slider-tick-mark').remove();
        for (var i = 0; i <= max ; i++) {
            $('<span class="ui-slider-tick-mark"></span>')
                .text(pJson["StartYear"]+i)
                .css('left', ((spacing * i)-5) + 'px')
                .appendTo($slider);                    
        }
}

//function to calculate data for radar graph
function calculate_radar_data(begin_year_index, end_year_index){
    data = [];
    for (cls = 1; cls <= 3; ++cls){
        var data_obj = {
                    className: String(cls),
                    axes:[]
                  };
    
        for (year = (begin_year + begin_year_index); year <= (begin_year + end_year_index); ++year){
            //class 1
            var total_recall_time = pJson["Data"][year]["SeverityClassCounts"][cls]["TerminationTime"];
            var merged_count = pJson["Data"][year]["SeverityClassCounts"][cls]["RecallEvents"];
            var average = total_recall_time / merged_count;
            var axis_obj = {
                                axis: String(year),
                                value: average
                           };
            data_obj.axes.push(axis_obj);
        }
        data.push(data_obj);
    }
    return data;
}

//radar chart drawing fucntion
function draw_radar_chart(begin_year_index, end_year_index){
    //remove prevoius chart
    d3.select("#radar_chart svg").remove();
    //redraw the chart with new data. The Chart needs to be redrawn since the 
    // the layout of the chart changes completely
    var data = calculate_radar_data(begin_year_index, end_year_index);
    radar_chart = RadarChart.chart();
    radar_chart.config({w: radar_w, h:radar_h});
    radar_svg = d3.select("#radar_chart").append('svg')
                        .attr("width", radar_w)
                        .attr("height", radar_h);

    radar_svg.append('g').classed('single', 1).datum(data).call(radar_chart);

}
function process_bubble_data(begin_year, end_year, bubble_class){
	var total = 0;
	var recall_array = [0, 0, 0]
	for (year = begin_year; year <= end_year; ++year){
		recall_array[0] += pJson["Data"][year]["SubmissionType"][bubble_class]["ClassI"];
        recall_array[1] += pJson["Data"][year]["SubmissionType"][bubble_class]["ClassII"];
        recall_array[2] += pJson["Data"][year]["SubmissionType"][bubble_class]["ClassIII"];
        total += recall_array[0];
        total += recall_array[1];
        total += recall_array[2];
	}
	return recall_array.map(function(type_total){
		return type_total/total;
	});
}
//data processing function for the pi chart
function calculate_percentages(begin_year, end_year){
    var percentage_array = [0, 0, 0, 0, 0, 0];
    var total_recalls = 0;
    for(year = begin_year; year <= end_year; ++year){
        total_recalls += pJson.Data[year].ComputerClassRecalls;
        for(i =0 ; i < pJson.SpecialityLabels.length; ++i){
            speciality_label = pJson.SpecialityLabels[i];
            percentage_array[i] += pJson.Data[year].SpecialityCounts[speciality_label].RecallEvents;
        }
    }
    return percentage_array.map(function(total){
        return Math.round((total/total_recalls) * 10000) / 100;
    })
}

function process_piechart(begin_index, end_index){
    var start_year = parseInt(begin_index + pJson["StartYear"]);
    var end_year = parseInt(end_index + pJson["StartYear"]);
    var percentages = calculate_percentages(start_year, end_year);
    redraw_piechart(percentages);
}

function calculate_bubble_radii(begin_year, end_year){
    var recalls_count = [0, 0, 0];
    for (year = begin_year; year <= end_year; ++year){
        recalls_count[0] += pJson["Data"][year]["SubmissionType"]["510(k)"]["RecallEvents"];
        recalls_count[1] += pJson["Data"][year]["SubmissionType"]["510(K) Exempt"]["RecallEvents"];
        recalls_count[2] += pJson["Data"][year]["SubmissionType"]["PMA"]["RecallEvents"];
    }
    var total = 0;
    for(var i = 0;i < recalls_count.length; ++i){
        total += recalls_count[i];
    }
    return recalls_count.map(function(count){
        return Math.sqrt((count/total)) * circle_radius;
    });
}
function bubble_counts(begin_year, end_year){
    console.log("here");
    var recalls_count = [0, 0, 0];
    for (year = begin_year; year <= end_year; ++year){
        recalls_count[0] += pJson["Data"][year]["SubmissionType"]["510(k)"]["RecallEvents"];
        recalls_count[1] += pJson["Data"][year]["SubmissionType"]["510(K) Exempt"]["RecallEvents"];
        recalls_count[2] += pJson["Data"][year]["SubmissionType"]["PMA"]["RecallEvents"];
    }
    $("#chart_510_text").html("510(k): "+recalls_count[0]);
    $("#chart_510_Exempt_text").html("510(k): "+recalls_count[1]);
    $("#chart_PMA_text").html("PMA: "+recalls_count[2]);
}
function draw_class_bar_chart(begin_year, end_year){
    var computer_related_recalls = 0;
    var non_computer_related_recalls = 0;
    var computer_related_recalls_stack = [];
    var not_computer_related_recalls_stack = [];
    for(year = begin_year; year <= end_year; ++year){
            computer_related_recalls_stack.push({x: year - begin_year, y : pJson.Data[year].ComputerClassRecalls});
            not_computer_related_recalls_stack.push({x: year - begin_year, y : pJson.Data[year].NotComputerClassRecalls});
    }
    bar_graph = new Rickshaw.Graph( {
        element: document.querySelector("#class-bar-chart"),
        renderer: 'bar',
        stack: false,
        width: bar_w,
        height: bar_h,
        veiwBox: '0 0 350 300',
        preserveAspectRatio: 'xMinYMin meet',
        padding: {left: 0.15, right: 0.04, bottom: 0.10},
        series: [{
                data: computer_related_recalls_stack,
                color: color(0),
                name: 'Computer Related Recalls',
                renderer: 'bar',
        }, {
                data: not_computer_related_recalls_stack,
                color: color(1),
                name: 'Not Computer Related Recalls',
                renderer: 'bar',
        }
        ],
        
    });
    var x_ticks = new Rickshaw.Graph.Axis.X( {
    graph: bar_graph,
    orientation: 'top',
    tickFormat: format
    } );

    var yAxis = new Rickshaw.Graph.Axis.Y({
        graph: bar_graph,
        ticks: 12
    });

    yAxis.render();


    
    var legend = new Rickshaw.Graph.Legend( {
    graph: bar_graph,
    element: document.getElementById('legend')

    } );

    bar_graph.render();
}

function draw_recalls_line_chart(begin_year, end_year){

    var radiology_stack = [], cardiovascular_stack = [],
        orthopedic_stack = [], general_hospital_stack = [],
        clinical_chemistry_stack = [], plastic_surgery_stack = [];

    for(year = begin_year; year <= end_year; ++year){
        radiology_stack.push({x: year  - begin_year, y : pJson.Data[year].SpecialityCounts["Radiology"].MergedCount});
        cardiovascular_stack.push({x: year  - begin_year, y : pJson.Data[year].SpecialityCounts["Cardiovascular"].MergedCount});
        orthopedic_stack.push({x: year  - begin_year, y : pJson.Data[year].SpecialityCounts["Orthopedic"].MergedCount});
        general_hospital_stack.push({x: year  - begin_year, y : pJson.Data[year].SpecialityCounts["General Hospital"].MergedCount});
        clinical_chemistry_stack.push({x: year  - begin_year, y : pJson.Data[year].SpecialityCounts["Clinical Chemistry"].MergedCount});
        plastic_surgery_stack.push({x: year  - begin_year, y : pJson.Data[year].SpecialityCounts["General & Plastic Surgery"].MergedCount});
    }
    recalls_chart = new Rickshaw.Graph( {
        element: document.querySelector("#total-recalls-chart"),
        renderer: 'line',
        width: line_w,
        height: line_h,
        padding: {left: 0.15, right: 0.04, bottom:0.10},
        interpolation: 'linear',
        series: [{
                data: radiology_stack,
                color: color(0),
                name: "Radiology"
            },
            {
                data: cardiovascular_stack,
                color: color(1),
                name: "Cardiovascular",
            },
            {
                data: orthopedic_stack,
                color: color(2),
                name: "Anesthesiology"
            },
            {
                data: general_hospital_stack,
                color: color(3),
                name: "Genral Hospital"
            },
            {
                data: clinical_chemistry_stack,
                color: color(4),
                name: "Clinical Chemistry"
            },
            {
                data: plastic_surgery_stack,
                color: color(5),
                name: "Hematology"
            }

        ],
        
    });

    var x_ticks = new Rickshaw.Graph.Axis.X( {
        graph: recalls_chart,
        orientation: 'top',
        tickFormat: format
    } );

    var yAxis = new Rickshaw.Graph.Axis.Y({
        graph: recalls_chart,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        ticks: 12
    });
    yAxis.render();
    recalls_chart.render();
    
    
}
function redraw_piechart(dataset){
    /*
    var paths = d3.selectAll("#speciality_piechart .arc path");
    paths.data(pie(dataset2))
         .attr("d", arc);
    var text = d3.selectAll("#speciality_piechart .arc text");
    text.remove();
    var arcs = d3.selectAll("#speciality_piechart .arc");
    arcs.append("text")
    .attr("transform", function(d) {
        return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .classed('pi_label', true)
    .text(function(d) {
        return d.value + " %";
    });*/
    d3.select("#speciality_piechart svg").remove();
    var svg = d3.select("#speciality_piechart")
            .append("svg")
            .attr("width", pi_w)
            .attr("height", pi_h);
            /*
            .attr("viewBox", ("0 " + "0 " + String(pi_w) + " " + String(pi_h)))
            .attr("preserveAspectRatio", "none");*/

    //Set up groups
    var arcs = svg.selectAll("g.arc")
              .data(pie(dataset))
              .enter()
              .append("g")
              .attr("class", "arc")
              .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    //Draw arc paths
    arcs.append("path")
    .attr("fill", function(d, i) {
        return color(i);
    })
    .attr("d", arc);

    //Labels
    arcs.append("text")
    .attr("transform", function(d) {
        return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .classed('pi_label', true)
    .text(function(d) {
        return d.value + " %";
    });

}
function draw_piechart(begin_year, end_year){
     var dataset = calculate_percentages(begin_year, end_year);
    //Create SVG element
    var svg = d3.select("#speciality_piechart")
            .append("svg")
            .attr("width", pi_w)
            .attr("height", pi_h);
            /*
            .attr("viewBox", ("0 " + "0 " + String(pi_w) + " " + String(pi_h)))
            .attr("preserveAspectRatio", "none");*/

    //Set up groups
    var arcs = svg.selectAll("g.arc")
              .data(pie(dataset))
              .enter()
              .append("g")
              .attr("class", "arc")
              .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    //Draw arc paths
    arcs.append("path")
    .attr("fill", function(d, i) {
        return color(i);
    })
    .attr("d", arc);

    //Labels
    arcs.append("text")
    .attr("transform", function(d) {
        return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .classed('pi_label', true)
    .text(function(d) {
        return d.value + " %";
    });
}

function draw_timeline(){
    preview = new Rickshaw.Graph.RangeSlider({
        //hack since d3 graphs controlled from rickshaw.js. Fix later.
        graph: [bar_graph, recalls_chart],
        element: document.querySelector('#timeline'),

    });
}
function init_radar_chart(begin_year, end_year){
    data = calculate_radar_data(0, end_year - begin_year);
    radar_chart = RadarChart.chart();
    radar_chart.config({w: radar_w, h:radar_h});
    var radar_svg = d3.select("#radar_chart").append('svg')
                    .attr("width", radar_w)
                    .attr("height", radar_h);
    radar_svg.append('g').classed('single', 1).datum(data).call(radar_chart);
}

function draw_bubbles_chart(begin_year_index, end_year_index){
	var radii = calculate_bubble_radii(begin_year, end_year);
		draw_bubble(begin_year, end_year, "510(k)", radii[0]);
	draw_bubble(begin_year, end_year, "510(K) Exempt", radii[1]);
	draw_bubble(begin_year, end_year, "PMA", radii[2]);
    bubble_counts(begin_year, end_year);
	
}
function update_bubbles_chart(begin_year_index, end_year_index){
	/** remove original charts. Again necessary since the charts aren't being updated 
	** in this case. The radius of the circles will change, hence circles are 
	** redrawn, and the pie proportions changed. Change this in the future.
	**/
	d3.select("#chart_510 svg").remove();
	d3.select("#chart_510_Exempt svg").remove();
	d3.select("#chart_PMA svg").remove();
	//redraw
	var cur_begin_year = begin_year + begin_year_index;
	var cur_end_year = begin_year + end_year_index;
	var radii = calculate_bubble_radii(cur_begin_year, cur_end_year);
	draw_bubble(cur_begin_year, cur_end_year, "510(k)", radii[0]);
	draw_bubble(cur_begin_year, cur_end_year, "510(K) Exempt", radii[1]);
	draw_bubble(cur_begin_year, cur_end_year, "PMA", radii[2]);
    bubble_counts(cur_begin_year, cur_end_year);
	
}
function draw_charts(begin_year, end_year){
    draw_class_bar_chart(begin_year, end_year);
    draw_recalls_line_chart(begin_year, end_year);
    draw_piechart(begin_year, end_year);
    init_radar_chart(begin_year, end_year);
    draw_timeline();
    set_slider_ticks();
    draw_bubbles_chart(begin_year, end_year)
 //   draw_bubble_chart(begin_year, end_year);

}
function draw_bubble(begin_year, end_year, bubble_class, radius){
	var cur_arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(radius);
	var data = process_bubble_data(begin_year, end_year, bubble_class);
    var id;
    if(bubble_class == "510(k)"){
    	id = "chart_510";
    	rad_510 = radius;
    }
    else if(bubble_class == "510(K) Exempt"){
    	id = "chart_510_Exempt";
    }
    else{
    	id = "chart_" + bubble_class;
    }
    var svg = d3.select("#"+id)
            .append("svg")
            .attr("width", (radius*2)+10)
            .attr("height", (circle_radius*2)+10);
    //Set up groups
    var arcs = svg.selectAll("g.arc")
              .data(pie(data))
              .enter()
              .append("g")
              .attr("class", "arc");
    if (bubble_class == "510(k)"){
    	arcs.attr("transform", "translate(" + radius + "," + radius + ")");
    }
    else{
    	arcs.attr("transform", "translate(" + radius + "," + rad_510 + ")");
    }

    //Draw arc paths
    arcs.append("path")
    .attr("fill", function(d, i) {
        return color(i);
    })
    .attr("d", cur_arc);

    
}
$("#main-graph-container").hide();
$("#controls").hide();
//make the main ajax call
$( function(){
    ajax_caller();
    $('a[href^="#"]').on('click',function (e) {
        e.preventDefault();

        var target = this.hash,
        $target = $(target);

        $('html, body').stop().animate({
            'scrollTop': $target.offset().top
        }, 900, 'swing', function () {
            window.location.hash = target;
        });
    });
});
