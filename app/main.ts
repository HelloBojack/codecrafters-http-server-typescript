import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    console.log(`Received data: ${data}`);

    // Parse the request
    const request = data.toString();
    const requestLines = request.split("\r\n");
    const requestLine = requestLines[0];
    const [method, path] = requestLine.split(" ");

    const headers = {};

    // Extract headers
    for (let i = 1; i < requestLines.length; i++) {
      const line = requestLines[i];
      if (line === '') break;
      const [key, value] = line.split(": ");
      headers[key] = value;
    }

    if (method === "GET") {
      if (path === "/") {
        // Respond with 200 OK for root path
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else if (path.startsWith("/echo/")) {
        const echoStr = path.slice(6);
        const contentLength = Buffer.byteLength(echoStr, 'utf8');
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${echoStr}`);
      } else if (path === "/user-agent" && headers["User-Agent"]) {
        const userAgent = headers["User-Agent"];
        const contentLength = Buffer.byteLength(userAgent, 'utf8');
        // Respond with 200 OK and the User-Agent value
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${userAgent}`);
      } else {
        // Respond with 404 Not Found for any other path
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    }
    // End the connection
    socket.end();
  });

  socket.on("close", () => {
    socket.end();
  });

  socket.on("error", (err) => {
    console.error(`Error: ${err}`);
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.end();
  });
});

server.listen(4221, "localhost");
