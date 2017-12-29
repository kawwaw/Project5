d3.select(window).on('load', init);

function init() {

    var svg = d3.select('#USA');
    var svgSF = d3.select('#svg2');
   // var margin = {top: 50, right: 50, bottom: 50, left: 50};
    var width = +svg.node().getBoundingClientRect().width;
    var height = +svg.node().getBoundingClientRect().height;

    var w = width;
    var h = height;
    console.log(width);
    console.log(height);


    var wSF = +svgSF.node().getBoundingClientRect().width;
    var hSF = +svgSF.node().getBoundingClientRect().height;

    //Number formatting for population values
    var formatAsThousands = d3.format(",");  //e.g. converts 123456 to "123,456"


    var projectionKW = d3.geoAlbersUsa()
        //.translate([width/2,height/2])
        .translate([0,0])
        //.scale([1000])
    ;
    var offsetKW = projectionKW.translate();


    console.log("offsetKW" + offsetKW);


    var projectionSF = d3.geoAlbersUsa()

        .scale([3000])
        .translate([1100,hSF/2])
    ;

    var centerSF = projectionSF.center;
    console.log("center" + centerSF);


    var piyg = d3.scaleSequential(d3.interpolatePiYG)
        .domain([1, 40]);

    console.log(piyg(2));



    var Mercator = d3.geoMercator()
        .translate([wSF/2,hSF/2])
        .scale(150000)
        .center([-122.447, 37.777])
    ;

    console.log("center" + Mercator.center() + " " + Mercator.scale() + " " + Mercator.translate());


    //create path variable
    var pathSF =  d3.geoPath()
        //.projection(projectionSF)
        .projection(Mercator)
    ;

    var offsetSF = projectionSF.translate();
   // var centerSF = projectionSF.center();
    console.log("offset" + offsetSF);
    //console.log(centerSF);

    //Define what to do when dragging
    var dragging = function(d) {

        //Log out d3.event, so you can see all the goodies inside
        //console.log(d3.event);

        //Get the current (pre-dragging) translation offset
        var offset = Mercator.translate();

        //Augment the offset, following the mouse movement
        offset[0] += d3.event.dx;
        offset[1] += d3.event.dy;

        //Update projection with new offset
        Mercator.translate(offset);

        //Update all paths and circles
        svgSF.selectAll("path")
            .attr("d", pathSF)
        ;



    }; // dette semikolon var der ikke fra start

    //Then define the drag behavior
    var drag = d3.drag()
        .on("drag", dragging);

    //Create a container in which all pan-able elements will live
    var mapSF = svgSF.append("g")
        .attr("id", "map")
        .call(drag);  //Bind the dragging behavior


    d3.json("sfpd_districts.geojson", function (json) {


        console.log(json);
        mapSF.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d",pathSF)
            .style("fill", "grey")
            .style("stroke", "blue")
            .style("stroke-width", 1)
    });

//////////////////////// Næste sektion



    var path = d3.geoPath()
        .projection(projectionKW)
    ;


    var color = d3.scaleQuantize()
    //.range(['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#8c2d04']);
        .range(d3.schemePiYG[11]);


    d3.csv("us-ag-productivity.csv", function(agdata){

        color.domain([
            d3.min(agdata, function(d){return d.value}),
            d3.max(agdata, function(d){return d.value})
        ]);
        console.log(agdata);

        d3.json("us-states.json", function (json) {

            for (var i = 0; i < agdata.length; i++) {
                var dataState = agdata[i].state;
                //console.log(dataState);
                var dataValue = parseFloat(agdata[i].value);
                //console.log(dataValue);
                for (var j = 0; j < json.features.length; j++) {
                    var jsonState = json.features[j].properties.name;
                    //console.log("jsonfil" + jsonState);
                    if (dataState == jsonState) {
                        json.features[j].properties.value = dataValue;
                        break;
                    }
                }
            }

            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", function (d) {
                    var value = d.properties.value;
                    if (value) {
                        return color(value);
                    }
                    else {return "#ccc";}

                })
            ;
            d3.csv("us-cities.csv",function(data){
                console.log(data);
                svg.selectAll("circle")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx",function(d){return projectionKW([d.lon,d.lat])[0]})
                    .attr("cy",function(d){return projectionKW([d.lon,d.lat])[1]})
                    .attr("r",function(d){return Math.sqrt(parseInt(d.population)*0.00004)})
                    .style("fill","yellow")
                    .style("stroke","blue")
                    .style("opacity",0.75)
                    .append("title")
                    .text(function(d){return d.place + ": Pop. " + formatAsThousands(d.population)})
                ;

                createPanButtons();

            });
           // console.log(json);


        });
    });


    var createPanButtons = function() {

        //Create the clickable groups

        //North
        var north = svg.append("g")
            .attr("class", "pan")	//All share the 'pan' class
            .attr("id", "north");	//The ID will tell us which direction to head

        north.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", 30);

        north.append("text")
            .attr("x", width/2)
            .attr("y", 20)
            .html("&uarr;");

        //South
        var south = svg.append("g")
            .attr("class", "pan")
            .attr("id", "south");

        south.append("rect")
            .attr("x", 0)
            .attr("y", height - 30)
            .attr("width", width)
            .attr("height", 30);

        south.append("text")
            .attr("x", width/2)
            .attr("y", height - 10)
            .html("&darr;");

        //West
        var west = svg.append("g")
            .attr("class", "pan")
            .attr("id", "west");

        west.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 30)
            .attr("height", h - 60);

        west.append("text")
            .attr("x", 15)
            .attr("y", h/2)
            .html("&larr;");

        //East
        var east = svg.append("g")
            .attr("class", "pan")
            .attr("id", "east");

        east.append("rect")
            .attr("x", w - 30)
            .attr("y", 30)
            .attr("width", 30)
            .attr("height", h - 60);

        east.append("text")
            .attr("x", w - 15)
            .attr("y", h/2)
            .html("&rarr;");

        //Panning interaction

        d3.selectAll(".pan")
            .on("click", function() {

                //Get current translation offset
                var offset = projectionKW.translate();
                console.log(offset);

                //Set how much to move on each click
                var moveAmount = 50;

                //Which way are we headed?
                var direction = d3.select(this).attr("id");

                //Modify the offset, depending on the direction
                switch (direction) {
                    case "north":
                        offset[1] += moveAmount;  //Increase y offset
                        break;
                    case "south":
                        offset[1] -= moveAmount;  //Decrease y offset
                        break;
                    case "west":
                        offset[0] += moveAmount;  //Increase x offset
                        break;
                    case "east":
                        offset[0] -= moveAmount;  //Decrease x offset
                        break;
                    default:
                        break;
                }

                //Update projection with new offset
                projectionKW.translate(offset);

                //Update all paths and circles
                svg.selectAll("path")
                    .transition()
                    .attr("d", path);

                svg.selectAll("circle")
                    .transition()
                    .attr("cx", function(d) {
                        return projectionKW([d.lon, d.lat])[0];
                    })
                    .attr("cy", function(d) {
                        return projectionKW([d.lon, d.lat])[1];
                    });

            });

    };

}
    /*


    d3.queue()
        .defer(d3.tsv, 'sf_crime.txt')
        .defer(d3.tsv, 'sfpd_districts.txt')
        .await(ready);

    function ready(error, data, handsPCA) {

        if (error) throw error;

        handsPCA.sort(function (a, b) {
            return a.V1 - b.V1;
        });
        var ids = handsPCA.map(function (a) {
            return a.id;
        });

        svg2 = d3.select('#hand_outline');
        svg3 = d3.select('#overlayHands');
        var width = +svg2.node().getBoundingClientRect().width;
        var height = +svg2.node().getBoundingClientRect().height;
        var margin = {
            top: 30,
            right: 30,
            bottom: 50,
            left: 30
        };

        xScale = d3.scaleLinear()
            .domain(d3.range(0, 1.5))
            .range([margin.left, width - margin.right]);

        yScale = d3.scaleLinear()
            .domain([0, 0.8])
            .range([height - margin.top, margin.bottom]);

        handsData = data;
        drawHand(defaultHandId, data);
        drawHandOverlay(defaultHandId, data);
        d3.select("#clickline").on('click', function () {
            update1(ids);
        });
    }

    function update1(ids) {

        var counter = 0;
        for (var i = 0; i < ids.length; i++) {
            //lineKW.defined(function (d) {return d.id == new_hand_id;})
            svg3.select("path")
                .datum(handsData)
                .transition()
                .duration(500)
                .ease(d3.easeLinear)
                .delay(500 * i)
                .attr("d", getLine(ids[i]))
                .on("end", function (d) {
                    counter = counter + 1; // safe as counter++;
                    var cloned = cloneSelection(svg3, path1, counter);
                });
        }
    }

    function cloneSelection(appendTo, toCopy, hnr) {
        toCopy.each(function () {
            var clone = svg3.node()
                .appendChild(this.cloneNode(true));
            console.log(hnr);
            d3.select(clone)
                .attr("class", "clone")
                .attr("id", "clone-" + hnr)
                .attr("stroke", piyg(hnr))
                .attr("stroke-width", 4);
        });
        return appendTo.selectAll('.clone');
    }

    function getLine(id) {
        //Define line generator
        return d3.line()
            .defined(function (d) {
                return d.id === id;
            })
            .x(function (d) {
                return xScale(d.x);
            })
            .y(function (d) {
                return yScale(d.y);
            })
            .curve(d3.curveCatmullRom);
    }


    function handleMouseClick(d, i) {

        // generate a color
        var color = "hsl(" + Math.random() * 360 + ",100%,50%)";

        // draw a hand of the selected point or remove it if
        // already drawn
        if (selectedHands[d.id]) {
            d3.select('#' + d.id).remove();
        } else {
            drawHand(d.id);
            d3.select('#' + d.id).attr("stroke", color);
        }
        // toggle selected
        selectedHands[d.id] = !selectedHands[d.id];

        // color point in the scatter plot
        svg.select('#point-' + d.id)
            .attr("fill", function (d) {
                if (selectedHands[d.id] === true) {
                    return color;
                }
                return "red"
            });
    }

    function handleMouseOver(d, i) {
        updateHand(d.id);
    }

    function drawHand(id) {
        //Create line
        svg2.append("path")
            .datum(handsData)
            .attr("class", "line")
            .attr("d", getLine(id))
            .attr("id", id)
            .attr("stroke", "grey")
            .attr("stroke-width", "5px")
            .attr("fill", "none")
            .attr("transform", "translate(" + (-width / 6) + "," + (height / 6) + ")");
    }

    function drawHandOverlay(id) {
        //Create line
        path1 = svg3.append("svg")
            .append("path")
            .datum(handsData)
            .attr("class", "line")
            .attr("d", getLine(id))
            .attr("id", "dynamicLine")
            .attr("stroke", "blue")
            .attr("stroke-width", "5px")
            .attr("fill", "none")
            .attr("transform", "translate(" + (-width / 6) + "," + (height / 6) + ")");
    }

    function updateHand(id) {
        //Update line
        svg2.select("path")
            .attr("d", getLine(id));
    }

}

function updatePoints() {
    var var1 = select.options[select.selectedIndex].value;
    var var2 = select.options[select2.selectedIndex].value;

    d3.select('#scatter-plot')
        .selectAll('circle')
        .transition()
        .ease(d3.easeCubic)
        .attr("cx", function (d) {
            return x(d[var1]) + "px";
        })
        .attr("cy", function (d) {
            return y(d[var2]) + "px";
        });
}

function populatePCASelectors(vars) {
    var select = document.getElementById("pca1-select");
    var select2 = document.getElementById("pca2-select");
    for (var i = 0; i < 39; i++) {
        var elem = vars[i];
        select.options.add(createOpt(elem));
        select2.options.add(createOpt(elem));
    }
    select.selectedIndex = 0;
    select2.selectedIndex = 1;
}

function createOpt(elem) {
    var opt = document.createElement("option");
    opt.value = elem;
    opt.text = elem;
    return opt;
}
*/