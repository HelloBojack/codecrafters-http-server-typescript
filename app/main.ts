import * as net from "net";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";

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
    let body = Buffer.alloc(0);
    let contentLength = 0;
    let isReadingHeaders = true;

    const [headerPart, ...bodyParts] = request.split("\r\n\r\n");
    // Extract headers
    for (let i = 1; i < requestLines.length; i++) {
      const line = requestLines[i];
      if (line === '') break;
      const [key, value] = line.split(": ");
      headers[key] = value;
    }
    body = Buffer.concat([body, Buffer.from(bodyParts.join("\r\n\r\n"))]);

    if (method === "GET") {
      if (requestPath === "/") {
        // Respond with 200 OK for root requestPath
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        socket.end();
      } else if (requestPath.startsWith("/echo/")) {
        const isGzip = headers?.['Accept-Encoding']?.includes('gzip') || false;
        const echoText = requestPath.slice(6); // Extract the text to echo
        let responseBody = Buffer.from(echoText, "utf-8");
        let headersToSend = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n";

        // Handle gzip compression if specified
        if (isGzip) {
          zlib.gzip(responseBody, (err, compressedBody) => {
            if (err) {
              console.error(`Gzip error: ${err}`);
              socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
            } else {
              headersToSend += `Content-Encoding: gzip\r\nContent-Length: ${compressedBody.length}\r\n\r\n`;
              socket.write(headersToSend);
              socket.write(compressedBody);
            }
            socket.end();
          });
        } else {
          headersToSend += `Content-Length: ${responseBody.length}\r\n\r\n`;
          socket.write(headersToSend);
          socket.write(responseBody);
          socket.end();
        }
      } else if (requestPath === "/user-agent" && headers["User-Agent"]) {
        const userAgent = headers["User-Agent"];
        const contentLength = Buffer.byteLength(userAgent, 'utf8');
        // Respond with 200 OK and the User-Agent value
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength} \r\n\r\n${userAgent} `);
      } else if (requestPath.startsWith("/files/")) {
        const filename = requestPath.slice(7); // Extract the filename from the requestPath
        const filepath = path.resolve(directory, filename);

        fs.readFile(filepath, (err, content) => {
          if (err) {
            // Error reading the file, respond with 500 Internal Server Error
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
          } else {
            // Respond with 200 OK and file content
            const headers = [
              "HTTP/1.1 200 OK",
              "Content-Type: application/octet-stream",
              `Content-Length: ${content.length} `,
              "\r\n"
            ];
            socket.write(headers.join("\r\n"));
            socket.write(content);
            socket.end();
          }
        });
      } else {
        // For other paths, respond with 404 Not Found
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.end();
      }
    }

    if (method === "POST" && requestPath.startsWith("/files/")) {
      // const directory = headers['Content-Type']
      const filename = requestPath.slice(7); // Extract the filename from the path
      const filepath = path.resolve(directory, filename);
      fs.writeFile(filepath, body, (err) => {
        if (err) {
          // Error writing the file, respond with 500 Internal Server Error
          socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        } else {
          // Respond with 201 Created
          socket.write("HTTP/1.1 201 Created\r\n\r\n");
        }
        socket.end();
      });
    }
  });

  socket.on("close", () => {
    console.log("Connection closed");
  });

  socket.on("error", (err) => {
    console.error(`Error: ${err} `);
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server listening on port 4221");
});
