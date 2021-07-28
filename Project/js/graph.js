var margin = {top: 20, right: 20, bottom: 30, left: 40}; // to memorize the margins

var height = 1000;
var width = 1500;

// Types of edge
var edgeTypes = ["parent", "parentOf", "killedBy", "marriedTo", "isSibling","samePersonOf","affair","collegueOf","isLookingFor"];
// Types of family
var familyTypes = ["Kahnwald", "Nielsen", "Doppler", "Tiedeman", "Others"];


// Id of the person that change images on click
var multiplePersons = new Set(); 
multiplePersons.add(102).add(103).add(104).add(105).add(106).add(108).add(111).add(112);
multiplePersons.add(114).add(116).add(118).add(122).add(123).add(125).add(126).add(131);
multiplePersons.add(132).add(204).add(205).add(208).add(211).add(212).add(218).add(225); 
multiplePersons.add(232).add(2).add(3).add(4).add(5).add(6).add(8).add(11).add(12).add(14);
multiplePersons.add(16).add(18).add(22).add(23).add(25).add(26).add(31).add(32); 


// Limit the nodes movements
var radius = 50; 

//Import data from json file
var graph; 

d3.json("data/graph.json", function(error, g) {
  if (error) throw error;
  graph = g; 
  intializeGraph();  
  initConfiguration(); 
  addEventListenerOnButtons(); 
});


var svg = d3.select("body").append("svg")
    .attr("width", width)     
    .attr("height", height);


// Set the svg background with an image
var defs = svg.append("defs");

defs.append('pattern')
		.attr("id", "background")
		.attr("width", 1)
		.attr("height", 1)
		.append("svg:image")
		.attr("xlink:href", "image_resized/" + "back.png")
		.attr("width", width)
		.attr("height", height)
		.attr("y", 0)
		.attr("x", 0);

svg.append("rect")
    .attr("width", width+50)
    .attr("height", height)
    .attr("fill", "url(#background)");



//Fill nodes with image -> 1 pattern = 1 node background
for (i=1; i<=36; i++){
  // 21 is missing
	if(i == 21){
		continue; 
	}

	defs.append('pattern')
		.attr("id", i)
		.attr("width", 1)
		.attr("height", 1)
		.append("svg:image")
		.attr("xlink:href", "image_resized/" + i + ".jpg")
		.attr("width", 100)
		.attr("height", 100)
		.attr("y", 0)
		.attr("x", 0);
}


//Pattern for nodes that change image
multiplePersons.forEach(function(d){
  defs.append('pattern')
    .attr("id", d)
    .attr("width", 1)
    .attr("height", 1)
    .append("svg:image")
    .attr("xlink:href", "image_resized/" + d + ".jpg")
    .attr("width", 100)
    .attr("height", 100)
    .attr("y", 0)
    .attr("x", 0);
});


//Marker edges: cycle for -> change color of marker-end
for (const elem of edgeTypes){
	var marker = svg
          .append("svg:defs")
          .selectAll("marker")
          .data(["end"])
          .enter()
          .append("svg:marker")
          .attr("id", elem)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 34)
          .attr("refY", -2)
          .attr("markerWidth", 5)
          .attr("markerHeight", 5)
          .attr("orient", "auto")
          .attr("fill", getEdgeColor(elem))
          .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");
}

//Different marker-end for loop (suicide)
var markerSuicide = svg
          .append("svg:defs")
          .selectAll("marker")
          .data(["end"])
          .enter()
          .append("svg:marker")
          .attr("id", "suicide")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 26)
          .attr("refY", -35)
          .attr("markerWidth", 5)
          .attr("markerHeight", 5)
          .attr("orient", "auto")
          .attr("fill", "red")
          .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");



//Setting force directed parameter
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id;}))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(70));


var linkGroup, nodeGroup, node, nodes, link, links, newNodes, newEdges; 
var types = new Set(edgeTypes);
var typesFamily = new Set(familyTypes);


//Draw all nodes and all edges -> nodes are circle, edges are path (curved lines)
function intializeGraph(){

	newNodes = graph.nodes;
  newEdges = graph.edges;  

	//Draw edges
	linkGroup = svg.append("g").attr("class", "links"); 
	var links = linkGroup.selectAll("path").data(newEdges); 
	links.exit().remove(); 
	link = links.enter().append("path")
				  .attr("fill", "transparent")
				  .attr("stroke", function(d) { return getEdgeColor(d);})
				  .attr("stroke-width", 4)
				  .attr('marker-end',function(d) { if(d.source != d.target){ return "url(#" + d.type + ")"} else{return "url(#suicide)"}});


	//Draw nodes
  nodeGroup = svg.append("g").attr("class", "nodes"); 
	var nodes = nodeGroup.selectAll("circle").data(newNodes); 
  nodes.exit().remove(); 
	node = nodes.enter().append("circle")
      .attr("r", 50)
      .attr("fill", function(d) { return "url(#" + d.id + ")" })
      .attr("stroke", function(d) { if(d.timeTraveller == true){return "#b300b3"} else{ return "#bfbfbf"}})
      .attr("stroke-width", function(d) { if(d.timeTraveller == true){return "3px"} else{ return "2px"}})
      .call(d3.drag()
      	.on("start", dragstarted)
      	.on("drag", dragged)
        .on("end", dragended));

	node.append("title")
	   .text(function(d) { return d.name;});

	simulation.nodes(graph.nodes)
	   .on("tick", ticked);

	simulation.force("link")
	    .links(graph.edges)
	    .distance(400);
}


