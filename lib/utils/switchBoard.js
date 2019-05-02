const Song = require('../models/Song');
const { messageExtractor } = require('./messageDecoder');
const { broadcast, songLookup } = require('./serverTools');

async function switchBoard(result, client) {
  const messageDetails = messageExtractor(result);
  switch(messageDetails.messageCode) {
    case '01': {
      const { files, url } = JSON.parse(messageDetails.message);
      client.url = url;
      for(let i = 0; i < files.length; i++) {
        await Song.create({
          title: files[i],
          url,
        });
      }
   
      const masterSongList = await Song.find({}, 'title').lean();
      // console.log(masterSongList);
      await broadcast(JSON.stringify(masterSongList), '11');
      break;
    }
    case '02': {
      const songTitle = messageDetails.message;
      console.log(songTitle);
      songLookup(songTitle, client);
      break;
    }
    default:
      break;
  }
}

module.exports = switchBoard;
