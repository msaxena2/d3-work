var percent_height = 150;
var percent_chart = d3.select("#medPercentGraph")
            .append("svg")
            .attr('width', width + (margins.left + margins.right))
            .attr('height', percent_height)
            .attr('class', "chart");

function append_percent(data){
    return String(data).concat(" %")
}
function draw_type_percent_chart(){
    var x, y;
    x = d3.scale.linear()
        .domain([0, 100])
        .range([0, (width - margins.right)]);

    y = d3.scale.ordinal()
         .domain(values)
         .rangeBands([margins.top, percent_height - (margins.bottom)], 0.2);

    ylabel = d3.scale.ordinal()
         .domain(labels)
         .rangeBands([margins.top, percent_height - (margins.bottom)], 0.2);

    var rect = percent_chart.selectAll("rect")
        .data(values);
        //enter
    rect.enter().append("rect")
        .attr("x", margins.left)
        .attr("y", height-margins.bottom)
        .attr("width", x)
        .attr("height", y.rangeBand());
        //update
    rect.transition()
        .duration(1000)
        .ease('bounce')
        .attr("x", margins.left)
        .attr("y", y)
        .attr("width", x)
        .attr("height", y.rangeBand());
        //exit
    rect
        .exit()
        .transition()
        .duration(1000)
        .ease("bounce")
        .attr("y", percent_height+margins.top + margins.bottom)
        .remove();



    var score = percent_chart.selectAll(".score")
          .data(values);

    //enter selection
    score.enter().append("text")
        .attr('class', 'score')
        .attr("x", function(d){ return x(d) + margins.left})
        .attr("y", percent_height )
        .attr("dx", -5)
        .attr("dy", ".36em")
        .attr("text-anchor", "end")
        .text(String);
    //update selection
    score
        .transition()
        .duration(1000)
        .ease('bounce')
        .attr("x", function(d){ return x(d) + margins.left})
        .attr("y", function(d){ return y(d)+ y.rangeBand()/2} )
        .attr("dx", -5)
        .attr("dy", ".36em")
        .attr("text-anchor", "end")
        .text(append_percent);
    //exit selection
    score.exit()
    .transition()
    .duration(1000)
    .ease("bounce")
    .attr("y", percent_height+margins.top + margins.bottom)
    .remove();



    var label = percent_chart.selectAll(".label")
          .data(labels);
    //enter selection
    label.enter().append("text")
        .attr('class', 'label')
        .attr("x", 10)
        .attr("y", percent_height)
        .attr("dx", -5)
        .attr("dy", ".36em")
        .attr("text-anchor", "begin")
        .text(String);
    //update selection
    label
        .transition()
        .duration(1000)
        .ease('bounce')
          .attr("x", 10)
          .attr("y", function(d){ return ylabel(d)+ ylabel.rangeBand()/2} )
          .attr("dx", -5)
          .attr("dy", ".36em")
          .attr("text-anchor", "begin")
          .text(String);
    //exit selection
    label.exit()
    .transition()
    .duration(1000)
    .ease("bounce")
    .attr("y", percent_height+margins.top + margins.bottom)
    .remove();


}
