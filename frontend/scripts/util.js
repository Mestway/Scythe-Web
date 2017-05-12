"use strict";

// replacing linebreaks etc with html things
String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};
function htmlForTextWithEmbeddedNewlines(text) {
  var htmls = [];
  var lines = text.replaceAll("\\r", "").replaceAll("\t", "    ").replaceAll(/ /g, ' ').split(/\\n/);
  // The temporary <div/> is to perform HTML entity encoding reliably.
  // Don't need jQuery but then you need to struggle with browser
  // differences in innerText/textContent yourself
  var tmpDiv = jQuery(document.createElement('div'));
  for (var i = 0; i < lines.length; i++) {
    htmls.push(tmpDiv.text(lines[i]).html());
  }
  return htmls.join("<br>");
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 10; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }return text;
}

function tableToCSV(table) {
  var csvStr = "";
  csvStr += table["header"].join(", ") + "\n";
  for (var i = 0; i < table["content"].length; i++) {
    csvStr += table["content"][i].join(", ") + "\n";
  }
  return csvStr;
}

function csvToTable(csvStr, name) {
  if (csvStr.constructor === Array) csvStr = csvStr.join("\r\n");
  var csvdata = d3.csvParse(csvStr);
  var header = [];
  var content = [];
  for (var i = 0; i < csvdata.columns.length; i++) {
    header.push(csvdata.columns[i]);
  }for (var i = 0; i < csvdata.length; i++) {
    var row = [];
    for (var j = 0; j < csvdata.columns.length; j++) {
      var cell = csvdata[i][csvdata.columns[j]].trim();
      row.push(cell);
    }
    content.push(row);
  }
  return { name: name, content: content, header: header };
}

function parseScytheExample(str) {
  var content = str.split(/\r?\n/);
  var i = 0;
  var inputTables = [];
  var outputTable = null;
  while (i < content.length) {
    if (content[i].startsWith("#")) {
      var segName = content[i].substring(1);
      var segContent = [];
      i += 1;
      while (i < content.length && !content[i].startsWith("#")) {
        if (!(content[i].trim() == "")) segContent.push(content[i]);
        i++;
      }
      if (segName.startsWith("input")) {
        var baseTableName = segName.substring("input".length);
        if (baseTableName == "") baseTableName = "input";else baseTableName = baseTableName.substring(1);
        inputTables.push(csvToTable(segContent, baseTableName));
      } else if (segName.startsWith("output")) {
        outputTable = csvToTable(segContent, "output");
      }
    } else {
      i += 1;
    }
  }
  return { inputTables: inputTables, outputTable: outputTable };
}