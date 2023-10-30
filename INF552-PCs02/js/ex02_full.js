const ctx = {
    GLYPH_SIZE: 16,
    w: 860,
    h: 860,
    DM: {RV:"Radial Velocity", PT: "Primary Transit"},
};

let circleGen = d3.symbol().type(d3.symbolCircle)
				  .size(ctx.GLYPH_SIZE);

let crossGen = d3.symbol().type(d3.symbolCross)
				 .size(ctx.GLYPH_SIZE);

function initSVGcanvas(planetData){
    // scales to compute (x,y) coordinates from data values to SVG canvas

    /* Original declarations for linear scales */
    // let maxMass = d3.max(planetData, ((d) => parseFloat(d.mass)));
    // let maxStarMass = d3.max(planetData, (d) => (parseFloat(d.star_mass)));
    // // scale star_mass -> x-axis
    // ctx.xScale = d3.scaleLinear().domain([0, maxStarMass])
    //                              .range([60, ctx.w-20]);
    // // scale planet_mass -> y-axis
    // ctx.yScale = d3.scaleLinear().domain([0, maxMass])
    //                              .range([ctx.h-60, 20]);

    /* New declarations for log scales */
    let massExt = d3.extent(planetData, ((d) => parseFloat(d.mass)));
    let starMassExt = d3.extent(planetData, (d) => (parseFloat(d.star_mass)));
    // scale star_mass -> x-axis
    ctx.xScale = d3.scaleLog().domain(starMassExt)
                                 .range([60, ctx.w-20]);
    // scale planet_mass -> y-axis
    ctx.yScale = d3.scaleLog().domain(massExt)
                                 .range([ctx.h-60, 20]);
    // color scale to encode year of discovery
    ctx.cScale = d3.scaleLinear().domain(
                                    d3.extent(planetData,
                                        function(d){
                                            return parseInt(d.discovered);
                                        })
                                 )
                                 .range(['#193152', '#4ba4ff'])
                                 .interpolate(d3.interpolateHcl);
    // 1 Msun & 1 MJup indicators
    d3.select("#bkgG")
      .append("line")
      .attr("x1", 0)
      .attr("y1", ctx.yScale(1))
      .attr("x2", ctx.w)
      .attr("y2", ctx.yScale(1))
      .style("stroke", "#DDD");
    // ... cont'd
    d3.select("#bkgG")
      .append("line")
      .attr("x1", ctx.xScale(1))
      .attr("y1", 0)
      .attr("x2", ctx.xScale(1))
      .attr("y2", ctx.h)
      .style("stroke", "#DDD");
    // x- and y- axes
    d3.select("#bkgG").append("g")
      .attr("transform", `translate(0,${ctx.h-50})`)
      .call(d3.axisBottom(ctx.xScale).ticks(10))
      .selectAll("text")
      .style("text-anchor", "middle");
    d3.select("#bkgG").append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(ctx.yScale).ticks(10))
      .selectAll("text")
      .style("text-anchor", "end");
    // x-axis label
    d3.select("#bkgG")
      .append("text")
      .attr("y", ctx.h - 12)
      .attr("x", ctx.w/2)
      .classed("axisLb", true)
      .text("Star Mass (Msun)");
    // y-axis label
    d3.select("#bkgG")
      .append("text")
      .attr("y", 0)
      .attr("x", 0)
      .attr("transform", `rotate(-90) translate(-${ctx.h/2},18)`)
      .classed("axisLb", true)
      .text("Mass (Mjup)");
}

ctx.DM['PT']


function populateSVGcanvas(planetData){
    // put planets in two separate <g>, one for each detection method,
    // to make it easier to manage, e.g., visibility toggling
    d3.select("#RV").selectAll("path")
      .data(planetData.filter(function(d){
        return (d.detection_type == ctx.DM.RV);
      }))
      .enter()
      .append("path")
      .attr("d", crossGen())
      .attr("transform", function(d){
          return planetTranslator(d.star_mass, d.mass);
      })
      .attr("fill", function(d){return ctx.cScale(d.discovered)})
      .append("title")
      .text((d) => (d.name));

    d3.select("#PT").selectAll("path")
      .data(planetData.filter(function(d){
        return (d.detection_type == ctx.DM.PT);
      }))
      .enter()
      .append("path")
      .attr("d", circleGen())
      .attr("transform", function(d){
          return planetTranslator(d.star_mass, d.mass);
      })
      .attr("stroke", function(d){return ctx.cScale(d.discovered)})
      .append("title")
      .text((d) => (d.name));

};

function planetTranslator(starMass, planetMass){
    return `translate(${ctx.xScale(starMass)},${ctx.yScale(planetMass)})`;
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    // creating the SVG canvas
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    let rootG = svgEl.append("g").attr("id", "rootG");
    // an SVG group for background elements (axes, labels)
    rootG.append("g").attr("id", "bkgG");
    // an SVG group for exoplanets detected using Radial Velocity
    rootG.append("g").attr("id", "RV");
    // an SVG group for exoplanets detected using Primary Transit
    rootG.append("g").attr("id", "PT");
    loadData();
};

function loadData(){
    d3.csv("data/exoplanet.eu_catalog.20230927.csv").then(function(planets){
        console.log(`Processing ${planets.length} planets`);
        const DETECTION_METHODS = Object.values(ctx.DM);
        // only keeping exoplanets for which we have the mass and the star Mass
        // and that have been detected using oe of two methods:
        // Primary Transit or Radial Velocity
        let planetData = planets.filter((d) => (d.mass > 0 && d.star_mass > 0 &&
                                        DETECTION_METHODS.includes(d.detection_type)));
        console.log(`Displaying ${planetData.length} planets`);
        // initializig the visualization (scales, labels, axes)
        initSVGcanvas(planetData);
        // actually displaying the exoplanet points in the scatterplot
        populateSVGcanvas(planetData);
    }).catch(function(error){console.log(error)});
};
