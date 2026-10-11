import type Phaser from 'phaser';

/**
 * In-world numeric labels (counts, gate values). These contain only Persian digits and
 * operator symbols, which need no Arabic-script shaping, so canvas text is safe here.
 * All words/sentences stay in the DOM UI.
 */
export const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Vazirmatn, sans-serif',
  fontStyle: '800',
  fontSize: '40px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 6,
};
