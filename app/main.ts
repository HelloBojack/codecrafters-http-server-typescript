import * as net from "net";
import * as fs from "fs";
import { resolve } from "path";  // Correctly import the resolve function from the path module

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Handle the --directory flag to specify the files directory
const args = process.argv.slice(2);
let directory = "/tmp"; // Default directory

args.forEach((arg, index) => {
  if (arg === "--directory" && args[index + 1]) {
    directory = args[index + 1];
  }
});

console.log(`Serving files from directory: ${directory}`);

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    console.log(`Received data: ${data}`);

    // Parse the request
    const request = data.toString();
    const requestLines = request.split("\r\n");
    const requestLine = requestLines[0];
    const [method, requestPath] = requestLine.split(" ");
    const headers = {};

    // Extract headers
    for (let i = 1; i < requestLines.length; i++) {
      const line = requestLines[i];
      if (line === '') break;
      const [key, value] = line.split(": ");
      headers[key] = value;
    }

    if (method === "GET") {
      if (requestPath === "/") {
        // Respond with 200 OK for root requestPath
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        socket.end();
      } else if (requestPath.startsWith("/echo/")) {
        const echoStr = requestPath.slice(6);
        const contentLength = Buffer.byteLength(echoStr, 'utf8');
        // Respond with 200 OK and the echoed string
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${echoStr}`);
      } else if (requestPath === "/user-agent" && headers["User-Agent"]) {
        const userAgent = headers["User-Agent"];
        const contentLength = Buffer.byteLength(userAgent, 'utf8');
        // Respond with 200 OK and the User-Agent value
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${userAgent}`);
      } else if (requestPath.startsWith("/files/")) {
        const filename = requestPath.slice(7); // Extract the filename from the requestPath
        const filepath = resolve(directory, filename);

        // Check if the file exists
        fs.stat(filepath, (err, stats) => {
          if (err || !stats.isFile()) {
            // File does not exist, respond with 404 Not Found
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
          } else {
            // File exists, read and send the file content
            fs.readFile(filepath, (err, content) => {
              if (err) {
                // Error reading the file, respond with 500 Internal Server Error
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.end();
              } else {
                // Respond with 200 OK and file content
                const headers = [
                  "HTTP/1.1 200 OK",
                  "Content-Type: application/octet-stream",
                  `Content-Length: ${content.length}`,
                  "\r\n"
                ];
                socket.write(headers.join("\r\n"));
                socket.write(content);
                socket.end();
              }
            });
          }
        });
      } else {
        // For other paths, respond with 404 Not Found
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.end();
      }
    }
  });

  socket.on("close", () => {
    console.log("Connection closed");
  });

  socket.on("error", (err) => {
    console.error(`Error: ${err}`);
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server listening on port 4221");
});
