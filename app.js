const express = require('express');
const socket = require('socket.io')
const http =  require('http')
const {Chess} = require('chess.js');
const path = require('path');
const { title } = require('process');

const app = express();
const server= http.createServer(app);
const io = socket(server)
const chess = new Chess();

let players = {};
let currentPlayer = 'W'

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Emit current players state to all clients
    const emitPlayersUpdate = () => {
        io.emit('playersUpdate', {
            white: players.white ? true : false,
            black: players.black ? true : false
        });
    };

    if(!players.white){
        players.white = socket.id;
        socket.emit('playerColor', 'W');
        emitPlayersUpdate();
    } else if(!players.black){
        players.black = socket.id;
        socket.emit('playerColor', 'B');
        emitPlayersUpdate();
    } else {
        socket.emit('gameFull', 'The game is full. Please wait for a player to leave.');
    }

    socket.on('move', (move) => {
        try { 
            if (chess.turn() === 'W' && socket.id !== players.white) return;
            if (chess.turn() === 'B' && socket.id !== players.black) return;
           const result = chess.move(move);
           if (result ){
            currentPlayer = chess.turn();
            io.emit('move', move);
            io.emit('boardState', chess.fen());
           }
           else {
          console.log('Invalid move attempted:', move);
          socket.emit('invalidMove', move);
           }
           
        } catch (error) {
            socket.emit('invalidMove', move);
        }
    });
     // Handle disconnect
    socket.on('disconnect', () => {
        if(socket.id === players.white) {
            delete players.white;
            emitPlayersUpdate();
        } else if(socket.id === players.black) {
            delete players.black;
            emitPlayersUpdate();
        }
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
