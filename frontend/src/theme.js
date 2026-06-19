import { extendTheme } from '@chakra-ui/react';

const fonts = {
  heading: "'Roboto', Arial, sans-serif",
  body: "'Roboto', Arial, sans-serif",
};

const semanticTokens = {
  colors: {
    'app.bg': { default: '#f8fafc', _dark: '#09090b' },
    'app.surface': { default: '#ffffff', _dark: '#18181b' },
    'app.subtle': { default: '#f1f5f9', _dark: '#27272a' },
    'app.border': { default: '#e2e8f0', _dark: '#3f3f46' },
    'app.text': { default: '#0f172a', _dark: '#f4f4f5' },
    'app.muted': { default: '#64748b', _dark: '#a1a1aa' },
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 600,
      borderRadius: '8px',
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'app.surface',
        color: 'app.text',
        borderColor: 'app.border',
        borderRadius: '8px',
      },
    },
  },
  FormLabel: {
    baseStyle: {
      color: 'app.muted',
      fontWeight: 600,
    },
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'blue.500',
    },
    variants: {
      outline: {
        field: {
          bg: 'app.surface',
          color: 'app.text',
          borderColor: 'app.border',
          _placeholder: { color: 'app.muted' },
          _hover: { borderColor: 'app.muted' },
        },
      },
    },
  },
  Select: {
    defaultProps: {
      focusBorderColor: 'blue.500',
    },
    variants: {
      outline: {
        field: {
          bg: 'app.surface',
          color: 'app.text',
          borderColor: 'app.border',
          _placeholder: { color: 'app.muted' },
          _hover: { borderColor: 'app.muted' },
        },
      },
    },
  },
  Textarea: {
    variants: {
      outline: {
        bg: 'app.surface',
        color: 'app.text',
        borderColor: 'app.border',
        _placeholder: { color: 'app.muted' },
      },
    },
  },
};

const styles = {
  global: {
    body: {
      bg: 'app.bg',
      color: 'app.text',
      fontFamily: 'body',
    },
  },
};

export const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
    cssVarPrefix: 'smart-attendance',
  },
  fonts,
  semanticTokens,
  components,
  styles,
});
