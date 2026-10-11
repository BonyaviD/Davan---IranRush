import { E, G, O, add, div, level, motor, mul, sub, taxi } from './build';

/** Tehran: learn the basics, meet traffic and mystery gates, face Zahhak at the end. */
export const TEHRAN = [
  level('tehran-01', 'tehran', 10, [
    G(400, add(10), sub(3)),
    G(900, mul(2), add(5)),
    E(1300, 15),
    G(1700, add(20), div(2)),
    G(2100, mul(2), sub(10)),
  ], { z: 2500, hp: 25, kind: 'div-sepid' }),

  level('tehran-02', 'tehran', 12, [
    G(400, mul(2), add(4)),
    O(taxi(700)),
    G(1100, sub(6), add(16)),
    E(1500, 20),
    G(1900, mul(3), add(10)),
    O(motor(2250)),
    G(2600, add(25), div(2)),
  ], { z: 3000, hp: 50, kind: 'div-sepid' }),

  level('tehran-03', 'tehran', 15, [
    G(400, add(15), mul(3)),
    G(900, sub(20, true), mul(2, true)),
    E(1300, 30),
    O(taxi(1600, 1, 0.5)),
    G(1900, div(3), add(40)),
    G(2400, mul(2, true), sub(30, true)),
    E(2800, 80),
  ], { z: 3200, hp: 90, kind: 'akvan' }),

  level('tehran-04', 'tehran', 10, [
    G(400, mul(3), add(10)),
    O(motor(700, -1, 0.8)),
    G(1000, add(30), sub(5)),
    E(1400, 25),
    G(1800, mul(3), div(2)),
    O(taxi(2100)),
    G(2400, sub(30), add(45)),
    E(2800, 70),
    G(3100, mul(2, true), add(20, true)),
  ], { z: 3500, hp: 120, kind: 'div-sepid' }),

  level('tehran-05', 'tehran', 20, [
    G(400, div(2), mul(2)),
    G(800, add(30), sub(15)),
    E(1200, 40),
    O(taxi(1500, -1, 0.55)),
    O(motor(1720, 1, 0.9)),
    G(2000, mul(4, true), div(2, true)),
    E(2400, 50),
    G(2800, add(60), mul(2)),
    O(taxi(3150, 1, 0.6)),
  ], { z: 3600, hp: 110, kind: 'akvan' }),

  level('tehran-06', 'tehran', 15, [
    G(400, add(15), mul(2)),
    G(900, mul(3), sub(10)),
    E(1300, 30),
    O(taxi(1550)),
    G(1800, div(2), add(40)),
    G(2200, sub(25), mul(2)),
    E(2600, 60),
    O(motor(2850, -1, 0.85)),
    G(3100, add(30, true), sub(40, true)),
    E(3500, 40),
  ], { z: 3950, hp: 100, kind: 'zahhak' }),
];
