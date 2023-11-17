const ctx = {
    w: 1280,
    h: 720,
};

// clipping
function clipText(svg) {
  svg.selectAll(".leaf").append("clipPath")
     .attr("id", d => "clip-" + d.data.id)
     .append("use")
     .attr("xlink:href", d => "#" + d.data.id);
  d3.selectAll(".leaf text")
    .attr("clip-path", d => `url(#clip-${d.data.id})`);
}

function createTreemap(data, svg){
    let root = d3.stratify()
        .id(d => d.Code)
        .parentId(d => d.parentCode)
        (data);
    let treemap = d3.treemap()
        .tile(d3.treemapBinary)
        .size([ctx.w, ctx.h])
        .paddingInner(3)
        .paddingOuter(3)

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    let fader = function(c){return d3.interpolateRgb(c, "#fff")(0.6);};
    let color2 = d3.scaleOrdinal(d3.schemeCategory10.map(fader));

    root.eachBefore(d => {
        d.data.id = d.data.Code;
    });
    root.sum(sumByCount);
    treemap(root);    

    let nodes = svg.selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .classed("leaf", d => d.children == null)
        .classed("coloured", d => d.parent != null && d.children != null)
        .classed("root", d => d.parent == null);
        
    nodes.append("rect")
        .attr("id", d => d.data.id)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .style("stroke", "black");  
        

    d3.selectAll(".leaf").append("text")
        .selectAll("tspan")
        .data(d => {
            const words = d.data.Description.split(" ");
            const code = d.data.Code;
            return words.map(word => ({ word, code }));
        })
        .enter()
        .append("tspan")
        .attr("x", 4)
        .attr("y", (d, i) => 13 + i * 10)
        .text(d => d.word)
        .style("fill", d => (tinycolor(color2(extractClass(d.code)).toString()).darken(40).toString()));
    
        
    d3.selectAll(".root rect")
        .style("fill", "n")
        .style("stroke", "none"); 
    
    d3.selectAll(".coloured rect")
        .style("fill", d => color2(extractClass(d.data.Code)))
          
    d3.selectAll(".leaf rect")
        .style("fill", d => color2(extractClass(d.data.Code)));
    

    console.log(color2("00"))
    console.log(color("00"));
    console.log(color2("01"));
    console.log(data);
    clipText(svg);
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
    // and call createTreemap(...) passing this data and svgEL
    d3.csv("data/cofog.csv", d3.autoType).then(function(data){
        data.forEach(d => {
            d.parentCode = parentID(d);
        });
        data.push({Code: "COFOG", parentCode: null, Name: "COFOG"}  
        );

        createTreemap(data, svgEl);
    }
    );
}

// Other functions

function parentID(d) {
    return d.Code.length > 4 ? d.Code.slice(0, -2) : "COFOG";
}

function sumByCount(d) {
    return 1;
}
function extractClass(d) {
    return parseInt(d.charAt(2) + d.charAt(3))-1;
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }