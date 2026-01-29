import { useEffect, useState } from "react";
import pacmanGif from "./assets/pacman.gif";
import ghostGif from "./assets/ghost.gif";
import "./App.css";

export default function App() {
  const gridSize = 15;

  // ✅ Full Maze Walls
  const walls = [
    // Outer Borders
    ...Array.from({ length: gridSize }, (_, i) => ({ x: i, y: 0 })),
    ...Array.from({ length: gridSize }, (_, i) => ({
      x: i,
      y: gridSize - 1,
    })),
    ...Array.from({ length: gridSize }, (_, i) => ({ x: 0, y: i })),
    ...Array.from({ length: gridSize }, (_, i) => ({
      x: gridSize - 1,
      y: i,
    })),

    // Inner Maze Blocks
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 6, y: 3 },

    { x: 3, y: 5 },
    { x: 3, y: 6 },
    { x: 3, y: 7 },

    { x: 6, y: 6 },
    { x: 7, y: 6 },
    { x: 8, y: 6 },

    { x: 10, y: 4 },
    { x: 10, y: 5 },
    { x: 10, y: 6 },

    { x: 11, y: 10 },
    { x: 12, y: 10 },
    { x: 13, y: 10 },

    { x: 6, y: 11 },
    { x: 7, y: 11 },
    { x: 8, y: 11 },
  ];

  const isWall = (x, y) =>
    walls.some((w) => w.x === x && w.y === y);

  // Pac-Man
  const [pacman, setPacman] = useState({ x: 1, y: 1 });
  const [direction, setDirection] = useState({ dx: 0, dy: 0 });

  // 👻 Multiple Ghosts
  const [ghosts, setGhosts] = useState([
    { id: 1, x: 13, y: 13, vulnerable: false },
    { id: 2, x: 13, y: 1, vulnerable: false },
    { id: 3, x: 1, y: 13, vulnerable: false },
  ]);

  // Food + Power Food
  const [food, setFood] = useState(
    Array.from({ length: gridSize }, (_, y) =>
      Array.from({ length: gridSize }, (_, x) => ({
        x,
        y,
        power:
          (x === 2 && y === 2) ||
          (x === 13 && y === 2) ||
          (x === 2 && y === 13) ||
          (x === 13 && y === 13),
      }))
    )
      .flat()
      .filter(
        (dot) =>
          !(dot.x === pacman.x && dot.y === pacman.y) &&
          !isWall(dot.x, dot.y)
      )
  );

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  // ✅ Move Pac-Man
  const movePacman = (dx, dy) => {
    setPacman((prev) => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      if (isWall(newX, newY)) return prev;

      return { x: newX, y: newY };
    });
  };


  // ✅ PC Keyboard Controls
useEffect(() => {
  const handleKeyDown = (e) => {
    if (gameOver || win) return;

    if (e.key === "ArrowUp" || e.key === "w") {
      setDirection({ dx: 0, dy: -1 });
    }

    if (e.key === "ArrowDown" || e.key === "s") {
      setDirection({ dx: 0, dy: 1 });
    }

    if (e.key === "ArrowLeft" || e.key === "a") {
      setDirection({ dx: -1, dy: 0 });
    }

    if (e.key === "ArrowRight" || e.key === "d") {
      setDirection({ dx: 1, dy: 0 });
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [gameOver, win]);

  // Smooth Movement
  useEffect(() => {
    if (gameOver || win) return;

    const loop = setInterval(() => {
      if (direction.dx !== 0 || direction.dy !== 0) {
        movePacman(direction.dx, direction.dy);
      }
    }, 200);

    return () => clearInterval(loop);
  }, [direction]);

  // Eat Food
  useEffect(() => {
    const dot = food.find((f) => f.x === pacman.x && f.y === pacman.y);

    if (dot) {
      setFood((prev) =>
        prev.filter((f) => !(f.x === dot.x && f.y === dot.y))
      );

      setScore((s) => s + (dot.power ? 50 : 10));

      // Power Mode
      if (dot.power) {
        setGhosts((prev) =>
          prev.map((g) => ({ ...g, vulnerable: true }))
        );

        setTimeout(() => {
          setGhosts((prev) =>
            prev.map((g) => ({ ...g, vulnerable: false }))
          );
        }, 5000);
      }
    }

    if (food.length === 1) setWin(true);
  }, [pacman]);

  // 👻 Smart Ghost AI (All Ghosts Chase)
  useEffect(() => {
    if (gameOver || win) return;

    const interval = setInterval(() => {
      setGhosts((prevGhosts) =>
        prevGhosts.map((ghost) => {
          const moves = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
          ];

          let bestMove = null;
          let bestDistance = ghost.vulnerable ? -Infinity : Infinity;

          moves.forEach((move) => {
            const newX = ghost.x + move.dx;
            const newY = ghost.y + move.dy;

            if (isWall(newX, newY)) return;

            let dist =
              Math.abs(pacman.x - newX) + Math.abs(pacman.y - newY);

            if (ghost.vulnerable) {
              if (dist > bestDistance) {
                bestDistance = dist;
                bestMove = move;
              }
            } else {
              if (dist < bestDistance) {
                bestDistance = dist;
                bestMove = move;
              }
            }
          });

          return bestMove
            ? { ...ghost, x: ghost.x + bestMove.dx, y: ghost.y + bestMove.dy }
            : ghost;
        })
      );
    }, 350);

    return () => clearInterval(interval);
  }, [pacman]);

  // Collision
  useEffect(() => {
    ghosts.forEach((ghost) => {
      if (ghost.x === pacman.x && ghost.y === pacman.y) {
        if (ghost.vulnerable) {
          setScore((s) => s + 100);
          setGhosts((prev) =>
            prev.map((g) =>
              g.id === ghost.id
                ? { ...g, x: 13, y: 13, vulnerable: false }
                : g
            )
          );
        } else {
          setGameOver(true);
        }
      }
    });
  }, [pacman, ghosts]);

  // Restart
  const restartGame = () => window.location.reload();

  return (
    <div className="game-container">
      <h1>🟡 Pac-Man Maze</h1>
      <h2>Score: {score}</h2>

      {gameOver && (
        <div className="message">
          <h2>💀 Game Over!</h2>
          <button onClick={restartGame}>Restart</button>
        </div>
      )}

      {win && (
        <div className="message">
          <h2>🎉 You Win!</h2>
          <button onClick={restartGame}>Play Again</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid">
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);

          const isPac = pacman.x === x && pacman.y === y;
          const ghostHere = ghosts.find((g) => g.x === x && g.y === y);
          const dot = food.find((f) => f.x === x && f.y === y);

          return (
            <div key={index} className={`cell ${isWall(x, y) ? "wall" : ""}`}>
              {dot && (
                <div className={dot.power ? "power-food" : "food"}></div>
              )}

              {ghostHere && (
                <img
                  src={ghostGif}
                  className={`ghost ${
                    ghostHere.vulnerable ? "vulnerable" : ""
                  }`}
                  alt="ghost"
                />
              )}

              {isPac && <img src={pacmanGif} className="pacman" alt="pacman" />}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="controls">
        <button onClick={() => setDirection({ dx: 0, dy: -1 })}>⬆️</button>
        <div>
          <button onClick={() => setDirection({ dx: -1, dy: 0 })}>⬅️</button>
          <button onClick={() => setDirection({ dx: 1, dy: 0 })}>➡️</button>
        </div>
        <button onClick={() => setDirection({ dx: 0, dy: 1 })}>⬇️</button>
      </div>
    </div>
  );
}
