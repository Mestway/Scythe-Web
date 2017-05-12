var CHARTS = {
  options: null,
  render: function (el, data, chartType) {
    for (var i = 0; i < CHARTS.options.length; i ++) {
    if (CHARTS.options[i].value == chartType)
      CHARTS.options[i].render(el, data);
    }
  }
}

CHARTS.options = 
  [{
    value: "hist-1", label: "Histogram (c1)",
    filter: function (table) { return table["header"].length >= 2; }, 
    render: function (el, data) { genHistogram(data, el, "hist-1"); }},
  {
    value: "hist-2", label: "Histogram (c2)",
    filter: function (table) { return table["header"].length >= 3; },
    render: function (el, data) { genHistogram(data, el, "hist-2"); }
  },
  {
    value: "hist-3", label: "Histogram (c2-c1)",
    filter: function (table) { return table["header"].length >= 3; },
    render: function (el, data) { genHistogram(data, el, "hist-3"); }
  },
  {
    value: "2dhist-1", label: "2D Histogram (c1,c2)", 
    filter: function (table) { return table["header"].length >= 3; },
    render: function (el, data) { gen2DHistogram(data, el, "2dhist-1"); }
  },
  {
    value: "2dhist-2", label: "2D Histogram (c2-c1,c3-1)",
    filter: function (table) { return table["header"].length >= 4; },
    render: function (el, data) { gen2DHistogram(data, el, "2dhist-2"); }
  },
  {
    value: "vega-test", label: "Vega Test",
    filter: function (table) { return true; },
    render: function (el, data) { 
      var spec = "https://raw.githubusercontent.com/vega/vega/master/test/specs-valid/bar.vg.json";
      vega.embed(el, spec, {"actions" : false});
    }
  },
  {value: "vega-test-2", label: "Compassql Test",
    filter: function (table) {return true; },
    render: function (el, data) { 
      var spec = "https://raw.githubusercontent.com/vega/vega/master/test/specs-valid/bar.vg.json";
      vega.embed(el, spec, {"actions" : false});
    }
  }];

// creating histogram from a table datastructure
// supported features include histogram on c1, c2, or c2-c1
function genHistogram(table, divId, chartType) {
  
  // whitespace on either side of the bars in units of MPG
  var binmargin = .5; 
  var margin = {top: 40, right: 20, bottom: 40, left: 50};
  var height = $(divId).height() - margin.top - margin.bottom;
  var width = Math.min($(divId).width() - margin.left - margin.right, 
                       $(divId).height() + 200 - margin.left - margin.right);

  var xAxisLabel = "";
  if (chartType == "hist-1")
    xAxisLabel = table["header"][1];
  else if (chartType == "hist-2")
    xAxisLabel = table["header"][2];
  else if (chartType == "hist-3")
    xAxisLabel = table["header"][2] + " - " + table["header"][1];

  var ymax = 0;

  if (chartType == "hist-1" || chartType == "hist-2") {
    var targetCol = chartType == "hist-1" ? 1 : 2;
    var cnt_data = {};
    for (var i = 0; i < table["content"].length; i ++) {
      if (table["content"][i][targetCol] in cnt_data) {
        cnt_data[table["content"][i][targetCol]] ++;
        if (cnt_data[table["content"][i][targetCol]] > ymax)
          ymax = cnt_data[table["content"][i][targetCol]];
      } else {
        cnt_data[table["content"][i][targetCol]] = 1;
        if (cnt_data[table["content"][i][targetCol]] > ymax)
          ymax = cnt_data[table["content"][i][targetCol]];
      }
    }
  } else if (chartType == "hist-3") {
    var cnt_data = {};
    for (var i = 0; i < table["content"].length; i ++) {
      if ((table["content"][i][2] - table["content"][i][1]) in cnt_data) {
        cnt_data[(table["content"][i][2] - table["content"][i][1])] ++;
        if (cnt_data[(table["content"][i][2] - table["content"][i][1])] > ymax)
          ymax = cnt_data[(table["content"][i][2] - table["content"][i][1])];
      } else {
        cnt_data[(table["content"][i][2] - table["content"][i][1])] = 1;
        if (cnt_data[(table["content"][i][2] - table["content"][i][1])] > ymax)
          ymax = cnt_data[(table["content"][i][2] - table["content"][i][1])];
      }
    }
  }

  var binsize = 1;
  var minbin = 0;
  var maxbin = 60;
  var numbins = (maxbin - minbin) / binsize;
  // Set the limits of the x axis
  var xmin = 0;
  var xmax = 60;

  var binwidth = (width - 0) / 62 - 2 * binmargin;

  var histdata = [];
  for (var i in cnt_data) {
    var dt = { 
      numfill: parseInt(cnt_data[i]), 
      meta: parseInt(i),
    };
    histdata.push(dt);
  }

  // This scale is for determining the widths of the histogram bars
  // Must start at 0 or else x(binsize a.k.a dx) will be negative
  var x = d3.scaleLinear()
  .domain([-1, (xmax - xmin) + 1])
  .range([0, width]);

  // Scale for the placement of the bars
  var y = d3.scaleLinear()
  /*.domain([0, d3.max(histdata, function(d) { 
            return d.numfill; 
          })])*/
  .domain([0, ymax])
  .range([height, 0]);

  var xAxis = d3.axisBottom().scale(x).ticks(10);
  var yAxis = d3.axisLeft().scale(y).ticks(8);

  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .direction('e')
  .offset([0, 20])
  .html(function(d) {
    return '<table id="tiptable">' + "<tr><td>Label: "
            + d.meta + "</td></tr><tr><td> Count: " + d.numfill + "</td></tr></table>";
  });

  // put the graph in the "mpg" div
  var svg = d3.select(divId).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + 
              margin.top + ")");

  svg.call(tip);

  // set up the bars
  var bar = svg.selectAll(".bar")
    .data(histdata)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) { return "translate(" + 
         (x(d.meta * binsize) - binwidth / 2) + "," + y(d.numfill) + ")"; })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  // add rectangles of correct size at correct location
  bar.append("rect")
