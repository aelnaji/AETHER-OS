// Jest setup file
// This file is run before each test file

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js usePathname
jest.mock('next/navigation', () => ({
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      forward: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window resize observer
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ReactDOM.render is no longer supported') ||
     args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillUpdate'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    input: 'input',
    textarea: 'textarea',
    form: 'form',
    ul: 'ul',
    li: 'li',
    a: 'a',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    main: 'main',
    aside: 'aside',
    figure: 'figure',
    figcaption: 'figcaption',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
  useInView: () => ({ ref: jest.fn(), inView: false }),
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
}));

// Setup timeout for async tests
jest.setTimeout(30000);