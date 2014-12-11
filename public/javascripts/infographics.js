function startD3() {
    
    var csvLocation = "";

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    var useExactTime = getParameterByName('exacttime');
    var colorSchema = getParameterByName('color');

    var svgWidth = 1000,
        svgHeight = 1200,
        blockWidth = (svgWidth - 200) / 7,
        blockHeight = svgHeight / 6
        lineHeight = 1,
        overlayOpacity = 0.7,
        divider = 3,
        lineWidthScale = 0.3,
        verticalPadding = 20;

    var smallestWeek;  // global
    var selectedDay;

    // add main SVG object
    var svg = d3
        .select(".svgcont")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

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
        var selector = "[day='"+day+"']";
        var dayG = svg
            .select(selector);
    //        .attr("transform", function(d) {
    //            var curG = d3.select(this);
    //            var currentCoords = curG.attr("transform").replace("translate", "").replace("(", "").replace(")", "").split(",");
    //            var curX = parseFloat(currentCoords[0].replace(" ", ""));
    //            var curY = parseFloat(currentCoords[1].replace(" ", ""));
    //            curG.attr("oldY", curY);
    //            return "translate("+curX+", 0)";
            //});
        selectedDay = day;

        // svg.appendChild(overlay);

        var overlay = svg.select(".overlay"); //.remove();
        toTop(overlay);
        toTop(dayG); // put day even on top of it

        var dayOfWeek = getDayOfWeek(day);
    //    var verticalSelector = "[dayOfWeek='"+dayOfWeek+"']";
    //    var allDaysOfWeek = svg
    //        .select(verticalSelector)
    //        .attr("transform", "translate(100, 100)");

    //    .each(function() {
    //        d3.select(this).bringToFront();
    //    })
        // overlay.each(bringToFront();

        // console.log(selectedDay);
        return;
    }

    // zoom out (not complete yet)
    function animateBack() {
        if (!selectedDay) {return;} // just to prevent some dbl clicks
        var selector = "[day='"+selectedDay+"']";
        selectedDay = null;
        var dayG = svg
            .select(selector);
    //        .attr("transform", function(d) {
    //            var curG = d3.select(this);
    //            var currentCoords = curG.attr("transform").replace("translate", "").replace("(", "").replace(")", "").split(",");
    //            var curX = parseFloat(currentCoords[0].replace(" ", ""));
    //            var curY = parseFloat(currentCoords[1].replace(" ", ""));
    //            var oldY = curG.attr("oldY");
    //            return "translate("+curX+", "+oldY+")";
    //        });

        var overlay = svg.select(".overlay"); //.remove();
        toBottom(dayG, 2); // comes before overlay, because overlay should come below
        toBottom(overlay);
    }

    function addBpmLegend() {
        var data = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

        var legendContainer = svg
              .append("g")
              .attr('transform', function(d, i) {
                  return 'translate(850, 0)';
              });

        var curHorizOffset = 0;
        var barHeight = 50;
        var barPadding = 10;

        var legend = legendContainer
            .selectAll(".bpmLegend")
            .data(data)
            .enter()
            .append("g")
            .attr('class', 'bpmLegend')
            .attr('transform', function(d, i) {
                var horz = barPadding + curHorizOffset;
                var vert = 10;
                curHorizOffset = horz;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', 1.5)
            .attr('height', function(d) {
                return barHeight * d;
            })
            .attr("y", function(d) {
                return barHeight * (1-d);
            })
            .style('fill', "white");


         // "energy" title
         legendContainer
             .append("text")
             .attr('x', 40)
             .attr('y', 10)
             .attr("fill", "white")
             .text("energy");

        // start and end marks
        legendContainer
           .append("text")
           .attr('x', 0)
           .attr('y', barHeight + 30)
           .attr("fill", "white")
           .text("0.1");

        legendContainer
           .append("text")
           .attr('x', 80)
           .attr('y', barHeight + 30)
           .attr("fill", "white")
           .text("0.9");
//
//        legend.append('text')
//            .attr('x', 50)
//            .attr('y', 1)
//            .attr("fill", "#E6E7E8")
//            .text(function(d) {
//                return d;
//            });

    }

    function addColorsList(colors) {

        var genresMap = d3.nest()
            .key(function(d) { return d.genre})
            .rollup(function(items) { return items[0]; }) // this is always one
            .map(colors, d3.map);

//        var higherGenreMap = d3.nest()
//             .key(function(d) { return d.higherGenre})
//             .rollup(function(items) { return items }) // this is always one
//             .map(colors, d3.map);

        var limitedColorsWithDups = colors.map(function(v) {
            if (v.higherGenre) {
                // for small genres
                return {
                    "genre": v.higherGenre,
                    "color": genresMap.get(v.higherGenre).color
                }
            } else { // for higher colors
                return {
                    "genre": v.genre,
                    "color": v.color
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
              return 'translate(850, 100)';
          });

        // "genres" title
        legendContainer
            .append("text")
            .attr('x', 50)
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


                allItems.style("fill-opacity", 0.12);

                var selector = "[hgenre='"+d.genre+"']";
                var itemsWithGenre = svg
                    .selectAll(selector);
                itemsWithGenre.style("fill-opacity", 1.0);

                d.isSelected = true;
                                //item
            });
//
//            .on('mouseout', function(d){
//                var allItems = svg
//                    .selectAll(".item");
//
//                allItems.style("fill-opacity", 1.0);
//            });

        legend.append('rect')
            .attr('width', 30)
            .attr('height', 1.5)
            .style('fill', function(d) {
                return d.color;
            });

        legend.append('text')
            .attr('x', 50)
            .attr('y', 1)
            .attr("fill", "#E6E7E8")
            .text(function(d) {
                return d.genre;
            });
    }

    // draw the backgroud, grid and overlay.
    function drawGrid() {
        // black background
        var gridContainer = svg.append("svg:g");

        gridContainer.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "black");

        for (var i = 0; i < 7; i++) {
           // horizontal
           svg.append("line")
            .attr("x1", 0)
            .attr("y1", i * blockHeight)
            .attr("x2", svgWidth)
            .attr("y2", i * blockHeight)
            .attr("stroke-width", 30)
            .attr("stroke", "black");

          // vertical lines
          gridContainer.append("line")
            .attr("x1", (i + .5) * blockWidth)
            .attr("y1", 0)
            .attr("x2", (i + .5) * blockWidth)
            .attr("y2", svgHeight)
            .attr("stroke-width", 1)
            .attr("stroke", "white");
        }

        // overlay, should be separate from the grid
        svg
            .append("rect")
            .attr("class", "overlay")
            .attr("fill", "black")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill-opacity", overlayOpacity + "")
            .on("click", function(d) {
                animateBack();
                d3.event.stopPropagation();
            });

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


    /*
    rect.on("click", function() {
    alert("rect");
    d3.event.stopPropagation();
    });
    svg.on("click", function() { alert("svg"); });
    */

    // draw grid, horizontal first








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
        var minutePixels = blockHeight / (24 * 60);

        var prevItem = null;
        var prevItemOffset = 0;
        var jumpBackTheshold = 4 * 60 * 60 * 1000;
        var jumpBackStep = 40;
        var prevPos = 0;

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
            .attr("y", function (d) {
                if (useExactTime === "exact") {
                    var minutesFromBeginningOfDay = d.playDate.hour() * 60  + d.playDate.minute();
                    var hourMinuteOffset = minutePixels * minutesFromBeginningOfDay;
                    return hourMinuteOffset;
                }
                else if (useExactTime) {
                    var minMax = minMaxTimeByDay.get(d.groupDay);
                    // here it will be spread across the day
                    var minutesFromBeginningOfDay = d.playDate.hour() * 60  + d.playDate.minute() - minMax.min;
                    var hourMinuteOffset = minutePixels * minutesFromBeginningOfDay;
                    // prevItemOffset

                    var newPos = hourMinuteOffset;
                    if (prevItem) {
                        if (prevItem.groupDay === d.groupDay) {
                            if ((d.playDate.valueOf() - prevItem.playDate.valueOf() < jumpBackTheshold)) {
                                newPos = prevPos + divider*2;
                                if (d.groupDay === '20141024') {
                                    console.log("using divider", d.sortDay, prevPos, newPos);
                                }
                            }
                            else {
                                newPos -= jumpBackStep;
                            }
                        } else {
                            prevPos = 0;
                        }
                    }

                    prevItem = d;
                    prevPos = newPos;

                    if (d.groupDay === '20141024') {
                        console.log(d.sortDay, newPos, prevPos);
                    }

                    return newPos + verticalPadding;
                } else {
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
                }
            })   // use vertical offset based on the week.
            .attr("width", function (d) {
                return d.energy * blockWidth * lineWidthScale;
            })
            .attr("height", function (d) {
                return lineHeight;
            })
            .style("fill", function(d) {
                if (colorSchema){
                    if (d.genres.length > 0) {
                        var firstGenre = d.genres[0];
                        if (firstGenre === "") {
                            console.log("no genre for ", d);
                            return "red";
                        }
                        if (!genresMap.get(firstGenre)) {
                            console.log("no color found for ", firstGenre);
                            return "red";
                        }

                        if (colorSchema === "simple") {
                            // console.log(firstGenre, genresMap.get(firstGenre).higherGenre);
                            firstGenre = genresMap.get(firstGenre).higherGenre;
                        }
                        // console.log('"' + firstGenre + '"');
                        var color = genresMap.get(firstGenre).color;
                        // console.log(firstGenre, color);
                        return color;
                    } else {
                        console.log("no genres for ", d);
                        return "red";
                    }
                } else {
                    return "red";
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
                    console.log("--->", genresMap.get(d.genres[0]))
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