import { describe, expect, it } from '@jest/globals';

import { Cola } from '../Cola';
import { Pila } from '../Pila';

describe('Estructura Pila', () => {
  it('inicia vacía con tamanio 0 y peek/pop indefinidos', () => {
    const pila = new Pila<string>();
    expect(pila.tamanio).toBe(0);
    expect(pila.estaVacia()).toBe(true);
    expect(pila.peek()).toBeUndefined();
    expect(pila.pop()).toBeUndefined();
  });

  it('respeta orden LIFO al apilar y desapilar', () => {
    const pila = new Pila<number>();
    pila.push(10);
    pila.push(20);
    pila.push(30);

    expect(pila.tamanio).toBe(3);
    expect(pila.peek()).toBe(30);
    expect(pila.pop()).toBe(30);
    expect(pila.pop()).toBe(20);
    expect(pila.tamanio).toBe(1);
    expect(pila.aArray()).toEqual([10]);
  });

  it('devuelve una copia en aArray y clonar mantiene instancias independientes', () => {
    const original = new Pila<string>(['A', 'B']);
    const copiaArray = original.aArray();
    copiaArray.push('Z');
    expect(original.tamanio).toBe(2);

    const clon = original.clonar();
    clon.push('C');
    expect(original.tamanio).toBe(2);
    expect(clon.tamanio).toBe(3);
  });
});

describe('Estructura Cola', () => {
  it('inicia vacía y desencolar una cola vacía devuelve undefined sin romper índices', () => {
    const cola = new Cola<string>();
    expect(cola.tamanio).toBe(0);
    expect(cola.estaVacia()).toBe(true);
    expect(cola.frente()).toBeUndefined();
    expect(cola.desencolar()).toBeUndefined();
    expect(cola.tamanio).toBe(0);
  });

  it('respeta orden FIFO al encolar y desencolar sin usar shift', () => {
    const cola = new Cola<string>();
    cola.encolar('Ana');
    cola.encolar('Bruno');
    cola.encolar('Carla');

    expect(cola.tamanio).toBe(3);
    expect(cola.frente()).toBe('Ana');
    expect(cola.desencolar()).toBe('Ana');
    expect(cola.frente()).toBe('Bruno');
    expect(cola.tamanio).toBe(2);
    expect(cola.aArray()).toEqual(['Bruno', 'Carla']);
  });

  it('calcula correctamente la posición de un elemento en espera', () => {
    const cola = new Cola<string>(['Lucía', 'Martín', 'Estudiante IPF']);
    expect(cola.posicionDe('Lucía')).toBe(1);
    expect(cola.posicionDe('Estudiante IPF')).toBe(3);
    expect(cola.posicionDe('No existe')).toBe(-1);
  });

  it('reinicia correctamente al vaciarse y permite volver a encolar', () => {
    const cola = new Cola<string>(['Uno', 'Dos']);
    expect(cola.desencolar()).toBe('Uno');
    expect(cola.desencolar()).toBe('Dos');
    expect(cola.estaVacia()).toBe(true);

    cola.encolar('Tres');
    expect(cola.tamanio).toBe(1);
    expect(cola.frente()).toBe('Tres');
    expect(cola.aArray()).toEqual(['Tres']);
  });

  it('clonar crea una instancia independiente con el mismo orden', () => {
    const original = new Cola<string>(['Ana', 'Luis']);
    const clon = original.clonar();
    clon.desencolar();
    clon.encolar('Sofía');

    expect(original.aArray()).toEqual(['Ana', 'Luis']);
    expect(clon.aArray()).toEqual(['Luis', 'Sofía']);
  });
});
