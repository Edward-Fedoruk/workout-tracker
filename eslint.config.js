import auto from 'eslint-config-canonical/auto';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'drizzle',
      'package-lock.json',
      'node_modules',
      '.claude',
      '.specify',
      'exercises-dataset',
      'scripts',
    ],
  },
  ...auto,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'promise/prefer-await-to-then': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // RTK Query models no-argument endpoints and no-result mutations as `void`
    // in endpoint type arguments (e.g. `build.query<Result, void>` /
    // `build.mutation<void, Arg>`), which is idiomatic and type-safe. The rule
    // only guards `void` in parameter positions, so disable it for the store.
    files: ['src/store/**/*.ts'],
    rules: {
      '@typescript-eslint/no-invalid-void-type': 'off',
    },
  },
);
