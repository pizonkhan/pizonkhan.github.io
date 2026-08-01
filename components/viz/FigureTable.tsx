export interface FigureTableColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export interface FigureTableProps {
  caption: string
  columns: FigureTableColumn[]
  rows: Record<string, string>[]
}

/** The accessible table equivalent rendered inside Figure's disclosure. No sorting, no virtualisation. */
export function FigureTable({ caption, columns, rows }: FigureTableProps) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col" data-align={column.align === 'right' ? 'right' : undefined}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${index}-${row[columns[0]?.key ?? '']}`}>
            {columns.map((column) => (
              <td key={column.key} data-align={column.align === 'right' ? 'right' : undefined}>
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
