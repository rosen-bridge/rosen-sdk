export default {
  '*.ts': () => 'npm run type-check',
  '*.{js,ts}': ['eslint --fix', 'npm run test -- related -- --run'],
  '*': 'prettier --ignore-unknown --write',
};
