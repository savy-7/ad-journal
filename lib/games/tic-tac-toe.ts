export type Mark = "X" | "O";
export type TicTacToeBoard = (Mark | null)[]; // length 9, row-major

export type TicTacToeState = {
  board: TicTacToeBoard;
};

export function createInitialState(): TicTacToeState {
  return { board: Array(9).fill(null) };
}

export const WIN_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(
  board: TicTacToeBoard
): { mark: Mark; line: [number, number, number] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a] as Mark, line };
    }
  }
  return null;
}

export function isDraw(board: TicTacToeBoard): boolean {
  return board.every((cell) => cell !== null) && !checkWinner(board);
}