//    .attr("x",)
    .attr("width", binwidth)
    .style("fill", function(d) {
      if (! isNaN(d.meta)) {
        return "#337ab7";
      } else {
        return "#d9534f";
      }
    })
    .attr("height", function(d) { return height - y(d.numfill); });

  // add the x axis and x-label
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("text")
    .attr("class", "xlabel")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .text(xAxisLabel);//.text("c3 - c2");

  // add the y axis and y-label
  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0,0)")
      .call(yAxis);

  svg.append("text")
    .attr("class", "ylabel")
    .attr("y", 0 - margin.left) // x and y switched due to rotation
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("count");//.text("Count");
}

function gen2DHistogram(table, divId, chartType) {

  // whitespace on either side of the bars in units of MPG
  var binmargin = .2; 
  var margin = {top: 40, right: 20, bottom: 40, left: 50};
  var height = $(divId).height() - margin.top - margin.bottom;
  var width = Math.min($(divId).width() - margin.left - margin.right, 
                       $(divId).height() + 200 - margin.left - margin.right);

  var xvals = [];
  var yvals = [];
  var data = [];
  var maxcnt = 1;

  var xydata = []

  if (table["header"].length < 3)
    return;

  var xAxisLabel = "";
  var yAxisLabel = "";
  if (chartType == "2dhist-1") {
    xAxisLabel = table["header"][1];
    yAxisLabel = table["header"][2];
  } else if (chartType == "2dhist-2") {
    xAxisLabel = table["header"][2] + " - " + table["header"][1];
    yAxisLabel = table["header"][3] + " - " + table["header"][1];
  }

  var map = {}
  if (chartType == "2dhist-1") {
    for (var i = 0; i < table["content"].length; i++) {
      if (table["content"][i][1] == "" || table["content"][i][2] == "" 
          || isNaN(table["content"][i][1]) || isNaN( table["content"][i][2])) 
        continue;
      x = Number.parseInt(table["content"][i][1]);
      y = Number.parseInt(table["content"][i][2]);
      if (x in map) {
        if (y in map[x]) {
          map[x][y] += 1;
        } else {
          map[x][y] = 1;
        }
      } else {
        map[x] = {};
        map[x][y] = 1;
      }
    }
  } else if (chartType == "2dhist-2") {
    for (var i = 0; i < table["content"].length; i++) {
      if (table["content"][i][1] == "" || table["content"][i][2] == "" || table["content"][i][3] == "" 
          || isNaN(table["content"][i][1]) || isNaN(table["content"][i][2]) || isNaN(table["content"][i][3])) 
        continue;
      x = Number.parseInt(table["content"][i][2] - table["content"][i][1]);
      y = Number.parseInt(table["content"][i][3] - table["content"][i][1]);
      if (x in map) {
        if (y in map[x]) {
          map[x][y] += 1;
        } else {
          map[x][y] = 1;
        }
      } else {
        map[x] = {};
        map[x][y] = 1;
      }
    }
  }

  for (var i in map) {
    for (var j in map[i]) {
      var x = Number.parseInt(i);
      var y = Number.parseInt(j);
      var z = Number.parseInt(map[i][j]);
      if (z > maxcnt) {
        maxcnt = z; 
      }
      xydata.push([x,y,z]);
      xvals.push[x];
      yvals.push[y];
    }
  }

  // Set the limits of the x axis
  var xmin = 0;
  var xmax = 60;

  // This scale is for determining the widths of the histogram bars
  // Must start at 0 or else x(binsize a.k.a dx) will be negative
  var x = d3.scaleLinear()
            .domain([0, (xmax - xmin)])
            .range([0, width]);

  // Scale for the placement of the bars
  var x2 = d3.scaleLinear()
             .domain([xmin-1, xmax+1])
             .range([0, width]);

  var y = d3.scaleLinear()
            .domain([-1,56])
            .range([height, 0]);

  var xAxis = d3.axisBottom().scale(x2);
  var yAxis = d3.axisLeft().scale(y).ticks(8);

  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .direction('e')
  .offset([0, 20])
  .html(function(d) {
    return '<table id="tiptable"><tr><td>Label1: ' 
    + d[0] + "</td></tr><tr><td> Label2: " 
    + d[1] + "</td></tr><tr><td>Count: " 
    + d[2] + "</td></tr></table>";
  });

  // put the graph in the "mpg" div
  var svg = d3.select(divId).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.call(tip);

  // set up the bars
  var bar = svg.selectAll(".circle")
              .data(xydata)
              .enter().append("g")
              .attr("class", "circle")
              .on('mouseover', tip.show)
              .on('mouseout', tip.hide);

  var circle_radius = 0.98 * (height / (55+2)) / 2;

  // add rectangles of correct size at correct location
  bar.append("circle")
  .attr("cx", function (d) { return x2(d[0]); })
  .attr("cy", function (d) { return y(d[1]); })
  .attr("r", function (d) { return circle_radius; })
  .style("fill", function(d) { return "#3182BD"; })
  .style("opacity", function(d) {return 0.05 + 0.95 * d[2] / maxcnt; });

  // add the x axis and x-label
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
    svg.append("text")
    .attr("class", "xlabel")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .text(xAxisLabel);

  // add the y axis and y-label
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(0,0)")
    .call(yAxis);
    svg.append("text")
    .attr("class", "ylabel")
    .attr("y", 0 - margin.left) // x and y switched due to rotation
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text(yAxisLabel);
}