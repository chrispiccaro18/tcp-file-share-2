const net = require('net');
const fs = require('fs');
const { parse } = require('url');
const readline = require('readline');
const { messageExtractor } = require('./messageDecoder');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '💿: '
});


module.exports = (result, client, downloadClient) => {
  const messageDetails = messageExtractor(result);
  switch(messageDetails.messageCode) {
    case '11': {
      console.log('current MSL', JSON.parse(messageDetails.message));
      rl.question('Choose a song from the MSL\n💿: ', answer => {
        client.write(`!02!${answer}%02%`);
      });
      break;
    }
    case '12': {
      if(messageDetails.message === 'Not Found') {
        rl.question('Song not found. Choose a song from the MSL\n💿: ', answer => {
          client.write(`!02!${answer}%02%`);
        });
      } else {
        console.log(client.savePath);
        const { url, songTitle } = JSON.parse(messageDetails.message);
        const { hostname, port } = parse(url);
        const downloadingClient = net.createConnection(port, hostname, () => {
          downloadingClient.write(`!03!${songTitle}%03%`);
        });
        const writeStream = fs.createWriteStream(`${client.savePath}/${songTitle}`);
        downloadingClient.pipe(writeStream);
        downloadingClient.on('end', () => {
          rl.question(`${songTitle} download complete.\nChoose another song from the MSL\n💿: `, answer => {
            client.write(`!02!${answer}%02%`);
          });
        });
      }
      break;
    }
    case '03': {
      console.log(client.readPath);
      const fileRead = fs.createReadStream(`${client.readPath}/${messageDetails.message}`);
      fileRead.pipe(downloadClient);
      fileRead.on('end', () => {
        rl.question(`${messageDetails.message} upload complete.\nChoose a song from the MSL\n💿: `, answer => {
          client.write(`!02!${answer}%02%`);
        });
      });
      break;
    }
    
    default:
      break;
  }
};
