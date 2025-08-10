const socket = io();

const chess = new Chess();

const boardElement = document.querySelector('.chessboard');
let draggedPiece = null;
let sourceSquare = null;
let playerColor = null;

const whitePlayerElement = document.getElementById('white-player');
const blackPlayerElement = document.getElementById('black-player');
const gameStatusElement = document.getElementById('game-status');

const updateGameStatus = () => {
    const turn = chess.turn();
    const isCheck = chess.in_check();
    const isCheckmate = chess.in_checkmate();
    const isStalemate = chess.in_stalemate();
    
    let status = '';
    if (isCheckmate) {
        status = `${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`;
    } else if (isStalemate) {
        status = 'Game drawn by stalemate';
    } else if (isCheck) {
        status = `${turn === 'w' ? 'White' : 'Black'} to move (Check!)`;
    } else {
        status = `${turn === 'w' ? 'White' : 'Black'} to move`;
    }
    
    gameStatusElement.textContent = status;
}

const renderBoard = () => {
   const board = chess.board();
   boardElement.innerHTML = '';
   board.forEach((row, rowIndex) => {
      row.forEach((square, squareIndex) => {
         const squareElement = document.createElement('div');
         squareElement.classList.add('square', (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark');
         squareElement.dataset.row = rowIndex;
         squareElement.dataset.col = squareIndex;
         
         if(square) {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
            pieceElement.innerText = getPieceUnicode({color: square.color, type: square.type});
            pieceElement.draggable = square.color.toUpperCase() === playerColor; // Only allow dragging own pieces
            
            pieceElement.addEventListener('dragstart', (event) => {
                draggedPiece = square;
                sourceSquare = {row: rowIndex, col: squareIndex};
                event.dataTransfer.setData('text/plain', '');
                pieceElement.classList.add('dragging');
            });

            pieceElement.addEventListener('dragend', () => {
                pieceElement.classList.remove('dragging');
            });
            
            squareElement.appendChild(pieceElement);
         }

         squareElement.addEventListener('dragover', (event) => {
            event.preventDefault();
            squareElement.classList.add('highlight');
         });

         squareElement.addEventListener('dragleave', () => {
            squareElement.classList.remove('highlight');
         });

         squareElement.addEventListener('drop', (event) => {
            event.preventDefault();
            squareElement.classList.remove('highlight');
            
            if(draggedPiece && sourceSquare) {
                const targetSquare = {row: rowIndex, col: squareIndex};
                const move = {
                    from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
                    to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`,
                    promotion: 'q'
                };
                
                if(sourceSquare.row !== rowIndex || sourceSquare.col !== squareIndex) {
                    const result = chess.move(move);
                    if(result) {
                        socket.emit('move', move);
                        updateGameStatus();
                    }
                }
                
                draggedPiece = null;
                sourceSquare = null;
            }
         });
         
         boardElement.appendChild(squareElement);
      });
   });
   
   if(playerColor === 'B'){
        boardElement.classList.add('flipped');
   } else {
        boardElement.classList.remove('flipped');
   }
}

const getPieceUnicode = (piece) => {
    const pieceMap = {
        w: {
            p: '♙', // White Pawn
            r: '♖', // White Rook
            n: '♘', // White Knight
            b: '♗', // White Bishop
            q: '♕', // White Queen
            k: '♔'  // White King
        },
        b: {
            p: '♟', // Black Pawn
            r: '♜', // Black Rook
            n: '♞', // Black Knight
            b: '♝', // Black Bishop
            q: '♛', // Black Queen
            k: '♚'  // Black King
        }
    };
    return pieceMap[piece.color][piece.type];
}

socket.on('playerColor', (color) => {
    playerColor = color;
    updatePlayerStatus(color);
    renderBoard();
});

socket.on('playersUpdate', (players) => {
    if (players.white) {
        whitePlayerElement.textContent = 'Player Connected';
        whitePlayerElement.classList.remove('text-zinc-400');
        whitePlayerElement.classList.add('text-green-400');
    } else {
        whitePlayerElement.textContent = 'Waiting...';
        whitePlayerElement.classList.remove('text-green-400');
        whitePlayerElement.classList.add('text-zinc-400');
    }
    
    if (players.black) {
        blackPlayerElement.textContent = 'Player Connected';
        blackPlayerElement.classList.remove('text-zinc-400');
        blackPlayerElement.classList.add('text-green-400');
    } else {
        blackPlayerElement.textContent = 'Waiting...';
        blackPlayerElement.classList.remove('text-green-400');
        blackPlayerElement.classList.add('text-zinc-400');
    }
});

function updatePlayerStatus(color) {
    if (color === 'W') {
        whitePlayerElement.textContent = 'You (White)';
        whitePlayerElement.classList.remove('text-zinc-400');
        whitePlayerElement.classList.add('text-green-400');
    } else if (color === 'B') {
        blackPlayerElement.textContent = 'You (Black)';
        blackPlayerElement.classList.remove('text-zinc-400');
        blackPlayerElement.classList.add('text-green-400');
    }
}

socket.on('spectatorRole', () => {
    playerColor = 'spectator';
    renderBoard();
});
socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});
socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
    updateGameStatus();
});



renderBoard();