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
