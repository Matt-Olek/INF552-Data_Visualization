const ctx = {
    REF_YEAR: "1950", // year used as a reference, between 1948 and 2021
    w: 1200,
    h: 900,
    GREY_NULL: "#DFDFDF",
    STAGE_DURATION: 1000,
    DOUBLE_CLICK_THRESHOLD: 300,
    totalStripHeight: 400,
    totalLinePlotHeight: 900,
    vmargin: 2,
    hmargin: 4,
    timeParser: d3.timeParse("%Y-%m-%d"),
    timeAxisHeight: 20,
    linePlot: false,
    tempExtentOverAllSeries: [0, 0],
};

// The column names of cities to be exctracted from the dataset
const CITIES = ["boston", "new_york", "los_angeles", "anchorage", "dallas", "miami", "honolulu", "las_vegas", "phoenix", "new_orleans", "san_francisco", "seattle", "sacramento", "reno", "portland", "oklahoma_city", "memphis", "minneapolis", "kansas_city", "detroit", "denver", "albuquerque", "atlanta"];

function transformData(data) {
    let res = { dates: [], series: [] };
    ctx.cityRefTemps = {};
    let cityDeltaTemps = {};
    CITIES.forEach(
        function (c) {
            ctx.cityRefTemps[c] = [];
            cityDeltaTemps[c] = [];
        }
    );
    data.filter((d) => (d.time.startsWith(ctx.REF_YEAR))).forEach(
        function (date_record) {
            CITIES.forEach(
                function (c) {
                    ctx.cityRefTemps[c].push(parseFloat(date_record[c]));
                }
            );
        }
    );
    data.forEach(
        function (date_record) {
            res.dates.push(date_record.time);
            CITIES.forEach(
                function (city) {
                    let delta = parseFloat(date_record[city]) - getReferenceTemp(city, getMonth(date_record.time));
                    cityDeltaTemps[city].push(delta);
                }
            );
        }
    );
    CITIES.forEach(
        function (c) {
            res.series.push({ name: c, values: cityDeltaTemps[c] });
        }
    );
    return res;
};

function createStrips(data, svgEl) {
    ctx.tempExtentOverAllSeries = [d3.min(data.series,
        (d) => (d3.min(d.values))),
    d3.max(data.series,
        (d) => (d3.max(d.values)))];
    ctx.color = d3.scaleLinear()
        .domain([ctx.tempExtentOverAllSeries[0],
            0,
        ctx.tempExtentOverAllSeries[1]])
        .range(["blue", "white", "red"]);
    ctx.BAND_H = (ctx.totalStripHeight - ctx.timeAxisHeight) / data.series.length;
    // for each band (city temperature time-series)
    data.series.forEach(function (s, i) {
        // create a <g> and put it in the right place
        // so that bands are juxtaposed vertically
        let mapG = svgEl.append("g")
            .classed("plot", true)
            .attr("transform",
                `translate(${ctx.hmargin},${i * ctx.BAND_H})`);
        // populate each band with vertical lines,
        // one for each temperature value in the series
        // (a line corresponds to a month of a year)
        // the line being colored according to the value for that month-year
        mapG.selectAll("line")
            .data(s.values)
            .enter()
            .append("line")
            .attr("x1", (d, j) => (j))
            .attr("y1", ctx.vmargin)
            .attr("x2", (d, j) => (j))
            .attr("y2", ctx.BAND_H - ctx.vmargin)
            .attr("stroke", (d) => ((d == null) ? ctx.GREY_NULL : ctx.color(d)));
        // add the city name after the color map
        mapG.append("text")
            .attr("x", data.dates.length + 2 * ctx.hmargin)
            .attr("y", ctx.BAND_H - ctx.vmargin - 3)
            .text(formatCity(s.name));
    });
    // time axis
    let timeScale = d3.scaleTime()
        .domain(d3.extent(data.dates, (d) => ctx.timeParser(d)))
        .rangeRound([0, data.dates.length - 1]);
    svgEl.append("g")
        .attr("id", "timeAxis")
        .attr("transform",
            `translate(${ctx.hmargin},${ctx.totalStripHeight - ctx.timeAxisHeight})`)
        .call(d3.axisBottom(timeScale).ticks(d3.timeYear.every(5)));
    // legend
    let tempRange4legend = d3.range(ctx.tempExtentOverAllSeries[0],
        ctx.tempExtentOverAllSeries[1], .2).reverse();
    let scale4tempLegend = d3.scaleLinear()
        .domain(ctx.tempExtentOverAllSeries)
        .rangeRound([tempRange4legend.length, 0]);
    let legendG = svgEl.append("g")
        .attr("id", "tempLegend")
        .attr("opacity", 1)
        .attr("transform", "translate(1000,50)");
    legendG.selectAll("line")
        .data(tempRange4legend)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("y1", (d, j) => (j))
        .attr("x2", ctx.BAND_H)
        .attr("y2", (d, j) => (j))
        .attr("stroke", (d) => (ctx.color(d)));
    legendG.append("g")
        .attr("transform", `translate(${ctx.BAND_H + 4},0)`)
        .call(d3.axisRight(scale4tempLegend).ticks(5));
    legendG.append("text")
        .attr("x", 0)
        .attr("y", tempRange4legend.length + 12)
        .text(`Reference year: ${ctx.REF_YEAR}`);
};

