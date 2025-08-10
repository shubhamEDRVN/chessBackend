

const socket = io();

const chess = new Chess();

const boardElement = document.querySelector('.chessboard');
let draggedPiece = null;
let sourceSquare = null;
let playerColor = null;

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
           pieceElement.innerText = getPieceUnicode(square);
           pieceElement.draggable = playerColor === square.color.toUpperCase();
           pieceElement.addEventListener('dragstart', (event) => {
            if(pieceElement.draggable) {
               draggedPiece = pieceElement;
               sourceSquare = {row: rowIndex, col: squareIndex};
               event.dataTransfer.setData('text/plain', '');
            }
           })
           pieceElement.addEventListener('dragend', (e) => {
               draggedPiece = null;
               sourceSquare = null;
           });
           squareElement.appendChild(pieceElement);
         }
         squareElement.addEventListener('dragover', (event) => {
            event.preventDefault();
         });

         squareElement.addEventListener('drop', (event) => {
            event.preventDefault();
            if(draggedPiece ) {
               const targetSquare = {row: parseInt(squareElement.dataset.row), col: parseInt(squareElement.dataset.col)};
              
               handleMove(sourceSquare, targetSquare);
            }
             
         });
        boardElement.appendChild(squareElement);
      });
      
   });
   if(playerColor === 'B'){
        boardElement.classList.add('flipped');
   }
   else{
        boardElement.classList.remove('flipped');
   }

}

const handleMove = (sourceSquare, targetSquare) => {
    const move = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
        to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`,
        promotion: 'q' // Always promote to a queen for simplicity
    }
    socket.emit('move', move);
}
const getPieceUnicode = (piece) => {
    const pieceMap = {
          
            p: '♙', // White Pawn
            r: '♖', // White Rook
            n: '♘', // White Knight
            b: '♗', // White Bishop
            q: '♕', // White Queen
            k: '♔',  // White King
            P: '♟', // Black Pawn
            R: '♜', // Black Rook
            N: '♞', // Black Knight
            B: '♝', // Black Bishop
            Q: '♛', // Black Queen
            K: '♚'  // Black King

    };
    return pieceMap[piece.type] || '';
}
socket.on('playerColor', (color) => {
    playerColor = color;
    renderBoard();
});
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
});



renderBoard();