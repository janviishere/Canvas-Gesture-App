export interface Position {
  x: number
  y: number
}

export interface DrawingState {
  isDrawing: boolean
  currentColor: string
  cursorPosition: Position
}