const ctx = {
    w: 1200,
    h: 1200,
};

function createRadialTree(data, svg){
    //...
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

function loadData(svgEl){
    // load cofog.csv
    // and call createRadialTree(...) passing this data and svgEL
};
