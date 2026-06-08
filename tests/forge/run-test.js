import { execSync } from 'child_process';
try {
  execSync('node C:/Users/RemiLequette/Development/with-claude/knowledgebase/tests/forge/type-registry.test.js', { stdio: 'inherit' });
} catch(e) {
  process.exit(1);
}
