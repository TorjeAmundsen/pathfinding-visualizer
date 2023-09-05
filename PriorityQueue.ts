// The PriorityQueue was by far the hardest part of the project to wrap my head around
//
// It works though lol
//
// It's not actually needed for uniform cost per node, but I'm saving the code for future weighted algorithms

type QueuedItem = {
  row: number;
  col: number;
  distance: number;
};

class PriorityQueue<T> {
  private heap: T[] = [];

  constructor(private comparator: (a: T, b: T) => number) {}

  enqueue(element: T) {
    this.heap.push(element);
    this.up();
  }

  dequeue(): T | null {
    if (this.isEmpty()) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.down();
    return min;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private up() {
    let i = this.heap.length - 1;
    while (i > 0) {
      const pIndex = Math.floor((i - 1) / 2);
      if (this.comparator(this.heap[i], this.heap[pIndex]) >= 0) break;
      [this.heap[i], this.heap[pIndex]] = [this.heap[pIndex], this.heap[i]];
      i = pIndex;
    }
  }

  private down() {
    let i = 0;
    const len = this.heap.length;
    const element = this.heap[0];
    while (true) {
      const leftChildIndex = 2 * i + 1;
      const rightChildIndex = 2 * i + 2;
      let leftChild, rightChild;
      let swap = null;
      if (leftChildIndex < len) {
        leftChild = this.heap[leftChildIndex];
        if (this.comparator(leftChild, element) < 0) {
          swap = leftChildIndex;
        }
      }
      if (rightChildIndex < len) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && this.comparator(rightChild, element) < 0) ||
          (swap !== null && this.comparator(rightChild, leftChild) < 0)
        ) {
          swap = rightChildIndex;
        }
      }
      if (swap === null) break;
      this.heap[i] = this.heap[swap];
      this.heap[swap] = element;
      i = swap;
    }
  }
}
