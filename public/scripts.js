const socket = io('/')

const myPeer = new Peer({
  host:'peerjs-server.herokuapp.com',
  secure:true,
  port:443,
  config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' },
    { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
  ]}
})


const peers = {}
const names = {}
var channelConnect;
const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

const user = prompt("Введите имя");

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let myVideoStream;
myVideo.muted = true

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    // socket.emit("message", text.value);
    channelConnect.send(''+user+':'+text.value);


    messages.innerHTML =
      messages.innerHTML +
      `<div class="message">
          <b><i class="far fa-user-circle"></i> <span> ${
            user === user ? "Я" : userName
          }</span> </b>
          <span>${text.value}</span>
      </div>`;
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    // socket.emit("message", text.value);
    channelConnect.send(''+user+':'+text.value);


    messages.innerHTML =
      messages.innerHTML +
      `<div class="message">
          <b><i class="far fa-user-circle"></i> <span> ${
            user === user ? "Я" : userName
          }</span> </b>
          <span>${text.value}</span>
      </div>`;
    text.value = "";
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Скопируйте эту ссылку и отправьте ее людям, с которыми хотите поговорить",
    window.location.href
  );
});

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

myPeer.on('connection', function(conn) {
  conn.on('data', function(data){
    array_data = data.split(':')
    if (peers[array_data[0]]) return
    messages.innerHTML =
      messages.innerHTML +
      `<div class="message">
          <b><i class="far fa-user-circle"></i> <span> ${
            array_data[0] === user ? "Я" : array_data[0]
          }</span> </b>
          <span>${array_data[1]}</span>
      </div>`;

  });
});

navigator.mediaDevices.getUserMedia({
  video:true,
  audio:true
}).then(stream=>{
  myVideoStream = stream
  addVideoStream(myVideo, stream, null, user)

  myPeer.on('call', call=>{
    call.answer(stream)
    userId = call.peer
    const video = document.createElement('video')
    call.on('stream', userVideoStream  => {
      addVideoStream(video, userVideoStream, userId, 'remote')
    })

    call.on('close', ()=>{
      video.remove()
    })


    peers[userId] = call

  })

  myPeer.on('connection', function(conn) {
    conn.on('data', function(data){
      array_data = data.split(':')
      block_video = document.getElementById(array_data[0]);
      userName = block_video.querySelector('.username');
      userName.innerHTML = array_data[1]

    });
  });



  socket.on('user-connected', (userId, userName) =>{
    console.log('user-connected')

    channelConnect = myPeer.connect(userId);
    channelConnect.on('open', function(){
      channelConnect.send(''+myPeer.id+':'+user);
    });

    connectToNewUser(userId, stream, userName)
      socket.emit('create-channel', myPeer.id)


    })

  socket.on('channel-connect', (userId)=>{
    console.log('channel-connect')
    channelConnect = myPeer.connect(userId);
  })

})

socket.on('user-disconnected', userId =>{
  console.log(userId)
  if(peers[userId]) peers[userId].close()
  block_video = document.getElementById(userId)
  block_video.remove()
})

myPeer.on('open', id=>{
  socket.emit('join-room', ROOM_ID, id, user)
})

function addVideoStream(video, stream, userId, userName){
  block_video = document.getElementById(userId)
  if (block_video){
    video = block_video.querySelector('video');
    if(video){
      block_video.remove()
    }
  }
  block_video = document.createElement('div')
  if (userId){
    block_video.setAttribute("id", userId);
  }else{
    block_video.setAttribute("id", 'local');
  }
  div_username = document.createElement('div')
  div_username.innerHTML = userName
  div_username.className = 'username'
  block_video.className = 'block_video'
  block_video.append(video)
  block_video.append(div_username)
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () =>{
    video.play()
  })
  videoGrid.append(block_video)
}

function connectToNewUser(userId, stream, userName){
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')

  call.on('stream', userVideoStream => {
    addVideoStream(video,userVideoStream, userId, userName)
    console.log(userVideoStream);
  })

  call.on('close', ()=>{
    video.remove()
  })

  peers[userId] = call

  console.log(peers)
}
