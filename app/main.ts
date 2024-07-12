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

    if (method === "GET") {
      if (path === "/") {
        // Respond with 200 OK for root path
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else {
        const echoStr = path.slice(6);
        const contentLength = Buffer.byteLength(echoStr, 'utf8');
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${echoStr}`);
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
