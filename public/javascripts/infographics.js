
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var useExactTime = getParameterByName('exacttime') === "true";

var svgWidth = 1000,
    svgHeight = 2000,
    blockWidth = svgWidth / 7,
    blockHeight = svgHeight / 6
    lineHeight = 3,
    overlayOpacity = 0.7,
    divider = 3,
    lineWidthScale = 0.4,
    verticalPadding = 20;

var smallestWeek;  // global
var selectedDay;

var svg = d3
    .select("body")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);


function toBottom(elem, position) {
    var pos = position || 1;
    svg.insert(function() {
                      return elem.node();
                    }, ":nth-child("+pos+")");
}

function toTop(elem) {
    svg.append(function() {
      return elem.node();
    });
}

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
        .attr("stroke-width", 1)
        .attr("stroke", "white");

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

function getBlockCoordByDate(date) {
    var momDate = moment(date, "YYYYMMDD");

    var weekOffset = momDate.week() - smallestWeek;

    var dayOffset = momDate.day()

    return [dayOffset, weekOffset];
}

function getDayOfWeek(date) {
    var momDate = moment(date, "YYYYMMDD");

    var dayOffset = momDate.day()

    return dayOffset;
}


/*
rect.on("click", function() {
alert("rect");
d3.event.stopPropagation();
});
svg.on("click", function() { alert("svg"); });
*/

// draw grid, horizontal first




d3.text("assets/files/music.csv", function(text) {
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

  rows = rows.sort(function(d) { d.sortDay; })

  // it is global
  smallestWeek = d3.min(rows, function(d) {return d.playDate.week();});

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

//  var gsBg = gs
//    .selectAll("rect")
//    .enter()
//    .append("rect")
//    .attr("width", blockWidth+ "")
//    .attr("height", blockHeight + "")
//    .attr("fill", "white")
//    .exit();

  var itemsByDay = {};
  var minutePixels = blockHeight / (24 * 60);
  console.log(minutePixels, blockHeight);

  var prevItem = null;
  var prevItemOffset = 0;
  var jumpBackTheshold = 4 * 60 * 60 * 1000;
  var jumpBackStep = 40;
  var prevPos = 0;

  gs
    .selectAll("rect")
    .data(function(d) { return rowsByDay.get(d);})
    .enter()
    .append("rect")
    .attr("x", function (d) {
            // day of the week
            // var dayOfTheWeek = d.playDate.day();
            var offset = 0; // dayOfTheWeek * blockWidth;
            return offset + (blockWidth - blockWidth*d.energy*lineWidthScale) / 2;
        }) // use horizontalOffset based on the day
        .attr("y", function (d) {

            if (useExactTime) {
                var minMax = minMaxTimeByDay.get(d.groupDay);
                //console.log(d.sortDay);
                // here it will be spread across the day
                var minutesFromBeginningOfDay = d.playDate.hour() * 60  + d.playDate.minute() - minMax.min;
                var hourMinuteOffset = minutePixels * minutesFromBeginningOfDay;
                console.log("res->", minutePixels, minutesFromBeginningOfDay, hourMinuteOffset);
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
            return "red";
        });

    var itemsByDay = {};

    var rects = svg
        .selectAll("rect")
        .data(rows)
        .enter()
        .append("rect");

});
