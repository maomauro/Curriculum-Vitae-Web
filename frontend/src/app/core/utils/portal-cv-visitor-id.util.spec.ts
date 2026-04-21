import { getOrCreatePortalCvVisitorId } from './portal-cv-visitor-id.util';

const STORAGE_KEY = 'portalcv_vid';
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('getOrCreatePortalCvVisitorId()', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('genera un UUID v4 valido cuando no hay nada en localStorage', () => {
    const id = getOrCreatePortalCvVisitorId();

    expect(id).toMatch(UUID_V4_REGEX);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(id);
  });

  it('reutiliza el id existente en localStorage si ya es un UUID valido', () => {
    const existing = '550e8400-e29b-41d4-a716-446655440000';
    localStorage.setItem(STORAGE_KEY, existing);

    const id = getOrCreatePortalCvVisitorId();

    expect(id).toBe(existing);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(existing);
  });

  it('recorta espacios del valor guardado antes de validarlo', () => {
    const existing = '550e8400-e29b-41d4-a716-446655440000';
    localStorage.setItem(STORAGE_KEY, `  ${existing}  `);

    const id = getOrCreatePortalCvVisitorId();

    expect(id).toBe(existing);
  });

  it('regenera el id cuando el valor guardado no es un UUID valido', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-uuid');

    const id = getOrCreatePortalCvVisitorId();

    expect(id).toMatch(UUID_V4_REGEX);
    expect(id).not.toBe('not-a-uuid');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(id);
  });

  it('regenera el id cuando localStorage contiene una cadena vacia', () => {
    localStorage.setItem(STORAGE_KEY, '');

    const id = getOrCreatePortalCvVisitorId();

    expect(id).toMatch(UUID_V4_REGEX);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(id);
  });

  it('devuelve cadena vacia si localStorage.getItem lanza una excepcion', () => {
    const spy = spyOn(Storage.prototype, 'getItem').and.throwError('denied');

    const id = getOrCreatePortalCvVisitorId();

    expect(id).toBe('');
    expect(spy).toHaveBeenCalled();
  });

  it('devuelve cadena vacia si localStorage.setItem lanza una excepcion', () => {
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    const setSpy = spyOn(Storage.prototype, 'setItem').and.throwError('quota');

    const id = getOrCreatePortalCvVisitorId();

    expect(id).toBe('');
    expect(setSpy).toHaveBeenCalled();
  });

  it('genera ids diferentes en llamadas sucesivas cuando no hay nada persistido', () => {
    const first = getOrCreatePortalCvVisitorId();
    localStorage.removeItem(STORAGE_KEY);
    const second = getOrCreatePortalCvVisitorId();

    expect(first).toMatch(UUID_V4_REGEX);
    expect(second).toMatch(UUID_V4_REGEX);
    expect(first).not.toBe(second);
  });
});
