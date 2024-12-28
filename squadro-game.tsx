import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Undo2 } from 'lucide-react';

const SquadroBoard = () => {
  const [history, setHistory] = useState([]);
  const [gameState, setGameState] = useState({
    board: Array(7).fill(null).map(() => Array(7).fill(null)),
    pieces: {
      yellow: [
        { id: 'y1', x: 1, y: 0, direction: 'down', isReturning: false, completed: false },
        { id: 'y2', x: 2, y: 0, direction: 'down', isReturning: false, completed: false },
        { id: 'y3', x: 3, y: 0, direction: 'down', isReturning: false, completed: false },
        { id: 'y4', x: 4, y: 0, direction: 'down', isReturning: false, completed: false },
        { id: 'y5', x: 5, y: 0, direction: 'down', isReturning: false, completed: false }
      ],
      red: [
        { id: 'r1', x: 6, y: 1, direction: 'left', isReturning: false, completed: false },
        { id: 'r2', x: 6, y: 2, direction: 'left', isReturning: false, completed: false },
        { id: 'r3', x: 6, y: 3, direction: 'left', isReturning: false, completed: false },
        { id: 'r4', x: 6, y: 4, direction: 'left', isReturning: false, completed: false },
        { id: 'r5', x: 6, y: 5, direction: 'left', isReturning: false, completed: false }
      ]
    },
    currentPlayer: 'yellow',
    selectedPiece: null
  });

  const findPieceAtPosition = (x, y) => {
    const yellowPiece = gameState.pieces.yellow.find(p => p.x === x && p.y === y);
    const redPiece = gameState.pieces.red.find(p => p.x === x && p.y === y);
    return yellowPiece || redPiece;
  };

  const getMoveDistance = (piece) => {
    const color = piece.id.startsWith('y') ? 'yellow' : 'red';
    const index = color === 'yellow' ? piece.x - 1 : piece.y - 1;
    const dots = {
      yellow: {
        down: [1, 3, 2, 3, 1],
        up: [3, 1, 2, 1, 3]
      },
      red: {
        left: [1, 2, 3, 2, 1],
        right: [3, 2, 1, 2, 3]
      }
    };
    return dots[color][piece.direction][Math.max(0, Math.min(4, index))];
  };

  const calculateMove = (piece) => {
    const distance = getMoveDistance(piece);
    let finalPosition = { x: piece.x, y: piece.y };
    let piecesToReset = [];
    
    const moves = Array(distance).fill(0).map((_, i) => i + 1);
    
    for (const step of moves) {
      let nextPosition = { ...finalPosition };
      
      switch (piece.direction) {
        case 'down':
          nextPosition.y = piece.y + step;
          break;
        case 'up':
          nextPosition.y = piece.y - step;
          break;
        case 'left':
          nextPosition.x = piece.x - step;
          break;
        case 'right':
          nextPosition.x = piece.x + step;
          break;
      }

      if (nextPosition.x < 0 || nextPosition.x > 6 || 
          nextPosition.y < 0 || nextPosition.y > 6) {
        break;
      }

      const opponentColor = piece.id.startsWith('y') ? 'red' : 'yellow';
      const opponent = gameState.pieces[opponentColor].find(
        p => !p.completed && p.x === nextPosition.x && p.y === nextPosition.y
      );

      if (opponent) {
        piecesToReset.push(opponent);
        finalPosition = nextPosition;
        break;
      }

      finalPosition = nextPosition;
    }

    return { finalPosition, piecesToReset };
  };

  const handlePieceClick = (piece) => {
    const pieceColor = piece.id.startsWith('y') ? 'yellow' : 'red';
    
    if (piece.completed || pieceColor !== gameState.currentPlayer) {
      return;
    }

    if (gameState.selectedPiece?.id === piece.id) {
      setGameState(prevState => ({
        ...prevState,
        selectedPiece: null
      }));
      return;
    }

    setGameState(prevState => ({
      ...prevState, 
      selectedPiece: piece
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    setGameState(previousState);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleMove = () => {
    if (!gameState.selectedPiece) return;

    setHistory(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);

    const { finalPosition, piecesToReset } = calculateMove(gameState.selectedPiece);
    const newPieces = { ...gameState.pieces };
    
    piecesToReset.forEach(opponent => {
      const opponentColor = opponent.id.startsWith('y') ? 'yellow' : 'red';
      const index = newPieces[opponentColor].findIndex(p => p.id === opponent.id);
      
      if (index !== -1) {
        const resetPosition = opponent.isReturning ? 
          (opponent.id.startsWith('y') ? { x: opponent.x, y: 6 } : { x: 0, y: opponent.y }) :
          (opponent.id.startsWith('y') ? { x: opponent.x, y: 0 } : { x: 6, y: opponent.y });

        newPieces[opponentColor][index] = {
          ...opponent,
          ...resetPosition
        };
      }
    });

    const pieceColor = gameState.selectedPiece.id.startsWith('y') ? 'yellow' : 'red';
    const pieceIndex = newPieces[pieceColor].findIndex(p => p.id === gameState.selectedPiece.id);
    
    if (pieceIndex !== -1) {
      const updatedPiece = {
        ...newPieces[pieceColor][pieceIndex],
        x: finalPosition.x,
        y: finalPosition.y  
      };

      const reachedEnd = (
        (updatedPiece.direction === 'down' && finalPosition.y === 6) ||
        (updatedPiece.direction === 'up' && finalPosition.y === 0) ||
        (updatedPiece.direction === 'left' && finalPosition.x === 0) ||
        (updatedPiece.direction === 'right' && finalPosition.x === 6)
      );

      if (reachedEnd) {
        const directionMap = {
          down: 'up',
          up: 'down',
          left: 'right',
          right: 'left'
        };
        updatedPiece.direction = directionMap[updatedPiece.direction];
        updatedPiece.isReturning = !updatedPiece.isReturning;

        if (updatedPiece.isReturning &&
            ((pieceColor === 'yellow' && finalPosition.y === 0) ||
             (pieceColor === 'red' && finalPosition.x === 6))) {
          updatedPiece.completed = true;
        }
      }

      newPieces[pieceColor][pieceIndex] = updatedPiece;
    }

    setGameState({
      ...gameState,
      pieces: newPieces,
      currentPlayer: gameState.currentPlayer === 'yellow' ? 'red' : 'yellow',
      selectedPiece: null
    });
  };

  const checkWinner = () => {
    const yellowComplete = gameState.pieces.yellow.filter(p => p.completed).length;
    const redComplete = gameState.pieces.red.filter(p => p.completed).length;
    if (yellowComplete >= 4) return 'yellow';
    if (redComplete >= 4) return 'red';
    return null;
  };

  const renderDots = (dots) => (
    <div className="flex gap-1">
      {Array(dots).fill(null).map((_, i) => (
        <div key={i} className="w-2 h-2 bg-white rounded-full" />
      ))}
    </div>
  );

  const renderCell = (x, y) => {
    const piece = findPieceAtPosition(x, y);
    const isSelected = piece?.id === gameState.selectedPiece?.id;
    const isValidMove = !!gameState.selectedPiece && !piece && 
      calculateMove(gameState.selectedPiece).finalPosition.x === x && 
      calculateMove(gameState.selectedPiece).finalPosition.y === y;
    
    return (
      <div 
        key={`${x}-${y}`}
        className={`
          w-12 h-12 border border-gray-600
          flex items-center justify-center relative
          ${(x + y) % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}
        `}
      >
        {isValidMove && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-blue-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500/50 rounded-full animate-pulse" />  
            </div>
          </div>
        )}
        {piece && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-8 h-8"
              style={{
                transform: `rotate(${
                  piece.id.startsWith('y')
                    ? piece.direction === 'down' ? '180deg' : '0deg'
                    : piece.direction === 'left' ? '-90deg' : '90deg'  
                })`,
                transformOrigin: 'center'
              }}
            >
              <div 
                className={`
                  w-full h-full
                  ${piece.id.startsWith('y') ? 'bg-yellow-400' : 'bg-red-500'}
                  transition-all duration-200 ease-in-out
                  ${piece.completed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-75 shadow-lg z-10' : ''}
                  ${!piece.completed && ((piece.id.startsWith('y') && gameState.currentPlayer === 'yellow') || 
                    (piece.id.startsWith('r') && gameState.currentPlayer === 'red')) 
                    ? 'hover:brightness-110 hover:shadow-md' : 'opacity-75'}  
                `}
                onClick={() => handlePieceClick(piece)}
                style={{
                  clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  transformOrigin: 'center'
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const winner = checkWinner();

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen">
      <div className="mb-8 text-xl font-bold text-white">
        {winner 
          ? `${winner === 'yellow' ? '黄色' : '赤'}の勝利！` 
          : `${gameState.currentPlayer === 'yellow' ? "黄色" : "赤"}のターン`}
      </div>

      <div className="flex gap-4 mb-16">
        <button 
          onClick={handleMove}
          disabled={!gameState.selectedPiece}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          移動
        </button>
        <button
          onClick={handleUndo} 
          disabled={history.length === 0}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <Undo2 className="w-4 h-4" />
          一手戻る
        </button>
      </div>

      <div className="relative">
        <div className="absolute -top-8 left-0 w-full flex justify-around px-12">
          {[1, 3, 2, 3, 1].map((dots, i) => renderDots(dots))}
        </div>

        <div className="absolute -right-8 top-0 h-full flex flex-col justify-around py-12">
          {[1, 2, 3, 2, 1].map((dots, i) => renderDots(dots))}  
        </div>

        <div className="grid grid-cols-7 gap-0 border-2 border-gray-800">
          {Array(7).fill(null).map((_, y) => (
            Array(7).fill(null).map((_, x) => renderCell(x, y))
          ))}
        </div>
      </div>

      <div className="mt-4 text-white">
        <div>黄色の上がり: {gameState.pieces.yellow.filter(p => p.completed).length}/4</div>
        <div>赤の上がり: {gameState.pieces.red.filter(p => p.completed).length}/4</div>
      </div>
    </div>
  );
};

export default SquadroBoard;
