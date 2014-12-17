function startD3() {
    
    var csvLocation = "";

    var svgWidth = 1000, // total width of our SVG
        // total height of the SVG
        svgHeight = 750,

        // this is a day block, we have 7 days + some space at the right for legend. that's why we subtract and then divide
        blockWidth = (svgWidth - 300) / 7,
        // we have 6 weeks, so we are just dividing total height to 6
        blockHeight = svgHeight / 6

        // height of the single item (song)
        lineHeight = 2,

        // spacing between items mentioned above
        divider = 0.5,

        // width of the line, so if energy is 1.0 and this lineWidthScale=0.3 then the width of the bar will be 0.3 of day block width
        lineWidthScale = 0.3,

        // vertical padding in a day (so the total spacing between 2 days would be verticalPadding * 2)
        verticalPadding = 50,

        // we have horizontal grid (currently black)
        horizontalLineHeight = 20,

        // color of horizontal lines
        horizontalLineColor = "black",

        // background color
        backgroundColor = "black",

        // we have vertical lines in our grid, that the color
        verticalLineColor = "white",

        // width of the vertical lines in a grid
        verticalLineWidth = "0.7",

        // we have a list of genres at the right, this is a text color for it
        genreTitleColor = "#A7A9AB",

        // that is left padding for genre titles (probably shouldn't be smaller than genre line width)
        genreTitleLeftPadding = "50",

        // vertical padding for genre title
        genreTitleTopPadding = "1.2",

        // when you click on a day it does a transition and the scale appears, this is the color for the text on this scale
        dayLegendTextColor = "#E6E7E8",

        // absolute position for genres list
        genresListLeft = "750",
        genresListTop = "100",

        // when something is highlighted everything else gets this opacity
        opacityOfAllItemsWhenSomethingSelected = "0.15",

        // we have energy legend on the right, this is the color we use
        energyLegendColor = "white";

    var minutePixels = blockHeight / (24 * 60);

    var smallestWeek;  // global
    var selectedDay;

    // add main SVG object
    var svg = d3
        .select(".svgcont")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
        .attr("preserveAspectRatio", "xMidYMid");

    var aspect = svgWidth / svgHeight;

//    function updateWindow(e){
//        svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
//    }
//    window.onresize = updateWindow;

    var zoomedIn = false;

    // moves element of svg to the bottom (under all elements)
    function toBottom(elem, position) {
        var pos = position || 1;
        svg.insert(function() {
                          return elem.node();
                        }, ":nth-child("+pos+")");
    }

    // moves element of svg to the top (on top of all elements)
    function toTop(elem) {
        svg.append(function() {
          return elem.node();
        });
    }

    // zoom in to specific day
    function animateToDay(day) {
        if (zoomedIn) {
            zoomedIn = false;
            var dayG = svg.select("[day='"+selectedDay+"']");
            var allItems = svg.selectAll(".item");

            allItems.style("fill-opacity", 1.0);

            dayG
                .selectAll(".item")
                .transition()
                .duration(1000)
                .attr("y", function(d) {
                    return d3.select(this).attr("stacked_y");
                });

            svg.select(".day_scale").style("fill-opacity", 0.0);
        } else {
            var dayG = svg.select("[day='"+day+"']");
            selectedDay = day;

            var dayOfWeek = getDayOfWeek(day);

            var allItems = svg.selectAll(".item");

            allItems.style("fill-opacity", opacityOfAllItemsWhenSomethingSelected);

            dayG
                .selectAll(".item")
                .style("fill-opacity", 1.0)
                .transition()
                .duration(1000)
                .attr("y", function(d) {
                    return d3.select(this).attr("exact_y");
                });

            zoomedIn = true;
            svg
                .select(".day_scale")
                .style("fill-opacity", 1.0)
                .attr('transform', function(d, i) {
                    return dayG.attr("transform");
                });
        }

        return;
    }

    function addBpmLegend() {
        var data = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

        var legendContainer = svg
              .append("g")
              .attr('transform', function(d, i) {
                  return 'translate(800, 0)';
              });

        var vertOffset = 0;
        var barHeight = 50;
        var barPadding = 10;

        var legend = legendContainer
            .selectAll(".bpmLegend")
            .data(data)
            .enter()
            .append("g")
            .attr('class', 'bpmLegend');

        var pyramidShift = 25;

        legend.append('rect')
            .attr('width', function(d) {
               return barHeight * (1 - d);
            })
            .attr('height', 1.5)
            .attr("y", function(d) {
                return pyramidShift + barHeight * (1-d);
            })
            .attr("x", function(d) {
                return -barHeight * ((1-d)/2);
            })
            .style('fill', energyLegendColor);


         // "energy" title
         legendContainer
             .append("text")
             .attr('x', 0)
             .attr('y', 10)
             .attr("fill", energyLegendColor)
             .text("energy");

        // start and end marks
        legendContainer
           .append("text")
           .attr('y', pyramidShift+5)
           .attr('x', 30)
           .attr("fill", energyLegendColor)
           .text("0.1");

        legendContainer
           .append("text")
           .attr('x', 30)
           .attr('y', 80)
           .attr("fill", energyLegendColor)
           .text("0.9");

    }

    function addColorsList(colors) {

        var genresMap = d3.nest()
            .key(function(d) { return d.genre})
            .rollup(function(items) { return items[0]; }) // this is always one
            .map(colors, d3.map);

        var limitedColorsWithDups = colors.map(function(v) {
            if (v.higherGenre) {
                // for small genres
                return {
                    genre: v.higherGenre,
                    color: genresMap.get(v.higherGenre).color
                }
            } else { // for higher colors
                return {
                    genre: v.genre,
                    color: v.color
                }
            }
        });

        // remove dups
        var limitedColors = d3.nest()
                    .key(function(d) { return d.genre})
                    .rollup(function(items) { return items[0]; }) // this is always one
                    .entries(limitedColorsWithDups)
                    .map(function(d){
                        return d.values
                    });

        var curVertOffset = 15; // to give some space for a header
        var legendContainer = svg
          .append("g")
          .attr('transform', function(d, i) {
              return 'translate('+ genresListLeft +', ' + genresListTop + ')';
          });

        // "genres" title
        legendContainer
            .append("text")
            .attr('x', genreTitleLeftPadding)
            .attr('y', 10)
            .attr("fill", "white")
            .text("genres");

        var legend = legendContainer
            .selectAll(".legend")
            .data(limitedColors)
            .enter()
            .append("g")
            .attr('class', 'legend item')
            .attr('hgenre', function(d) {return d.genre;})
            .attr('transform', function(d, i) {
                var horz = 0;
                var vert = 15 + curVertOffset;
                curVertOffset = vert;
                return 'translate(' + horz + ',' + vert + ')';
            })
            .on('click', function(d){

                var allItems = svg
                    .selectAll(".item");


                if (d.isSelected || false) {
                    d.isSelected = false;
                    allItems.style("fill-opacity", 1.0);
                    return;
                }


                allItems.style("fill-opacity", opacityOfAllItemsWhenSomethingSelected);

                var selector = "[hgenre='"+d.genre+"']";
                var itemsWithGenre = svg
                    .selectAll(selector);
                itemsWithGenre.style("fill-opacity", 1.0);

                d.isSelected = true;
                                //item
            });

        legend.append('rect')
            .attr('width', 30)
            .attr('height', 1.5)
            .style('fill', function(d) {
                return d.color;
            });

        legend.append('text')
            .attr('x', genreTitleLeftPadding)
            .attr('y', genreTitleTopPadding)
            .attr("fill", genreTitleColor)
            .text(function(d) {
                return d.genre;
            });
    }

    // draw the backgroud, grid and overlay.
    function drawGrid() {
        var gridContainer = svg.append("svg:g");

        // black background
        gridContainer.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", backgroundColor);

        // draw horizontal and vertical lines
        for (var i = 0; i < 7; i++) {
           // horizontal lines are black
           svg.append("line")
            .attr("x1", 0)
            .attr("y1", i * blockHeight)
            .attr("x2", svgWidth)
            .attr("y2", i * blockHeight)
            .attr("stroke-width", horizontalLineHeight)
            .attr("stroke", horizontalLineColor);

          // vertical lines
          gridContainer.append("line")
            .attr("x1", (i + .5) * blockWidth)
            .attr("y1", 0)
            .attr("x2", (i + .5) * blockWidth)
            .attr("y2", svgHeight)
            .attr("stroke-width", verticalLineWidth)
            .attr("stroke", verticalLineColor);
        }
    }

    // this draws 7am - 12pm - 12pm scale when you select specific day
    function createDayScale() {
        var day_scale = svg
            .append("svg:g")
            .attr("class", "day_scale")
            .style("fill-opacity", 0.0);

        // this draws 7am mark. it is at the top of the day block
        day_scale
            .append('text')
            .attr('x', 0)
            .attr('y', 10)
            .attr("fill", dayLegendTextColor)
            .text("7am");

        // this draws 12pm mark. it is located at 1/3 of the total height
        day_scale
            .append('text')
            .attr('x', 0)
            .attr('y', blockHeight / 3)
            .attr("fill", dayLegendTextColor)
            .text("12pm");

        // this draws 12am mark. it is at the bottom of the day block
        day_scale
            .append('text')
            .attr('x', 0)
            .attr('y', blockHeight)
            .attr("fill", dayLegendTextColor)
            .text("12am");
    }

    // helper function to calculate something
    function getBlockCoordByDate(date) {
        var momDate = moment(date, "YYYYMMDD");

        var weekOffset = momDate.isoWeeks() - smallestWeek;

        var dayOffset = monToSunDay(momDate);

        return [dayOffset, weekOffset];
    }

    // helper function to calculate day of the week (so monday is 0, tuesday is 1 etc)
    function getDayOfWeek(date) {
        var momDate = moment(date, "YYYYMMDD");

        var dayOffset = monToSunDay(momDate);

        return dayOffset;
    }

    function monToSunDay(momentdt) {
        var day = momentdt.isoWeekday() - 1; // it will be Mon - Sun
        return day;
    }

    // load music file first
    d3.text(csvLocation + "music.csv", function(text) {

        // then load genres file
      d3.text(csvLocation + "genre.csv", function(genretext) {

          // convert genres from csv to objects
          // {genre: 'folk rock', color: '#498393', higherGenre: 'rock'}
        var genres = d3.csv.parseRows(genretext).map(function(row) {
           return {
              genre: row[0],
              color: "#" + row[1],
              higherGenre: row[2]
           }
        });



          // convert it to a map, so we can easiry find color by genre name
        var genresMap = d3.nest()
            .key(function(d) { return d.genre})
            .rollup(function(colors) { return colors[0]; }) // this is always one
            .map(genres, d3.map);

          // parse music file and create objects to operate with
        var rows = d3.csv.parseRows(text).map(function(row) {
            var momentDate = moment(row[1], "MMM DD, YYYY at HH:mmA"); // November 04, 2014 at 12:07PM
            return {
                artist: row[0],
                playDate: momentDate,
                title: row[2],
                energy: row[3],
                genres: row[4].split(","),
                groupDay: momentDate.format("YYYYMMDD"), // sortable/groupable day
                sortDay: momentDate.format("YYYYMMDDHHmm")
            }
        });


        drawGrid();

        addColorsList(genres);

        addBpmLegend();

        rows = rows.sort(function(d) { d.sortDay; })


        createDayScale();

        // it is global
        smallestWeek = d3.min(rows, function(d) {return d.playDate.isoWeeks();});

        var rowsByDay = d3
            .nest()
            .key(function(d) { return d.groupDay})
            .sortKeys(d3.ascending)
            .map(rows, d3.map);

        var minMaxTimeByDay = d3
            .nest()
            .key(function(d) { return d.groupDay})
            .rollup(function(items) { return {
                max: d3.max(items, function(d) { return d.playDate.hour() * 60  + d.playDate.minute(); }),
                min: d3.min(items, function(d) { return d.playDate.hour() * 60  + d.playDate.minute(); })
            }})
            .map(rows, d3.map);

        var sortedDays = rowsByDay.keys().sort(d3.ascending);

        // these are day blocks, just "g" containers
        var gs = svg
            .selectAll("g.day")
            .data(sortedDays)
            .enter()
            .append("svg:g")
            .attr("class", function(d) {
                return d;
            })
            .attr("day", function(d) {
                return d;
            })
            .attr("dayOfWeek", function(d) {
                return getDayOfWeek(d);
            })
            .attr("transform", function(d) {
                var coords = getBlockCoordByDate(d);
                var absCoords = [blockWidth * coords[0], blockHeight * coords[1]];
                return "translate(" + absCoords[0] + ", " + absCoords[1] + ")";
            })
            .on("click", function(d) {
                animateToDay(d);
                d3.event.stopPropagation();
            });

        var itemsByDay = {};

        //  adding actual bars
        gs
            .selectAll("rect")
            .data(function(d) { return rowsByDay.get(d);})
            .enter()
            .append("rect")
            .attr("class", "item")
            .attr("x", function (d) {
                    // day of the week
                    // var dayOfTheWeek = d.playDate.day();
                    var offset = 0; // dayOfTheWeek * blockWidth;
                    return offset + (blockWidth - blockWidth*d.energy*lineWidthScale) / 2;
                }) // use horizontalOffset based on the day
            .attr("exact_y", function(d) {
                var minutesFromBeginningOfDay = (d.playDate.hour() - 7) * 60  + d.playDate.minute();
                var hourMinuteOffset = minutePixels * minutesFromBeginningOfDay;
                return hourMinuteOffset;
            })
            .attr("stacked_y", function (d) {
                // here we just stack then one on top of another
                var numberOfRows = rowsByDay.get(d.groupDay).length;
                var totalSpaceRequired = (lineHeight + divider) * numberOfRows;
                var spaceLeft = blockHeight - 2*verticalPadding - totalSpaceRequired;
                var stackOffset = spaceLeft / 2;

                // already taken by others offset
                var curItems = itemsByDay[d.groupDay] || 0;
                var curItemsOffset = curItems * (lineHeight + divider);
                itemsByDay[d.groupDay] = ++curItems;
                return stackOffset + curItemsOffset + verticalPadding;
            })   // use vertical offset based on the week.
            .attr("y", function (d) {
                return d3.select(this).attr("stacked_y");
            })
            .attr("width", function (d) {
                return d.energy * blockWidth * lineWidthScale;
            })
            .attr("height", function (d) {
                return lineHeight;
            })
            .style("fill", function(d) {
                if (d.genres.length > 0) {
                    var firstGenre = d.genres[0];
                    if (firstGenre === "") {
                        console.log("no genre for ", d);
                        return "black";
                    }
                    if (!genresMap.get(firstGenre)) {
                        console.log("no color found for ", firstGenre);
                        return "black";
                    }

                    firstGenre = genresMap.get(firstGenre).higherGenre;
                    var color = genresMap.get(firstGenre).color;
                    return color;
                } else {
                    console.log("no genres for ", d);
                    return "black";
                }
            })
            .attr("genre", function(d) {
                if (d.genres.length > 0) {
                    return d.genres[0];
                } else {
                    return "";
                }
            })
            .attr("hgenre", function(d) {
                if (d.genres.length > 0 && d.genres[0] && d.genres[0] != " ") {
                    return genresMap.get(d.genres[0]).higherGenre;
                } else {
                    return "";
                }
            });


        var itemsByDay = {};

        var rects = svg
            .selectAll("rect")
            .data(rows)
            .enter()
            .append("rect");

        })


    });

}