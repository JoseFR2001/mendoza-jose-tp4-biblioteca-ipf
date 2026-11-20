export class Pila<T> {
  #items: T[] = [];

  constructor(iniciales?: readonly T[]) {
    if (iniciales) {
      this.#items = [...iniciales];
    }
  }

  push(elemento: T): void {
    this.#items.push(elemento);
  }

  pop(): T | undefined {
    return this.#items.pop();
  }

  peek(): T | undefined {
    if (this.#items.length === 0) {
      return undefined;
    }
    return this.#items[this.#items.length - 1];
  }

  get tamanio(): number {
    return this.#items.length;
  }

  estaVacia(): boolean {
    return this.#items.length === 0;
  }

  aArray(): T[] {
    return [...this.#items];
  }

  clonar(): Pila<T> {
    return new Pila<T>(this.#items);
  }
}
