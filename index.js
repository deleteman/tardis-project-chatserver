// Setup basic express server
let express = require('express');
let config = require("config")
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io')(server);
let port = process.env.PORT || config.get('app.port');

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});


// Chatroom

let numUsers = 0;


io.on('connection', (socket) => {
  let addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on(config.get('chat.events.NEWMSG'), (data, done) => {
    let room = socket.roomname
    if(!socket.roomname) {
        socket.emit(config.get('chat.events.NEWMSG'), "You're not part of a room yet")
        return done()
    }

    // we tell the client to execute 'new message'
    socket.to(socket.roomname).emit(config.get('chat.events.NEWMSG'), {
      room: room,
      username: socket.username,
      message: data
    });
    done()
  });

  socket.on(config.get('chat.events.JOINROOM'), (data, done) => {
      console.log("Requesting to join a room: ", data)

      socket.roomname = data.roomname
      socket.username = data.username
      socket.join(data.roomname, _ => {
          socket.to(data.roomname).emit(config.get('chat.events.NEWMSG'), {
            username: 'Game server',
            message: socket.username + ' has joined the party!'
          })
          done(null, {joined: true})
      })
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.to(socket.roomname).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
