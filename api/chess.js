const { Chess } = require('chess.js');

let chess = new Chess();
const boardElement = document.querySelector('.chessboard');
let playerColor = 'w'; // Default to white for demo

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerColor === square.color;
                pieceElement.addEventListener('dragstart', (event) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        event.dataTransfer.setData('text/plain', '');
                    }
                });
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
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });
    if (playerColor === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = async (sourceSquare, targetSquare) => {
    const move = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
        to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`,
        promotion: 'q'
    };
    const res = await fetch('/api/chess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move })
    });
    const data = await res.json();
    if (data.fen) {
        chess.load(data.fen);
        renderBoard();
    } else {
        alert('Invalid move!');
    }
};

const getPieceUnicode = (piece) => {
    const pieceMap = {
        w: {
            p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔'
        },
        b: {
            p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚'
        }
    };
    return pieceMap[piece.color][piece.type] || '';
};

const loadBoard = async () => {
    const res = await fetch('/api/chess');
    const data = await res.json();
    chess.load(data.fen);
    renderBoard();
};

loadBoard();

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body !== 'object') {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        body = {};
      }
    }
    const { move } = body;
    const result = chess.move(move);
    if (result) {
      res.status(200).json({ fen: chess.fen(), move: result });
    } else {
      res.status(400).json({ error: 'Invalid move' });
    }
  } else {
    res.status(200).json({ fen: chess.fen() });
  }
};