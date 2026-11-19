/** 값이 있으면 빼고 없으면 넣은 새 Set */
export const toggleInSet = <T>(current: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(current);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};
