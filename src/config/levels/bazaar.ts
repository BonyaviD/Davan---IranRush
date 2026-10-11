import { E, G, O, add, cart, div, level, mul, sub } from './build';

/** Bazaar: carts in the narrow street; the last run ends with Zahhak again. */
export const BAZAAR = [
  level('bazaar-01', 'bazaar', 10, [
    G(400, add(10), sub(5)),
    G(900, mul(2), add(5)),
    E(1300, 15),
    G(1700, sub(10), add(20)),
    G(2200, div(2), mul(2)),
  ], { z: 2750, hp: 50, kind: 'div-sepid' }),

  level('bazaar-02', 'bazaar', 10, [
    G(400, mul(2), add(5)),
    O(cart(650, -0.5)),
    G(900, add(25), sub(5)),
    E(1300, 20),
    O(cart(1550, 0.5)),
    G(1800, mul(3), div(2)),
    G(2300, sub(15), add(35)),
  ], { z: 2800, hp: 80, kind: 'div-sepid' }),

  level('bazaar-03', 'bazaar', 14, [
    G(400, add(14, true), sub(7, true)),
    G(800, mul(3), add(10)),
    E(1200, 35),
    O(cart(1450, 0)),
    G(1700, mul(2), div(2)),
    E(2100, 40),
    G(2500, add(40, true), mul(2, true)),
  ], { z: 3100, hp: 90, kind: 'zahhak' }),
];
