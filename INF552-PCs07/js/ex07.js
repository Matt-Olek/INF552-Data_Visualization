const ctx = {
    w: 800,
    h: 800,
    mapMode: false,
    MIN_COUNT: 3000,
    ANIM_DURATION: 600, // ms
    NODE_SIZE_NL: 5,
    NODE_SIZE_MAP: 3,
    LINK_ALPHA: 0.2,
    nodes: [],
    links: [],
};

const ALBERS_PROJ = d3.geoAlbersUsa().translate([ctx.w/2, ctx.h/2]).scale([1000]);

// https://github.com/d3/d3-force
const simulation = d3.forceSimulation()
                   .force("link", d3.forceLink()
                                    .id(function(d) { return d.id; })
                                    .distance(5).strength(0.08))
                   .force("charge", d3.forceManyBody())
                   .force("center", d3.forceCenter(ctx.w / 2, ctx.h / 2));

// https://github.com/d3/d3-scale-chromatic
const color = d3.scaleOrdinal(d3.schemeAccent);

function createGraphLayout(svg){
    var circles = svg.append("g").attr("id", "nodes");
    var lines = svg.append("g").attr("id", "links");
    // let color = d3.scaleOrdinal(d3.schemeAccent);

    lines.selectAll("line")
            .data(ctx.links)
            .enter()
            .append("line")
            .attr("stroke", "black")
            .attr("stroke-opacity", ctx.LINK_ALPHA);

    var circles = nodes.selectAll("circle")
            .data(ctx.nodes)
            .enter()
            .append("circle")
            .attr("r", ctx.NODE_SIZE_NL)
            .attr("fill", function(d){return color(d.group);}); 

    


    circles.call(d3.drag().on("start", (event, d) => startDragging(event, d))
                          .on("drag", (event, d) => dragging(event, d))
                          .on("end", (event, d) => endDragging(event, d)));
};

function switchVis(showMap){
    if (showMap){
        createGraphLayout(svgEl);
        console.log("Showing map");
    }

    else {
        // show NL diagram
        //...
    }
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    d3.select("body")
      .on("keydown", function(event, d){handleKeyEvent(event);});
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

function loadData(svgEl){
    var airports = d3.json("data/airports.json");
    var flights = d3.json("data/flights.json");
    var states_tz = d3.csv("data/states_tz.csv");
    var states = d3.json("data/us-states.geojson");
    Promise.all([airports, flights,states_tz,states]).then(
        function(data){
            ctx.airports = data[0];
            ctx.flights = data[1];
            //Ignore SJU Airport
            ctx.airports = ctx.airports.filter(function(d){return d.iata !== "SJU";});
            ctx.states_tz = data[2];
            ctx.states = data[3];
            processData();
    }
    ).catch(function(error){
        console.log("Error loading data files: "+error);
    });
    
};

function processData(){
    // Create Nodes
    var nodes = []
    var links = []
    ctx.airports.forEach(function(d){
        isInvolved = false;
        for (var i = 0; i < ctx.flights.length; i++){
            if (ctx.flights[i].count > ctx.MIN_COUNT){
                isInvolved = true;
                break;
            }
        }
        if (isNaN(d.iata.charAt(0)) && isInvolved && d.iata !== "SJU") {
            nodes.push({id: d.iata, group: ctx.states_tz.filter(function(e){return e.State === d.state;}).TimeZone, state: d.state, city: d.city, });
        }
    });
    
    // remove nodes with no connections
    ctx.nodes = nodes.filter(function(d){
        for (var i = 0; i < ctx.flights.length; i++){
            if (ctx.flights[i].count > ctx.MIN_COUNT){
                if (ctx.flights[i].origin == d.id || ctx.flights[i].destination == d.id){
                    console.log("sucess");
                    return true;
                }
            }
        }
        return false;
    });
    // Create Links
    ctx.flights = ctx.flights.filter(function(d){
        if (d.count > ctx.MIN_COUNT){
        ctx.links.push({source: d.origin, target: d.destination, value: d.count});
        return true;
        }
    }
    );

    console.log("Loaded "+ctx.nodes.length+" nodes.");
    console.log("Loaded "+ctx.links.length+" links.");
}

function startDragging(event, node){
    if (ctx.mapMode){return;}
    if (!event.active){
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragging(event, node){
    if (ctx.mapMode){return;}
    node.fx = event.x;
    node.fy = event.y;
}

function endDragging(event, node){
    if (ctx.mapMode){return;}
    if (!event.active){
        simulation.alphaTarget(0);
    }
    // commenting the following lines out will keep the
    // dragged node at its current location, permanently
    // unless moved again manually
    node.fx = null;
    node.fy = null;
}

function handleKeyEvent(e){
    if (e.keyCode === 84){
        // hit T
        toggleMap();
    }
};

function toggleMap(){
    ctx.mapMode = !ctx.mapMode;
    switchVis(ctx.mapMode);
};
