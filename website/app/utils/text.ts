export const firstClause = (
  value: string | null | undefined,
  fallback: string,
  maximumLength = 76,
) => {
  if (!value) return fallback
  const clause = value.split(/[；。]/)[0]?.trim() || value
  return clause.length > maximumLength
    ? `${clause.slice(0, maximumLength)}…`
    : clause
}

export const searchableText = (values: Array<string | null | undefined>) =>
  values
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLocaleLowerCase('zh-CN')
