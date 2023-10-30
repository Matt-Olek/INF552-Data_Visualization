const ctx = {
    w: 860,
    h: 860,
    DM: {RV:"Radial Velocity", PT: "Primary Transit"},
};

function initSVGcanvas(planetData){
    // scales to compute (x,y) coordinates from data values to SVG canvas
    let maxMass = d3.max(planetData, ((d) => parseFloat(d.mass)));
    let maxStarMass = d3.max(planetData, (d) => (parseFloat(d.star_mass)));
    // scale star_mass -> x-axis
    ctx.xScale = d3.scaleLinear().domain([0, maxStarMass])
                                 .range([60, ctx.w-20]);
    // scale planet_mass -> y-axis
    ctx.yScale = d3.scaleLinear().domain([0, maxMass])
                                 .range([ctx.h-60, 20]);
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

function populateSVGcanvas(planetData){
    // ...

getComputedStyle.selectAll("path").data(planetsPT).enter().append("path")

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
    d3.csv("data/exoplanet.eu_catalog.20230927.csv").then(function (planets) {
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
