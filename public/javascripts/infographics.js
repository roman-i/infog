
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

var svgWidth = 1000,
    svgHeight = 2000,
    blockWidth = svgWidth / 7,
    blockHeight = svgHeight / 6
    lineHeight = 4;

var smallestWeek;  // global
var selectedDay;

var svg = d3
    .select("body")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);


function animateToDay(day) {
    var selector = "[day='"+day+"']";
    svg
        .select(selector)
        .attr("transform", function(d) {
            var curG = d3.select(this);
            var currentCoords = curG.attr("transform").replace("translate", "").replace("(", "").replace(")", "").split(",");
            var curX = parseFloat(currentCoords[0].replace(" ", ""));
            var curY = parseFloat(currentCoords[1].replace(" ", ""));
            curG.attr("oldY", curY);
            return "translate("+curX+", 0)";
        });
    selectedDay = day;

    // svg.appendChild(overlay);

    var overlay = svg.select(".overlay"); //.remove();
    svg.append(function() {
      return overlay.node();
    });

//    .each(function() {
//        d3.select(this).bringToFront();
//    })
    // overlay.each(bringToFront();

    // console.log(selectedDay);
    return;
}

function animateBack() {
     if (!selectedDay) {return;}
    var selector = "[day='"+selectedDay+"']";
    svg
        .select(selector)
        .attr("transform", function(d) {
            var curG = d3.select(this);
            var currentCoords = curG.attr("transform").replace("translate", "").replace("(", "").replace(")", "").split(",");
            var curX = parseFloat(currentCoords[0].replace(" ", ""));
            var curY = parseFloat(currentCoords[1].replace(" ", ""));
            var oldY = curG.attr("oldY");
            return "translate("+curX+", "+oldY+")";
        });

     var overlay = svg.select(".overlay"); //.remove();
     svg.insert(function() {
                      return overlay.node();
                    }, ":first-child");
    selectedDay = null;
}



function drawGrid() {
    // black background
    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "black");

    for (var i = 0; i < 8; i++) {
       svg.append("line")
        .attr("x1", 0)
        .attr("y1", i * blockHeight)
        .attr("x2", svgWidth)
        .attr("y2", i * blockHeight)
        .attr("stroke-width", 1)
        .attr("stroke", "white");

      svg.append("line")
        .attr("x1", i * blockWidth)
        .attr("y1", 0)
        .attr("x2", i * blockWidth)
        .attr("y2", svgHeight)
        .attr("stroke-width", 1)
        .attr("stroke", "white");
    }

    svg
        .append("rect")
        .attr("class", "overlay")
        .attr("fill", "black")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill-opacity", "0.5")
        .on("click", function(d) {
            animateBack();
            d3.event.stopPropagation();
        });

}

function getBlockCoordByDate(date) {
    var momDate = moment(date, "YYYYMMDD")

    var weekOffset = momDate.week() - smallestWeek;

    var dayOffset = momDate.day()

    return [dayOffset, weekOffset];
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




  console.log("FOO");
  console.log(rowsByDay);
  console.log()

  var sortedDays = rowsByDay.keys().sort(d3.ascending);

  var gs = svg
      .selectAll("g.day")
      .data(sortedDays)
      .enter()
      .append("svg:g")
      .attr("class", function(d) {return d;})
      .attr("day", function(d) {return d;})
      .attr("fill", "blue")
      .attr("width", function(d) {
        return blockWidth;
      }).attr("height", function(d) {
        return blockHeight;
      }).attr("transform", function(d) {
        var coords = getBlockCoordByDate(d);
        var absCoords = [blockWidth * coords[0], blockHeight * coords[1]];
        return "translate(" + absCoords[0] + ", " + absCoords[1] + ")";
      }).on("click", function(d) {
        animateToDay(d);
        d3.event.stopPropagation();
      });

  var itemsByDay2 = {};


var minutePixels = blockHeight / (24 * 60);

  gs
    .selectAll("rect")
    .data(function(d) { return rowsByDay.get(d);})
    .enter()
    .append("rect")
    .attr("x", function (d) {
            // day of the week
            // var dayOfTheWeek = d.playDate.day();
            var offset = 0; // dayOfTheWeek * blockWidth;
            return offset + (blockWidth - blockWidth*d.energy) / 2;
        }) // use horizontalOffset based on the day
        .attr("y", function (d) {
            // week offset
            // debugger;
            // var whichWeek = d.playDate.week() - smallestWeek;
            var weekOffset = 0; //whichWeek * blockHeight;

            // var minutesFromBeginningOfDay = d.playDate.hour() * 60  + d.playDate.minute();
            var numberOfRows = rowsByDay.get(d.groupDay).length;
            console.log(numberOfRows);
            var totalSpaceRequired = lineHeight * numberOfRows;
            var spaceLeft = blockHeight - totalSpaceRequired;
            var stackOffset = spaceLeft / 2;

            // already taken by others offset
            var curItems = itemsByDay2[d.groupDay] || 0;
            var curItemsOffset = curItems * lineHeight;
            itemsByDay2[d.groupDay] = ++curItems;

            // var hourMinuteOffset = minutePixels * minutesFromBeginningOfDay;

            return weekOffset + stackOffset + curItemsOffset;
        })   // use vertical offset based on the week.
        .attr("width", function (d) { return d.energy * blockWidth; })
        .attr("height", function (d) { return lineHeight; })
        .style("fill", function(d) { return "red"; });


    var itemsByDay = {};

  // now let's draw
  var rects = svg
    .selectAll("rect")
    .data(rows)
    .enter()
    .append("rect");



// var attrs = rects
//    .attr("x", function (d) {
//        // day of the week
//        var dayOfTheWeek = d.playDate.day();
//        var offset = dayOfTheWeek * blockWidth;
//        return offset + (blockWidth - blockWidth*d.energy) / 2;
//    }) // use horizontalOffset based on the day
//    .attr("y", function (d) {
//        // week offset
//        var whichWeek = d.playDate.week() - smallestWeek;
//        var weekOffset = whichWeek * blockHeight;
//
//        // var minutesFromBeginningOfDay = d.playDate.hour() * 60  + d.playDate.minute();
//        var numberOfRows = rowsByDay.get(d.groupDay);
//        console.log(numberOfRows);
//        var totalSpaceRequired = lineHeight * numberOfRows;
//        var spaceLeft = blockHeight - totalSpaceRequired;
//        var stackOffset = spaceLeft / 2;
//
//        // already taken by others offset
//        var curItems = itemsByDay[d.groupDay] || 0;
//        var curItemsOffset = curItems * lineHeight;
//        itemsByDay[d.groupDay] = ++curItems;
//
//        // var hourMinuteOffset = minutePixels * minutesFromBeginningOfDay;
//
//        return weekOffset + stackOffset + curItemsOffset;
//    })   // use vertical offset based on the week.
//    .attr("width", function (d) { return d.energy * blockWidth; })
//    .attr("height", function (d) { return lineHeight; })
//    .style("fill", function(d) { return "red"; });

});