function transitionToLinePlots() {
    d3.select("#tempLegend").transition()
         .duration(ctx.STAGE_DURATION)
         .attr("opacity", 0);

    const n = CITIES.length;

    d3.selectAll("#mapG").transition()
    .duration(ctx.STAGE_DURATION)
    .attr('transform', (i,d) => `translate(0,${-d + d * (parseFloat(ctx.totalLinePlotHeight) / parseFloat(ctx.totalStripHeight))*n})`);    
               
    d3.selectAll("g:not(#timeAxis):not(#mapG)").transition()
        .duration(ctx.STAGE_DURATION)
        .attr('transform', (i,d) => `translate(0,${-d + d * (parseFloat(ctx.totalLinePlotHeight) / parseFloat(ctx.totalStripHeight))*n})`); 

    d3.selectAll('#timeAxis').transition()
        .duration(ctx.STAGE_DURATION)
        .attr('transform', `translate(${ctx.hmargin},${ctx.totalLinePlotHeight - ctx.timeAxisHeight})`);
    
    d3.selectAll("line").transition()
    .duration(ctx.STAGE_DURATION)
    .attr('y2', function(){ return (d3.select(this).attr("y1")-1);});

    ctx.color = d3.scaleLinear()
        .domain([ctx.tempExtentOverAllSeries[0],
            0,
        ctx.tempExtentOverAllSeries[1]])
        .range(["blue", "white", "red"]);

//     d3.selectAll("line")
//     .transition()
//     .duration(ctx.STAGE_DURATION)
//     .attr("y1", function(d) {
//       if (d === null) {
//         return 0;
//       } else {
//         const color = d3.select(this).attr("stroke");
//         return ctx.color.invert(color);
//       }
//     })
// N    .attr("y2", function(d) {
//       if (d === null) {
//         return 0;
//       } else {
//         const color = d3.select(this).attr("stroke");
//         return ctx.color.invert(color) + 1;
//       }
//     });
  








    // turn all lines dark gray
    
    
          
    




};

function transitionToColorStrips() {
    // XXX: TBW
};

function toggleVis() {
    if (ctx.linePlot) {
        transitionToColorStrips();
    }
    else {
        transitionToLinePlots();
    }
    ctx.linePlot = !ctx.linePlot;
};

function createViz() {
    console.log("Using D3 v" + d3.version);
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

function loadData(svgEl) {
    // data source: https://www.kaggle.com/datasets/garrickhague/temp-data-of-prominent-us-cities-from-1948-to-2022
    d3.csv("data/US_City_Temp_Data.csv").then(function (data) {
        createStrips(transformData(data), svgEl);
    }).catch(function (error) { console.log(error) });
};

/* ---- utilities ---- */

function formatCity(cityName) {
    let tokens = cityName.split("_");
    for (let i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
    }
    return tokens.join(" ");
}

function getMonth(time) {
    return parseInt(time.substring(5, 7));
};

function getReferenceTemp(city, month) {
    return ctx.cityRefTemps[city][month - 1];
};
