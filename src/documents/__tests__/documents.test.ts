import { documentFileName } from '../files';
import { formatBytes } from '../meta';

describe('belge dosya adı', () => {
  it('kimliği kullanır, uzantıyı korur', () => {
    expect(documentFileName('abc123', 'ruhsat.PDF')).toBe('abc123.pdf');
    expect(documentFileName('abc123', 'foto.jpeg')).toBe('abc123.jpeg');
  });

  it('uzantısız ya da tuhaf adlarda uzantı eklemez', () => {
    expect(documentFileName('abc123', 'belge')).toBe('abc123');
    expect(documentFileName('abc123', '.gizli')).toBe('abc123');
    expect(documentFileName('abc123', 'belge.uzunuzanti')).toBe('abc123');
  });

  it('dosya adındaki yol ayracını taşımaz', () => {
    expect(documentFileName('abc123', '../../etc/passwd.pdf')).toBe('abc123.pdf');
  });
});

describe('dosya boyutu', () => {
  it('bayt, KB ve MB gösterir', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3,0 MB');
  });

  it('bilinmeyen boyutta boş döner', () => {
    expect(formatBytes(null)).toBe('');
    expect(formatBytes(0)).toBe('');
  });
});