// Initial graph configuration
function initConfiguration(){
    filterNodes(2019); //start with all nodes in 2019
    filterEdges(); 
    //Check only one type of edges -> parent
    d3.selectAll("input").each(function(d){ 
      if(d3.select(this).attr("id") == "parentType")
        d3.select(this).node().checked = true;
    });
    //Check all families
    d3.selectAll("input").each(function(d){
      if(d3.select(this).attr("class") == "familyCheck")
        d3.select(this).node().checked = true;
    });
    updateEdges(); //only parent type
    drawLabel(2019); 
}


function ticked() {
    link.attr("d", function(d) {
      //Loop
    	if(d.source.x == d.target.x && d.source.y == d.target.y){
    		xRotation = -30;
        	largeArc = 1;
        	drx = 50;
        	dry = 50;
        	x2 = d.target.x + 1;
        	y2 = d.target.y + 1;
        	return "M" + d.source.x + "," + d.source.y + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + 1 + " " + x2 + "," + y2;
    	}
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            d.target.x + "," + 
            d.target.y;
    });

    node
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
}


//Filter nodes looking at "Edge filtering" and "Family filtering"
function filterNodes(year){
  if(year == "ALL YEARS"){
      newNodes = graph.nodes.filter( function(n) { 
      return typesFamily.has(n.family); //All year but only nodes of selected families 
    });
  }
  else{
    newNodes = graph.nodes.filter( function(n) { 
      return (n["years"].includes(year) && typesFamily.has(n.family)); //Nodes of selected year and selected families
    });  
  }
}

//Draw edges of the remaining nodes
function filterEdges(){
	var nodeIds = newNodes.map(function(n) {
		return n.id; 
	});

	newEdges = graph.edges.filter( function(e) {
			return (nodeIds.includes(e.source.id) && nodeIds.includes(e.target.id) && types.has(e.type)); 
    }); 
}


//Draw year label in the svg
function drawLabel(year){
  if(year == "ALL YEARS"){
    svg.append("text").attr("class", "lab")
     .attr("transform", "rotate(0)")
       .attr("y", 70)
       .attr("x", 30)
       .attr("font-size","40px")
       .style("font-weight", 700)
       .attr("fill", "white")
       .text(year);

  }else{
      svg.append("text").attr("class", "lab")
     .attr("transform", "rotate(0)")
       .attr("y", 70)
       .attr("x", 30)
       .attr("font-size","50px")
       .style("font-weight", 700)
       .attr("fill", "white")
       .text(year);
  }
}

//Current year selected in the legend
var currentYear = 2019;

//Interaction with users
function addEventListenerOnButtons(){

	var button = d3.select(".filter-btn-1953");
	button.on("click", function(d){
    currentYear = 1953;
    filterNodes(currentYear); 
    filterEdges(); 
		redraw(); 
		redraw();
		svg.selectAll(".lab").remove(); //Remove prev label
		drawLabel(1953); 
  });

  button = d3.select(".filter-btn-1986");
	button.on("click", function(d){
    currentYear = 1986;
    filterNodes(currentYear);  
    filterEdges(); 
		redraw(); 
		redraw(); 
		svg.selectAll(".lab").remove();
		drawLabel(1986); 
  });

  button = d3.select(".filter-btn-2019");
	button.on("click", function(d){
    currentYear = 2019;
    filterNodes(currentYear);  
    filterEdges(); 
		redraw(); 
		redraw();
		svg.selectAll(".lab").remove();
		drawLabel(2019); 
  });

  button = d3.select(".filter-btn-2052");
	button.on("click", function(d){
    currentYear = 2052;
    filterNodes(currentYear);  
    filterEdges(); 
		redraw(); 
		redraw();
		svg.selectAll(".lab").remove();
		drawLabel(2052); 
  });

  button = d3.select(".filter-btn-all");
  button.on("click", function(d){
    currentYear = "ALL YEARS"
    filterNodes(currentYear); 
    filterEdges(); 
    redraw(); 
    redraw();
    svg.selectAll(".lab").remove();
    drawLabel("ALL YEARS"); 
  });
}


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}


