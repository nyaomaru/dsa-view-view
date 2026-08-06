import { define, isFunction, isNonArrayObject } from '@/shared/lib/guards'

type SyncGeneratorIterator = Iterator<unknown, unknown, unknown> &
  Iterable<unknown>

/** Matches synchronous generator-like iterators without consuming them. */
export const isSyncGeneratorIterator = define<SyncGeneratorIterator>(
  (value) => {
    if (!isNonArrayObject(value) || !isFunction(value.next)) return false

    return isFunction(Reflect.get(value, Symbol.iterator))
  }
)

/** Advances a synchronous generator returned by an entry function to completion. */
export function consumeGenerator(iterator: SyncGeneratorIterator): unknown {
  let iteration = iterator.next()

  while (!iteration.done) {
    iteration = iterator.next()
  }

  return iteration.value
}
