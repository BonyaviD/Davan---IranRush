import { E, G, O, add, div, level, mul, sub, urn } from './build';

/** Isfahan: urns block parts of the road; Akvan and the White Div wait at the bridge. */
export const ISFAHAN = [
  level('isfahan-01', 'isfahan', 12, [
    G(400, mul(2), sub(6)),
    G(900, div(2), add(15)),
    E(1300, 20),
    G(1700, sub(10), mul(3)),
    G(2200, add(25), sub(30)),
  ], { z: 2750, hp: 50, kind: 'akvan' }),

  level('isfahan-02', 'isfahan', 12, [
    G(400, add(12), mul(2)),
    O(urn(700, 0)),
    G(1000, mul(3), sub(8)),
    E(1400, 30),
    G(1800, add(30), div(3)),
    O(urn(2100, 0.5)),
    G(2400, mul(2), sub(20)),
  ], { z: 2900, hp: 100, kind: 'akvan' }),

  level('isfahan-03', 'isfahan', 18, [
    G(400, mul(2), sub(9)),
    G(800, add(24, true), div(2, true)),
    E(1200, 25),
    O(urn(1500, -0.5)),
    G(1800, mul(3), add(15)),
    E(2200, 45),
    G(2600, add(50), mul(2)),
  ], { z: 3100, hp: 90, kind: 'div-sepid' }),
];
