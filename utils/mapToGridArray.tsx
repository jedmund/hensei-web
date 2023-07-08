export function mapToGridArray<T>(arr: any[]): GridArray<T> {
  return arr.reduce(
    (gridArray, item) => ({ ...gridArray, [item.position]: item }),
    {} as GridArray<T>
  )
}
