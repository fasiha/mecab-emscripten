var statusElement = document.getElementById('status');
var progressElement = document.getElementById('progress');
var spinnerElement = document.getElementById('spinner');
var mecab_do;

d3.select('#examples-toggle').on('click', function() {
  d3.select('#examples-toggle').html('Examples (for details, see \
this <a href="http://www.mwsoft.jp/programming/munou/mecab_command.html">\
guide</a>, in Japanese)');
  d3.select('dl#example-arguments').property("hidden", false);
})

d3.select('button#mecab-submit-button').on('click', function() {
  var args = d3.select('#mecab-args').property('value');
  args += " -r mecabrc -d ipadic/ -o output.txt input.txt";

  var command = 'mecab ' + args;

  var text = d3.select('#mecab-input').property('value');
  if (text.slice(-1) != "\n") {
    text += '\n';
  }
  FS.writeFile('input.txt', text);
  FS.writeFile('output.txt', "");

  mecab_do(args);

  var output = FS.readFile('output.txt', {encoding : "utf8"});
  var newlines = (output.match(/\n/g) || []).length + 1;
  var newblock = d3.select('#mecab-output')
      .insert('div', ":first-child")
      .classed('mecab-output-block', true);
  newblock.append('h1').text('Result');
  newblock.append('p').html("Equivalent command: <tt>" + command + "</tt>");
  newblock.append('textarea')
      .text(output)
      .style({height : (1.35*newlines)+"em"});
});

var setupFiles = function() {
  FS.createDataFile('/', 'input.txt',
                    Module['intArrayFromString']('Input goes here.'), true,
                    true);
  FS.createDataFile('/', 'output.txt',
                    'Output can be placed here (-o output.txt)', true, true);
};
var wrapFunctions = function() {
  mecab_do = Module.cwrap('mecab_do2', 'number', ['string']);
};
var printer = function(text) {
  text = Array.prototype.slice.call(arguments).join(' ');
  // These replacements are necessary if you render to raw HTML
  // text = text.replace(/&/g, "&amp;");
  // text = text.replace(/</g, "&lt;");
  // text = text.replace(/>/g, "&gt;");
  // text = text.replace('\n', '<br>', 'g');
  // console.log("OUTPUT", text);
  FS.writeFile('output.txt', text);
  console.log(text);
};
var printErr = function(text) {
  text = Array.prototype.slice.call(arguments).join(' ');
  if (0) {              // XXX disabled for safety typeof dump == 'function') {
    dump(text + '\n');  // fast, straight to the real console
  } else {
    console.error(text);
  }
};
var setStatus = function(text) {
  if (!Module.setStatus.last)
    Module.setStatus.last = {time : Date.now(), text : ''};
  if (text === Module.setStatus.text) return;
          var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
          var now = Date.now();
          if (m && now - Date.now() < 30) return; // if this is a progress update, skip it if too soon
          if (m) {
    text = m[1];
    progressElement.value = parseInt(m[2]) * 100;
    progressElement.max = parseInt(m[4]) * 100;
    progressElement.hidden = false;
    spinnerElement.hidden = false;
          } else {
    progressElement.value = null;
    progressElement.max = null;
    progressElement.hidden = true;
    if (!text) spinnerElement.style.display = 'none';
          }
          statusElement.innerHTML = text;
};
var monitorRunDependencies = function(left) {
  this.totalDependencies = Math.max(this.totalDependencies, left);
  Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) +
                              '/' + this.totalDependencies + ')'
                        : 'All downloads complete.');
};
var Module = {
  preRun : [setupFiles],
  postRun : [wrapFunctions],
  TOTAL_MEMORY : 1024 * 1024 * 128,
  noExitRuntime : true,
  noInitialRun : false,
  print : printer,
  printErr : printErr,
  setStatus : setStatus,
  totalDependencies : 0,
  monitorRunDependencies : monitorRunDependencies
};
Module.setStatus('Downloading data, please wait.');
window.onerror = function(event) {
  // TODO: do not warn on ok events like simulating an infinite loop or
  // exitStatus
  Module.setStatus('Exception thrown, see JavaScript console');
  spinnerElement.style.display = 'none';
  Module.setStatus = function(text) {
    if (text) Module.printErr('[post-exception status] ' + text);
  };
};