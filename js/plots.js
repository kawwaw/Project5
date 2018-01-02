d3.select(window).on('load', init);

function init() {

    var svg = d3.select('#svg2');
    var wSF = +svg.node().getBoundingClientRect().width;
    var hSF = +svg.node().getBoundingClientRect().height;
    //Number formatting for population values
    var Mercator = d3.geoMercator()
                       .translate([ wSF / 2, hSF / 2 ])
                       .scale(150000)
                       .center([ -122.447, 37.777 ]);

    console.log("center" + Mercator.center() + " " + Mercator.scale() + " " + Mercator.translate());

    //create path variable
    var pathSF = d3.geoPath()
                     .projection(Mercator);

    var offsetMercator = Mercator.translate();
    console.log("offsetM" + offsetMercator);

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
        .await(ready);

    function ready(error, crime, json) {

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
        all.value = "ALL"
        all.text = "ALL"
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

        d3.select("#crime-category")
            .on('change', function() {
                var selectedCategory = select.options[select.selectedIndex].value;
                if (selectedCategory !== "ALL") {
                    var dataset = crime.features.filter(function(a) {
                        return a.properties.Category === selectedCategory;
                    });
                    var circle = svg.selectAll("circle").data(dataset);
                    circle.exit().remove();
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
    }
}
