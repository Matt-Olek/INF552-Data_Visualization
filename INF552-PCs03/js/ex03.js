var ctx = {
  sampleSize : '*',
  scaleTypeSP : 'linear',
  MIN_YEAR: 1987,
  DETECTION_METHODS_RVPT: ["Radial Velocity", "Primary Transit"],
  DETECTION_METHODS_ALL4: ["Radial Velocity", "Primary Transit",
                           "Microlensing", "Imaging"],
  DM_COLORS: ['#cab2d6', '#fdbf6f', '#b2df8a', '#fb9a99']
}

var createMassScatterPlot = function(scaleType, sampleSize){
    /* scatterplot: planet mass vs. star mass
       showing year of discovery using color,
       and detection method using shape,
       to be sync'ed with line bar chart below (brushing and linking) */
    var scale = ctx.scaleTypeSP;
    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": "data/exoplanet.eu_catalog.20230927.csv"
        },
        "mark" : "point",
        "encoding": {
            "y": {
                "field": "mass",
                "type": "quantitative",
                "axis": { "title": "Planet Mass (Jupiter Mass)"},
                "scale" : {"type": scale}
            },
            "x" : {
                "field": "star_mass",
                "type": "quantitative",
                "axis" : { "title": "Star Mass (Solar Mass)"},
                "scale" : {"type": scale}

            },
            "shape" : {
                "field" : "detection_type",
                "type" : "nominal"
            },
            "color" : {
                "field" : "discovered",
                "type" : "temporal",
                "timeUnit" : "year"
            }
        },
        // Only show planets with mass > 0 and star mass > 0 and detected with RV or PT
        "transform" : [
            {"filter" : {
                "and" : [
                    {"field" : "mass", "gt" : 0},
                    {"field" : "star_mass", "gt" : 0},
                    {"field" : "detection_type", "oneOf" : ctx.DETECTION_METHODS_RVPT}
                ]
            }}
        ]

    };
    // see options at https://github.com/vega/vega-embed/blob/master/README.md
    var vlOpts = {width:700, height:700, actions:false};
    vegaEmbed("#massScat", vlSpec, vlOpts);
};

var createMagV2DHisto = function(){
    /* 2D histogram in the bottom-right cell,
       showing V-magnitude distribution (binned)
       for each detection_method */
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": "data/exoplanet.eu_catalog.20230927.csv"
        },
        "mark" : "rect",
        "encoding": {
            "x": {
                "field": "mag_v",
                "type": "quantitative",
                "axis": { "title": "Magnitude (V-band)"},
            },
            "y" : {
                "field": "detection_type",
                "type": "nominal"
            },
            "color" : {
                "aggregate" : "count",
                "type" : "quantitative"
            }
        },
        "config": {
          "view": {
            "stroke": "transparent"
          }
        }
        //...
    };
    vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#vmagHist", vlSpec, vlOpts);
};

var createDetectionMethodLinePlot = function(){
    // line plot: planet discovery count vs. year
    // vlSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "data": {
    //         //...
    //     },
    //     //...
    // };
    // vlOpts = {width:300, height:300, actions:false};
    // vegaEmbed("#discPlot", vlSpec, vlOpts);
};

var createViz = function(){
    vega.scheme("dmcolors", ctx.DM_COLORS);
    createMassScatterPlot(ctx.scaleTypeSP, '*');
    createMagV2DHisto();
    createDetectionMethodLinePlot();
};

var handleKeyEvent = function(e){
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        setSample();
    }
};

var updateScatterPlot = function(){
    createMassScatterPlot(ctx.scaleTypeSP, ctx.sampleSize);
};

var setScaleSP = function(){
    ctx.scaleTypeSP = document.querySelector('#scaleSelSP').value;
    updateScatterPlot();
};

var setSample = function(){
    var sampleVal = document.querySelector('#sampleTf').value;
    if (sampleVal.trim()===''){
        return;
    }
    ctx.sampleSize = sampleVal;
    updateScatterPlot();
};
