export function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

export function linspace(a, b, n) {
  let answer = [];
  let dx = (1.0 * (b - a)) / (n - 1);
  for (let i = 0; i < n; i++) answer.push(a + dx * i);
  return answer;
}

export function loglinspace(a, b, n) {
  let answer = [];
  a = Math.log(a);
  b = Math.log(b);
  let dx = (1.0 * (b - a)) / (n - 1);
  for (let i = 0; i < n; i++) answer.push(Math.exp(a + dx * i));
  return answer;
}

export function download(data, filename = "data.json", type = "text/plain") {
  let file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob)
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}