//Setting edges and markers-end colors
function getEdgeColor(d){
	if(d.type == "parent" || d == "parent"){
		return "#0066ff"  //blue
	}
	if(d.type == "parentOf" || d == "parentOf"){
		return "#00cc00";  //green
	}
	if(d.type == "killedBy" || d == "killedBy"){
		return "red"; 
	}
	if(d.type == "marriedTo" || d == "marriedTo"){
		return "#ffb3da"; //pink
	}
	if(d.type == "isSibling" || d == "isSibling"){
		return "yellow"; 
	}
	if(d.type == "samePersonOf" || d == "samePersonOf"){
		return "white"; 
	}
	if(d.type == "affair" || d == "affair"){
		return "#FFAA1D";  //orange
	}
	if(d.type == "collegueOf" || d == "collegueOf"){
		return "#b300b3";  //purple
	}
	if(d.type == "isLookingFor" || d == "isLookingFor"){
		return " #663300";  //brown
	}
}


//Selected edges type in legend
function updateEdges(){

    types = new Set();

    if(d3.select("#parentType").property("checked")){
    	types.add("parent");    	
    }
    if(d3.select("#parentOfType").property("checked")){
    	types.add("parentOf");    	
    }
    if(d3.select("#killedByType").property("checked")){
    	types.add("killedBy");
    }
    if(d3.select("#marriedToType").property("checked")){
    	types.add("marriedTo");
    }
    if(d3.select("#isSiblingType").property("checked")){
    	types.add("isSibling");
    }
    if(d3.select("#samePersonOfType").property("checked")){
    	types.add("samePersonOf");
    }
    if(d3.select("#affairType").property("checked")){
    	types.add("affair");
    }
        if(d3.select("#collegueOfType").property("checked")){
    	types.add("collegueOf");
    }
        if(d3.select("#isLookingForType").property("checked")){
    	types.add("isLookingFor");
    }
    console.log(types);
    filterEdges();
    redraw();
    redraw();
}

//Looking at selected edges type in legend
d3.selectAll(".houseCheck").on("change",updateEdges);


function updateFamily(){

    typesFamily = new Set();

    if(d3.select("#familyKahnwald").property("checked")){
      typesFamily.add("Kahnwald");      
    }
    if(d3.select("#familyNielsen").property("checked")){
      typesFamily.add("Nielsen");      
    }
    if(d3.select("#familyDoppler").property("checked")){
      typesFamily.add("Doppler");
    }
    if(d3.select("#familyTiedeman").property("checked")){
      typesFamily.add("Tiedeman");
    }
    if(d3.select("#familyOthers").property("checked")){
      typesFamily.add("Others");
      typesFamily.add("Obendorf");
    }
    console.log(typesFamily);
    filterNodes(currentYear);
    filterEdges();
    redraw();
    redraw();
}



//Looking at selected families in legend
d3.selectAll(".familyCheck").on("change",updateFamily);

/*
function filterEdgesType(){
	var nodeIds = newNodes.map(function(n) {
		return n.id; 
	});

	newEdges = graph.edges.filter( function(e) {
		return (nodeIds.includes(e.source.id) && nodeIds.includes(e.target.id))  && types.has(e.type); 
  });  
}
*/


// Redraw after an interaction
function redraw(){

  links = linkGroup.selectAll("path").data(newEdges, function(e){return e.id;}); 

	links.exit().remove(); 

  links.enter().append("path")
				  .attr("fill", "transparent")
				  .attr("stroke", function(d) { return getEdgeColor(d);})
				  .attr("stroke-width", 4)
				  .attr('marker-end',function(d) { if(d.source != d.target){ return "url(#" + d.type + ")"} else{return "url(#suicide)"}});

	nodes = nodeGroup.selectAll("circle").data(newNodes, function(n){return n.id;}) ;

  nodes.exit().remove();

	nodes.enter().append("circle")
      .attr("r", 50)
      .attr("fill", function(d) { return "url(#" + d.id + ")" })
      .attr("stroke", function(d) { if(d.timeTraveller == true){return "#b300b3"} else{ return "#bfbfbf"}})
      .attr("stroke-width", function(d) { if(d.timeTraveller == true){return "3px"} else{ return "2px"}})
      .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));




  nodes.on("click", function(d){
    if(multiplePersons.has(d.id)){
       if(d.id > 100 && d.id < 200){
        if(multiplePersons.has(d.id+100)){
          d.id = d.id + 100;
        }
        else{
          d.id = d.id - 100;
        }
       }
       else{
          if(d.id > 200){
            d.id = d.id - 200; 
          } 
          else{
              d.id = d.id + 100;           
          }
       }
      d3.select(this).attr("fill", function(d) { return "url(#" + d.id + ")" });

    }
  }); 

	nodes.append("title")
	   .text(function(d) { return d.name;});

  function tick() {
    links.attr("d", function(d) {
      if(d.source.x == d.target.x && d.source.y == d.target.y){
        xRotation = -30;
          largeArc = 1;
          drx = 50;
          dry = 50;
          x2 = d.target.x + 1;
          y2 = d.target.y + 1;
          return "M" + d.source.x + "," + d.source.y + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + 1 + " " + x2 + "," + y2;
      }
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            d.target.x + "," + 
            d.target.y;
      });

    nodes
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
  }

	//node.merge(newNode); 

	simulation.nodes(newNodes)
	   .on("tick", tick);

	simulation.force("link")
	    .links(newEdges);

	simulation.alpha(1).restart(); 
}






