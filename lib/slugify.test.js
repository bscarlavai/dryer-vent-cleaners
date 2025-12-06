const slugify = require('./slugify');

describe('slugify', () => {
  test('removes diacritics and special characters', () => {
    expect(slugify('Cat Café MOFF Ala Moana Center')).toBe('cat-cafe-moff-ala-moana-center');
    expect(slugify('Kailua-Kona')).toBe('kailua-kona');
    expect(slugify('München')).toBe('munchen');
    expect(slugify('São Paulo')).toBe('sao-paulo');
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('  Spaces   and---dashes ')).toBe('spaces-and-dashes');
    expect(slugify('École Élémentaire')).toBe('ecole-elementaire');
    expect(slugify('Café')).toBe('cafe');
    expect(slugify('naïve façade')).toBe('naive-facade');
    expect(slugify('foo')).toBe('foo');
    expect(slugify('FOO')).toBe('foo');
    expect(slugify('foo-bar')).toBe('foo-bar');
    expect(slugify('foo--bar')).toBe('foo-bar');
    expect(slugify('foo  bar')).toBe('foo-bar');
    expect(slugify('foo_bar')).toBe('foo-bar');
    expect(slugify('foo@bar.com')).toBe('foo-bar-com');
    expect(slugify('  ')).toBe('');
    expect(slugify('')).toBe('');
    expect(slugify("O'Malley's Cat Café")).toBe('omalleys-cat-cafe');
  });
}); 