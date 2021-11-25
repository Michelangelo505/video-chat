const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const sdpTransform = require('sdp-transform');
const {v4: uuidv4} = require('uuid')
const port = process.env.PORT || 3000;
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', {roomId: req.params.room})
})

io.on('connection', socket =>{
  socket.on('join-room', (roomId, userId, userName) =>{
    console.log(roomId, userId)
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId, userName)

  socket.on('create-channel', (userId, userName)=>{
    socket.to(roomId).emit('channel-connect', userId)
  })

    socket.on('disconnect', () =>{
      socket.to(roomId).emit('user-disconnected', userId)
    })

  })
  // socket.on('change-sdp', (sdp)=>{
  //   // change_sdp = sdp + 'b=AS:8\r\n'
  //   res = sdpTransform.parse(sdp);
  //   // res.media[1].maxBitrate = 8
  //   res.media[1].bandwidth = [{ type: 'AS', limit: 8 }];
  //   new_sdp = sdpTransform.write(res);
  //   str_sdp = new_sdp.toString()
  //   console.log(str_sdp);
  //   // console.log(res.media[1].rtp.forEach((item, i, arr) => {
  //   //   console.log(item.rate)
  //   //   })
  //   // )
  //   socket.emit('get-sdp', str_sdp)
  // })
})



server.listen(port)
