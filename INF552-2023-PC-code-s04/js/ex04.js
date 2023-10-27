const ctx = {
    w: 820,
    h: 720,
    JITTER_W:50
};

function initSVGcanvas(data) {
    //initialize the y-axis scale
    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => (d.Teff))])
        .range([ctx.h - 100, 100]);
    let yAxis = d3.axisLeft(yScale)
        .tickValues(d3.range(0, d3.max(data, (d) => (d.Teff)), 5000));
    d3.select("#bkgG").append("g")
        .attr("id", "yAxisG")
        .attr("transform", "translate(100,0)")
        .call(yAxis);
    // Legend   
    let legend = d3.select("#bkgG").append("g")
        .attr("id", "legend")
        .attr("transform", "translate(100,0)");
    legend.append("text")
        .attr("x", 0)
        .attr("y", 50)
        .text("Estimated effective temperature (K)"); 


    let rootG = d3.select("#rootG");
    //last column of the dataset is the spectral type    
    let spectralTypes = ["O", "B", "A", "F", "G", "K", "M"]
    console.log(`Spectral types: ${spectralTypes}`);
    for (let i = 0; i < spectralTypes.length; i++) {
        rootG.append("g")
            .attr("id", "g_" + spectralTypes[i])
            .attr("width", 100)
            .attr("transform", "translate(" + (150 + i * 100) + ",0)")
            .append("text")
                .attr("x", 100)
                .attr("y", 650)
                .text(spectralTypes[i] + " Type");
    };
    for (let i = 0; i < spectralTypes.length; i++) {
        let sG = d3.select("#g_" + spectralTypes[i]);
        let stars = data.filter((d) => (d.SpType_ELS.split(" ").join("") == spectralTypes[i]));
        console.log(`Stars of type ${spectralTypes[i]}: ${stars.length}`);
        let circles = sG.selectAll("circle")
                .data(stars)
                .enter()
                .append("circle")
                    .attr("cx", (d) => (90 + Math.random() * ctx.JITTER_W))
                    .attr("cy", (d) => yScale(d.Teff))
                    .attr("r", 1)
                    .attr("fill", "black");
    };
    let circles = rootG.selectAll("circle2")
                .data(data)
                .enter()
                .append("circle")
                    .attr("cx", (d) => (150 + Math.random() * ctx.JITTER_W))
                    .attr("cy", (d) => yScale(d.Teff))
                    .attr("r", 1)
                    .attr("fill", "red");
    
    for (let i = 0; i < spectralTypes.length; i++) {
        let stars = data.filter((d) => (d.SpType_ELS.split(" ").join("") == spectralTypes[i]));
        let summary = getSummaryStatistics(stars);
        console.log(summary);
        let sG = d3.select("#g_" + spectralTypes[i]);
        let boxplot = sG.append("g")
            .attr("id", "boxplot_" + spectralTypes[i])
            .attr("transform", "translate(0,0)");
        boxplot.append("rect")
            .attr("x", 85)
            .attr("y", yScale(summary["q3"]))
            .attr("width", 60)
            .attr("height", yScale(summary["q1"]) - yScale(summary["q3"]))
            .attr("fill", "none")
            .attr("stroke", "red");
        boxplot.append("line")
            .attr("x1", 105)
            .attr("y1", yScale(summary["median"]))
            .attr("x2", 125)
            .attr("y2", yScale(summary["median"]))
            .attr("stroke", "black");
        boxplot.append("line")
            .attr("x1", 105)
            .attr("y1", yScale(summary["min"]))
            .attr("x2", 125)
            .attr("y2", yScale(summary["min"]))
            .attr("stroke", "black");
        boxplot.append("line")
            .attr("x1", 105)
            .attr("y1", yScale(summary["max"]))
            .attr("x2", 125)
            .attr("y2", yScale(summary["max"]))
            .attr("stroke", "black");
        boxplot.append("line")
            .attr("x1", 115)
            .attr("y1", yScale(summary["min"]))
            .attr("x2", 115)
            .attr("y2", yScale(summary["max"]))
            .attr("stroke", "black");

    }

};







// code for Section 4 (optional)
// data = array of stars with their attributes
// sG = d3 reference to the <g> element
//      for the corresponding spectral type
function densityPlot(data, sG){
    let tEffs = data.map(function (p) { return p.Teff; });
    let tEffScale = d3.scaleLinear()
                             .domain(/*some domain*/)
                             .range(/*some range*/);
    let n = tEffs.length,
        density = kernelDensityEstimator(kernelEpanechnikov(7), tEffScale.ticks(50))(tEffs);
    let maxDensity = d3.max(density, (d) => (d[1]));
    let densityScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([0, ctx.JITTER_W * 0.8]);
    // remove entries where y=0 to avoid unnecessarily-long tails
    let i = density.length - 1;
    let lastNonZeroBucket = -1;
    while (i >= 0) {
        // walk array backward, find last entry >0 at index n, keep n+1
        if (density[i][1] > 0) {
            lastNonZeroBucket = i;
            break;
        }
        i--;
    }
    if (lastNonZeroBucket != -1) {
        density = density.splice(0, lastNonZeroBucket + 3);
    }
    // insert a point at 0,0 so that the path fill does not cross the curve
    density.unshift([0, 0]);
    // now draw the density curve
    // TBW ...
};

function loadData() {
    d3.csv("data/sample_gaia_DR3.csv").then(function (data) {
        console.log(`Star total count: ${data.length}`);
        let starsWithTeff = data.filter((d) => (parseFloat(d.Teff) > 0));
        starsWithTeff.forEach(
            (d) => { d.Teff = parseFloat(d.Teff); }
        );
        console.log(`Stars with estimated temperature: ${starsWithTeff.length}`);
        // ...
        initSVGcanvas(starsWithTeff);
    }).catch(function(error){console.log(error)});
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    var rootG = svgEl.append("g").attr("id", "rootG");
    // group for background elements (axes, labels)
    rootG.append("g").attr("id", "bkgG");
    loadData();
};

/*-------------- Summary stats for box plot ------------------------*/
/*-------------- see Instructions/Section 3 ----------------------*/

function getSummaryStatistics(data) {
    return d3.rollup(data, function (d) {
        let q1 = d3.quantile(d.map(function (p) { return p.Teff; }).sort(d3.ascending), .25);
        let median = d3.quantile(d.map(function (p) { return p.Teff; }).sort(d3.ascending), .5);
        let q3 = d3.quantile(d.map(function (p) { return p.Teff; }).sort(d3.ascending), .75);
        let iqr = q3 - q1;
        let min = d3.min(data, (d) => (d.Teff));
        let max = d3.max(data, (d) => (d.Teff));
        return ({ q1: q1, median: median, q3: q3, iqr: iqr, min: min, max: max })
    });
};

/*-------------- kernel density estimator ------------------------*/
/*-------------- see Instructions/Section 4 ----------------------*/

function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}
