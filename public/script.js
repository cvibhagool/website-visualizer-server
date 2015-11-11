$(function(){
  //Generate the box
  generateBox();
  //Grab the place holder website
  $.ajax({
    method: "POST",
    url: "/crawl",
    data: { url : "http://benv.io"},
    dataType: 'json'
  })
  .done(function(data) {
    updateGraph(data);
  });

  //Wait for a user submission
  $( ".submit" ).click(function(e) {
    e.preventDefault();
    $('.info').show();
    $('.failure').hide();
    $.ajax({
      method: "POST",
      url: "/crawl",
      data: { url : $("#url-value").val()},
      dataType: 'json'
    }).done(function(data) {
      updateGraph(data);
    }).fail(function(error) {
      $('.failure').show();
    });
  });
});

var generateBox = function(){
  var width = 960;
  var height = 600;

  var header = d3.select(".row").append("div")
    .attr("class","col-md-8 col-md-offset-2 centered")
    .append("h2")
    .append("a")
    .attr("id", "url-header");

  var svg = d3.select(".row").append("svg")
    .attr("width", width)
    .attr("height", height);
};

var updateGraph = function(mapData){
  var url = mapData.url;
  var data = mapData.map;

  var width = 800;
  var height = 400;
  var header = d3.select("#url-header")
    .text(url)
    .attr('href',url);

  var svg = d3.select("svg");

  var force = d3.layout.force()
      .gravity(0.05)
      .distance(50)
      .size([width, height]);

  var edges = [];
    data.links.forEach(function(e) { 
    var sourceNode = data.nodes.filter(function(n) { return n.url === e.referer; })[0],
    targetNode = data.nodes.filter(function(n) { return n.url === e.url; })[0];
    if ((sourceNode !== undefined) && (targetNode !== undefined)){
      edges.push({source: sourceNode, target: targetNode, value: 0});
    }
  });

  force
      .nodes(data.nodes)
      .links(edges)
      .charge(-500)
      .start();

  var link = svg.selectAll(".link")
      .data(edges, function(d){
        return d.source.url + "_" + d.target.url;
      });

    link.enter().append("line")
      .attr("class", "link");

  var node = svg.selectAll(".node")
      .data(data.nodes, function(d){
        return d.url;
      });

    node.enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  var colorScale = d3.scale.category10();

  node.append("circle")
      .attr("class", "node")
      .attr('fill', function(d){ return colorScale(d.depth); })
      .attr("r", function(d){return 20 - 3*d.depth;});
      
  node.append("svg:text")
      .attr("class", "nodetext")
      .attr("dx", 12)
      .attr("dy", "-5")
      .text(function(d) { return d.url; });
      
  node.on("dblclick", function(d){
        window.location = d.url;
      });

  //Remove old nodes
  node.exit()
      .transition()
      .duration(500)
      .style("fill-opacity", 1e-6)
      .remove();

  link.exit()
      .transition()
      .duration(500)
      .style("fill-opacity", 1e-6)
      .remove();

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
  $('.info').hide();
};