const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

test('configures installable macOS packages for Intel and Apple Silicon', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts['dist:mac:x64'], /--mac dmg --x64/);
  assert.match(packageJson.scripts['dist:mac:arm64'], /--mac dmg --arm64/);
  assert.equal(packageJson.build.mac.icon, 'build/icon.icns');
  assert.equal(packageJson.build.mac.target, 'dmg');
  assert.equal(packageJson.build.mac.category, 'public.app-category.productivity');

  const icon = fs.readFileSync(path.join(root, 'build', 'icon.icns'));
  assert.equal(icon.subarray(0, 4).toString('ascii'), 'icns');

  const workflow = fs.readFileSync(
    path.join(root, '.github', 'workflows', 'build-installers.yml'),
    'utf8',
  );
  assert.match(workflow, /os: macos-15-intel[\s\S]+npm run dist:mac:x64/);
  assert.match(workflow, /os: macos-15\r?\n[\s\S]+npm run dist:mac:arm64/);
  assert.match(workflow, /dist\/\*-mac-x64\.dmg/);
  assert.match(workflow, /dist\/\*-mac-arm64\.dmg/);
});
