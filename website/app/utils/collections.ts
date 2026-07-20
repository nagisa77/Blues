export const indexBy = <Item, Key>(
  items: readonly Item[],
  keyFor: (item: Item) => Key,
) => new Map(items.map(item => [keyFor(item), item]))

export const groupBy = <Item, Key>(
  items: readonly Item[],
  keyFor: (item: Item) => Key,
) => items.reduce((groups, item) => {
  const key = keyFor(item)
  const group = groups.get(key)
  if (group) group.push(item)
  else groups.set(key, [item])
  return groups
}, new Map<Key, Item[]>())
