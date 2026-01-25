const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT ? Number(process.env.PORT) : 8181;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const safePath = path.normalize(urlPath).replace(/^([\\/])+/, "");
  const filePath = path.join(ROOT, safePath || "");

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    if (stat.isDirectory()) {
      fs.readdir(filePath, (dirErr, entries) => {
        if (dirErr) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Server Error");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(entries.join("\n"));
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".json" ? "application/json" : "text/plain";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Homebrew server running at http://127.0.0.1:${PORT}/`);
});
