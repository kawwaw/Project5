d3.select(window).on('load', init);

function init() {

    var svgSF = d3.select('#svg2');
    var wSF = +svgSF.node().getBoundingClientRect().width;
    var hSF = +svgSF.node().getBoundingClientRect().height;

    //Number formatting for population values
    var Mercator = d3.geoMercator()
        .translate([wSF/2,hSF/2])
        .scale(150000)
        .center([-122.447, 37.777]);

    console.log("center" + Mercator.center() + " " + Mercator.scale() + " " + Mercator.translate());


    //create path variable
    var pathSF =  d3.geoPath()
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
        console.log("kontrol" +  Mercator.translate());

        //Update all paths and circles
        svgSF.selectAll("path")
            .attr("d", pathSF)
        ;
        svgSF.selectAll("circle")
            .attr("cx",function(d){return Mercator([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0]})
            .attr("cy",function(d){return Mercator([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1]})
        ;

    };

    //Then define the drag behavior
    var drag = d3.drag()
        .on("drag", dragging);

    //Create a container in which all pan-able elements will live
    var mapSF = svgSF.append("g")
        .attr("id", "map")
        .call(drag);  //Bind the dragging behavior


    d3.queue()
        .defer(d3.json, 'sf_crime.geojson')
        .defer(d3.json, 'sfpd_districts.geojson')
        //.defer(d3.json, "https://raw.githubusercontent.com/d3/d3-geo/master/test/data/world-50m.json")
        .await(ready);

    function ready(error, crime, json) {

        if (error) throw error;


        console.log(json);
        console.log("crime under");
        console.log(crime);
        
        var categories = crime.features.map(function(a){
          return a.properties.Category;
        }).filter(function(v, i, s){
          return s.indexOf(v) === i;
        });

        console.log(categories);

        var colorCrime = d3.scaleOrdinal()
            .range(d3.schemeCategory10)
        ;

        var crimeFea = crime.features;
 //       console.log(crimeFea.properties);

        mapSF.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d",pathSF)
            .style("fill", "lightgrey")
            .style("stroke", "blue")
            .style("stroke-width", 1)
        ;

        //var colorKat = d3.scaleOrdinal(d3.schemePaired);

        console.log(d3.schemePaired);

        mapSF.selectAll("circle")
            .data(crime.features)
            .enter()
            .append("circle")
            .attr("cx",function(d){return Mercator([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0]})
            .attr("cy",function(d){return Mercator([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1]})
            .attr("r",2)
            //.attr("fill", "green")
           // .attr("opacity", 0.3)
            .style("fill", function (d) {
//                console.log(d.properties.Category);
                var Kat = d.properties.Category;
                if (Kat == "LARCENY/THEFT") {
                    return "red";
                }
                if (Kat == "OTHER OFFENSES") {
                    return "orange";
                }
                else {   return "green";}
            })
        ;
    }
}
