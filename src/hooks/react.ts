import { useEffect, useRef } from 'react'

/* adapted from the example at https://usehooks.com/useMemoCompare/
 *
 * from the original example:
 *
 * This hook is similar to useMemo, but instead of passing an array of dependencies
 * we pass a custom compare function that receives the previous and new value. The
 * compare function can then compare nested properties, call object methods, or
 * anything else to determine equality. If the compare function returns true
 * then the hook returns the old object reference.
 */
export function useMemoCompare(next: any, compare: any): any {
  // Ref for storing previous value
  const previousRef = useRef()
  const previous = previousRef.current

  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  const isEqual = compare(previous, next)

  // If not equal update previousRef to next value.
  // We only update if not equal so that this hook continues to return
  // the same old value if compare keeps returning true.
  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next
    }
  })

  // Finally, if equal then return the previous value
  return isEqual ? previous : next
}
