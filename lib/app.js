const net = require('net');
const { messageDecoder } = require('./utils/messageDecoder');
const { deleteFromClientList, deleteFromSongList, broadcast } = require('./utils/serverTools');
const connectedClients = require('./databases/clientlist');
const Song = require('./models/Song');
const switchBoard = require('./utils/switchBoard');

const server = net.createServer(client => {
  console.log('client connected');
  connectedClients.push(client);
  const decoder = messageDecoder();
  client.on('data', chunk => {
    const result = decoder(chunk.toString());
    if(!result) return;
    if(result) {
      console.log(result);
      switchBoard(result, client);
    }
  });
  client.on('close', async() => {
    await deleteFromClientList(client);
    await deleteFromSongList(client);
    const masterSongList = await Song.find({}, 'title').lean();
    console.log(masterSongList);
    await broadcast(JSON.stringify(masterSongList), '11');
  });
});

module.exports = server;
