d3.select(window).on('load', init);

function init() {

    var svg = d3.select('#svg2');
    var wSF = +svg.node().getBoundingClientRect().width;
    var hSF = +svg.node().getBoundingClientRect().height - 50;
    //Number formatting for population values
    var Mercator = d3.geoMercator()
                       .translate([ wSF / 2, hSF / 2 ])
                       .scale(180000)
                       .center([ -122.447, 37.777 ]);

    //create path variable
    var pathSF = d3.geoPath()
                     .projection(Mercator);

    var offsetMercator = Mercator.translate();

    //Define what to do when dragging
    var dragging = function(d) {

        //Get the current (pre-dragging) translation offset
        var offset = Mercator.translate();

        //Augment the offset, following the mouse movement
        offset[0] += d3.event.dx;
        offset[1] += d3.event.dy;

        //Update projection with new offset
        Mercator.translate(offset);

        //Update all paths and circles
        svg.selectAll("path")
            .attr("d", pathSF);
        svg.selectAll("circle")
            .attr("cx", function(d) {
                return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[0]
            })
            .attr("cy", function(d) {
                return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[1]
            });
    };

    //Then define the drag behavior
    var drag = d3.drag()
                   .on("drag", dragging);

    //Create a container in which all pan-able elements will live
    var mapSF = svg.append("g")
                    .attr("id", "map");
    //                   .call(drag); //Bind the dragging behavior

    d3.queue()
        .defer(d3.json, 'sf_crime.geojson')
        .defer(d3.json, 'sfpd_districts.geojson')
        .defer(d3.json, 'days.json')
        .await(ready);

    function ready(error, crime, json, daysData) {

        if (error) {
            throw error;
        }

        var categories = crime.features
                             .map(function(a) {
                                 return a.properties.Category;
                             })
                             .filter(function(v, i, s) {
                                 return s.indexOf(v) === i;
                             });

        var select = document.getElementById("crime-category");
        var all = document.createElement("option");
        all.value = "ALL";
        all.text = "ALL";
        select.options.add(all);
        for (var i = 0; i < categories.length; i++) {
            var opt = document.createElement("option");
            opt.value = categories[i];
            opt.text = categories[i];
            select.options.add(opt);
        }
        select.selectedIndex = 0;

        var colorCrime = d3.scaleOrdinal().range(d3.schemeCategory10);
        var data = crime.features;

        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", pathSF)
            .style("fill", "lightgrey")
            .style("stroke", "blue")
            .style("stroke-width", 1);

        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[0]
            })
            .attr("cy", function(d) {
                return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[1]
            })
            .attr("r", 2)
            .attr("fill", "green")
            .attr("opacity", 0.3);

        d3.select("#crime-category")
            .on('change', function() {
                var selectedCategory = select.options[select.selectedIndex].value;
                if (selectedCategory !== "ALL") {
                    var dataset = crime.features.filter(function(a) {
                        return a.properties.Category === selectedCategory;
                    });

                    var circle = svg.selectAll("circle").data([]);
                    circle.exit().remove();

                    circle = svg.selectAll("circle").data(dataset);
                    circle.enter()
                        .append("circle")
                        .attr("cx", function(d) {
                            return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[0]
                        })
                        .attr("cy", function(d) {
                            return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[1]
                        })
                        .attr("r", 2)
                        .attr("fill", "green")
                        .attr("opacity", 0.3);
                } else {
                    svg
                        .selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d) {
                            return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[0]
                        })
                        .attr("cy", function(d) {
                            return Mercator([ d.geometry.coordinates[0], d.geometry.coordinates[1] ])[1]
                        })
                        .attr("r", 2)
                        .attr("fill", "green")
                        .attr("opacity", 0.3);
                }
            });

        //radial plot

        days = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ];

        var radialSvg = d3.select("#radial-plot");
        var rWidth = +radialSvg.node().getBoundingClientRect().width;
        var rHeight = +radialSvg.node().getBoundingClientRect().height;
        var radius = 215;

        var g = radialSvg.append("g").attr("transform", "translate(" + rWidth / 2 + "," + rHeight / 2 + ")");

        var x = d3.scaleBand().range([ 0, 2 * Math.PI ]);
        var y = d3.scaleLinear();

        x.domain(daysData.map(function(d, i) {
            return days[(i % 7)];
        }));
        y.domain([ 0, 2000 ])
            .range([ 50, 200 ]);

        var label = g.append("g")
                        .selectAll("g")
                        .data(daysData)
                        .enter()
                        .append("g")
                        .attr("transform", function(d, i) {
                            return "rotate(" + ((x(days[(i % 7)]) + x.bandwidth() / 3) * 180 / Math.PI - 90) + ")translate(" + radius + ",0)";
                        });

        label.append("text")
            .attr("transform", function(d) {
                return "rotate(90)";
            })
            .style("font-size", "14px")
            .text(function(d, i) {
                return days[(i % 7)];
            });

        var yAxis = g.append("g")
                        .attr("text-anchor", "end");

        var yTick = yAxis
                        .selectAll("g")
                        .data(y.ticks(5).slice(1))
                        .enter()
                        .append("g");

        yTick.append("circle")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-dasharray", "3,5")
            .attr("stroke-opacity", 0.2)
            .attr("r", y);

        yTick.append("circle")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("r", y(24));

        yTick.append("text")
            .attr("x", 0)
            .attr("y", function(d) {
                return -y(d);
            })
            .attr("dy", "0.15em")
            .attr("transform", "rotate(18)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text(y.tickFormat(10, "s"));

        yTick.append("text")
            .attr("x", 0)
            .attr("y", function(d) {
                return -y(d);
            })
            .attr("fill", "rgba(0,0,0,0.38)")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(18)")
            .text(y.tickFormat(10, "s"));

        g.append("g")
            .selectAll("g")
            .data(daysData)
            .enter()
            .append("path")
            .attr("d",
                  d3.arc()
                      .innerRadius(function(d) {
                          return 50;
                      })
                      .outerRadius(function(d, i) {
                          return y(d.Value);
                      })
                      .startAngle(function(d, i) {
                          return x(days[(i % 7)]);
                      })
                      .endAngle(function(d, i) {
                          return x(days[(i % 7)]) + x.bandwidth();
                      })
                      .padAngle(0.02)
                      .padRadius(radius))
            .attr("class", "day")
            .append("svg:title")
            .text(function(d) {
                return d.Value;
            });
    }
}
