import { WebSocketServer } from "ws";
import { createClient } from "redis";

const wss = new WebSocketServer({ port: 8888 });
const client = createClient({
  url: "redis://127.0.0.1:6379",
});
await client.connect();
let clientsArr = [];
await client.ping();
// 原生的WebSocket就两个常用的方法
wss.on("connection", async function (ws) {
  clientsArr.push(ws);
  client.lRange("barrages", 0, -1).then((data) => {
    let res = [];
    data.map((item) => res.push(JSON.parse(item)));

    ws.send(JSON.stringify({ type: "INIT", data: res }));
  });

  ws.on("message", async function (data) {
    await client.rPush("barrages", data);
    clientsArr.forEach((w) =>
      w.send(JSON.stringify({ type: "ADD", data: JSON.parse(data) }))
    );
  });

  ws.on("close", () => {
    clientsArr = clientsArr.filter((client) => client != ws);
  });
});
