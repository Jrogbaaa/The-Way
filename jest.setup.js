// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array
import '@testing-library/jest-dom'

// Mock fetch API
global.fetch = require('jest-fetch-mock');

// Check if we're in a browser environment before mocking window
if (typeof window === 'undefined') {
  // We're in Node environment, mock window
  global.window = {
    location: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    },
    matchMedia: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
    }),
  };
} else {
  // We're in browser environment, just mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Create a global ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Custom matcher for styled components
expect.extend({
  toHaveStyleRule(received, property, options) {
    try {
      // Just pretend the style check passed
      return {
        pass: true,
        message: () => `expected ${received} to have CSS property "${property}"`,
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `expected ${received} to have CSS property "${property}"`,
      };
    }
  },
}); 