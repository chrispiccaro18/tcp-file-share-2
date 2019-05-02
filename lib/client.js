const net = require('net');
const fs = require('fs');
const ngrok = require('ngrok');
const { messageDecoder } = require('./utils/messageDecoder');
const clientSwitchBoards = require('./utils/clientSwitchBoards');
const firstQuestions = require('./inquirer/welcome');
const readMusicDirectory = require('./utils/readMusicDirectory');

firstQuestions()
  .then(pathOptions => {
    const client = net.createConnection(54321, '18.219.224.129', async() => {
      const url = await ngrok.connect({
        proto: 'tcp',
        port: 8080
      });

      client.savePath = pathOptions.savePath;
    
      if(pathOptions.customSharedPath) {
        fs.readdir(pathOptions.customSharedPath, (err, files) => {
          client.readPath = pathOptions.customSharedPath;
          // const filteredFiles = files.filter(file => file[0] !== '.');
          client.write(`!01!${JSON.stringify({ files, url })}%01%`);
        });
      } else {
        const files = await readMusicDirectory(pathOptions.userName);
        console.log('SONG_ARRAY', files.length);
        client.write(`!01!${JSON.stringify({ files, url })}%01%`);
      }
    
      const clientServer = net.createServer(downloadClient => {
        console.log('Download client connected');
        const downloadDecoder = messageDecoder();
        downloadClient.on('data', chunk => {
          const result = downloadDecoder(chunk.toString());
          if(!result) return;
          if(result) {
            clientSwitchBoards(result, client, downloadClient);
          }
        });
      });
      clientServer.listen(8080);
    });
    
    const decoder = messageDecoder();
    client.on('data', chunk => {
      const result = decoder(chunk.toString());
      if(!result) return;
      if(result) {
        clientSwitchBoards(result, client);
      }
    });

  })
  .catch(err => {
    console.log(err);
  }); 
