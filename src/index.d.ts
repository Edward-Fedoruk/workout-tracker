declare module '@sqlite.org/sqlite-wasm' {
  export function sqlite3Worker1Promiser(
    config: { onready: () => void },
  ): unknown
}
