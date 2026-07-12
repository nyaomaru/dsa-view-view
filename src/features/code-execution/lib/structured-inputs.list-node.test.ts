import { describe, expect, it } from 'vite-plus/test'
import { executeCode } from './runner'
import { convertInputValues } from './structured-inputs'
import type { FunctionParameter } from '@/entities/code'

type TestListNode = {
  val: number
  next: TestListNode | null
}

function listToArray(node: TestListNode | null): number[] {
  const values: number[] = []
  let current = node

  while (current !== null) {
    values.push(current.val)
    current = current.next
  }

  return values
}

function hasCycleInTestList(node: TestListNode | null): boolean {
  let slow = node
  let fast = node

  while (fast !== null && fast.next !== null) {
    slow = slow?.next ?? null
    fast = fast.next.next

    if (slow === fast) return true
  }

  return false
}

describe('list node inputs', () => {
  const parameters: FunctionParameter[] = [
    { name: 'list1', type: 'list-node', optional: false },
    { name: 'list2', type: 'list-node', optional: false },
  ]

  it('builds linked lists from form rows', () => {
    const inputs = convertInputValues(parameters, {
      list1: [{ val: '1' }, { val: '2' }, { val: '4' }],
      list2: [{ val: '1' }, { val: '3' }, { val: '4' }],
    }) as {
      list1: TestListNode | null
      list2: TestListNode | null
    }

    expect(listToArray(inputs.list1)).toEqual([1, 2, 4])
    expect(listToArray(inputs.list2)).toEqual([1, 3, 4])
  })

  it('builds linked lists with a cycle from pos', () => {
    const inputs = convertInputValues(
      [{ name: 'head', type: 'list-node', optional: false }],
      {
        head: {
          rows: [{ val: '3' }, { val: '2' }, { val: '0' }, { val: '-4' }],
          pos: '1',
        },
      }
    ) as {
      head: TestListNode | null
    }

    expect(inputs.head?.next?.next?.next?.next).toBe(inputs.head?.next)
    expect(hasCycleInTestList(inputs.head)).toBe(true)
  })

  it('builds linked lists from array text with a cycle from pos', () => {
    const inputs = convertInputValues(
      [{ name: 'head', type: 'list-node', optional: false }],
      {
        head: {
          values: '[3,2,0,-4]',
          pos: '1',
        },
      }
    ) as {
      head: TestListNode | null
    }

    expect(inputs.head?.val).toBe(3)
    expect(inputs.head?.next?.val).toBe(2)
    expect(inputs.head?.next?.next?.val).toBe(0)
    expect(inputs.head?.next?.next?.next?.val).toBe(-4)
    expect(inputs.head?.next?.next?.next?.next).toBe(inputs.head?.next)
  })

  it('executes hasCycle with generated cycle input', () => {
    const code = `
class ListNode {
  val: number
  next: ListNode | null

  constructor(val: number, next: ListNode | null) {
    this.val = val
    this.next = next
  }
}

function hasCycle(head: ListNode | null): boolean {
  let slow = head
  let fast = head

  while (fast !== null && fast.next !== null) {
    slow = slow.next
    fast = fast.next.next

    if (slow === fast) {
      return true
    }
  }

  return false
}
`

    const listParameter: FunctionParameter[] = [
      { name: 'head', type: 'list-node', optional: false },
    ]
    const cyclicInputs = convertInputValues(listParameter, {
      head: {
        values: '[3,2,0,-4]',
        pos: '1',
      },
    })
    const acyclicInputs = convertInputValues(listParameter, {
      head: {
        rows: [{ val: '1' }],
        pos: '-1',
      },
    })

    expect(executeCode(code, cyclicInputs, 'hasCycle').returnValue).toBe(true)
    expect(executeCode(code, acyclicInputs, 'hasCycle').returnValue).toBe(false)
  })

  it('executes mergeTwoLists with generated next pointers', () => {
    const code = `
class ListNode {
  val: number
  next: ListNode | null
  constructor(val?: number, next?: ListNode | null) {
    this.val = val === undefined ? 0 : val
    this.next = next === undefined ? null : next
  }
}

function mergeTwoLists(
  list1: ListNode | null,
  list2: ListNode | null
): ListNode | null {
  const dummyHead = new ListNode()
  let current = dummyHead

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      current.next = list1
      list1 = list1.next
    } else {
      current.next = list2
      list2 = list2.next
    }

    current = current.next
  }

  current.next = list1 !== null ? list1 : list2

  return dummyHead.next
}
`

    const inputs = convertInputValues(parameters, {
      list1: [{ val: '1' }, { val: '2' }, { val: '4' }],
      list2: [{ val: '1' }, { val: '3' }, { val: '4' }],
    })

    const state = executeCode(code, inputs, 'mergeTwoLists')

    expect(state.error).toBeUndefined()
    expect(listToArray(state.returnValue as TestListNode | null)).toEqual([
      1, 1, 2, 3, 4, 4,
    ])
  })
})
