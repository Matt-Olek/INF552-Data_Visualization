const ctx = {
    SVG_W: 1024,
    SVG_H: 1024,
    YEAR: "2018",
};

function loadData(svgEl) {
    var gra = d3.json("data/gra.geojson");
    var nutsrg = d3.json("data/nutsrg.geojson");
    var nutsbn = d3.json("data/nutsbn.geojson");
    var cntrg = d3.json("data/cntrg.geojson");
    var cntbn = d3.json("data/cntbn.geojson");
    var pop_density_nuts3 = d3.csv("data/pop_density_nuts3.csv");
    Promise.all([gra, nutsrg, nutsbn, cntrg, cntbn, pop_density_nuts3]).then(function (data) {
        createMap(svgEl, transformData(data));
    }
    ).catch(function (err) {
        console.log(err);
    }
    );
};

function transformData(data) {
    let nuts3 = data[0];
    let nutsrg = data[1];
    let nutsbn = data[2];
    let cntrg = data[3];
    let cntbn = data[4];
    let pop_density_nuts3 = data[5];
    
    nutsrg.features.forEach(feature => {
        let id = feature.properties.id;
        let density = pop_density_nuts3.filter(d => d.geo === id)[0].OBS_VALUE;
        feature.properties.density = parseFloat(density);
    });
    console.log(nutsrg);
    return [nuts3, nutsrg, nutsbn, cntrg, cntbn];
};

function createMap(svgEl, data) {
    let nuts3 = data[0];
    let nutsrg = data[1];
    let nutsbn = data[2];
    let cntrg = data[3];
    let cntbn = data[4];

    let graticule = nuts3;
    ctx.proj = d3.geoIdentity()             
                    .reflectY(true)             
                    .fitSize([ctx.SVG_H, ctx.SVG_H], graticule);
    let path = d3.geoPath().projection(ctx.proj);
    
    let nutsArea = svgEl.append("g");
    nutsArea.selectAll("path")
        .data(nutsrg.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "nutsArea");

    let borders = svgEl.append("g");
    borders.selectAll("path")
        .data(nutsbn.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "nutsBorder");

    //Log scale
    density = nutsrg.features.map(function (d) {
        return d.properties.density;
    });
    const min = d3.min(density);
    const max = d3.max(density);
    let logScale = d3.scaleLog()
        .domain([min, max]);

    //sequential color scale
    let colorScale = d3.scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateViridis);

    nutsArea.selectAll("path")
        .attr("style", function (d) {
            return "fill:" + colorScale(logScale(d.properties.density));
        });

    //Areas & Borders for other Countries
    let cntrArea = svgEl.append("g");
    cntrArea.selectAll("path")
        .data(cntrg.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "countryArea")
        .attr("style", "fill: lightgrey;");

    let cntrBorders = svgEl.append("g");
    cntrBorders.selectAll("path")
        .data(cntbn.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "countryBorder");
};

function createViz() {
    console.log("Using D3 v" + d3.version);
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.SVG_W);
    svgEl.attr("height", ctx.SVG_H);
    loadData(svgEl);
};

// NUTS data as JSON from https://github.com/eurostat/Nuts2json (translated from topojson to geojson)
// density data from https://data.europa.eu/data/datasets/gngfvpqmfu5n6akvxqkpw?locale=en
