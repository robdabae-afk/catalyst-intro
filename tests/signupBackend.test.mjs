import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Baseline 588fc46. This is a UI-only change. Keep validation, referral lookup,
// consent metadata, auth call, avatar upload and legacy profile writes intact.
const form = readFileSync(new URL('../src/pages/app/AppSignupForm.tsx', import.meta.url), 'utf8');
const baseline = {
  "validation": "0df33bd4703fec439ce8c93e51f07b95d50c24485ea0eb2b34cf7924314e18bc",
  "avatar": "168cba3776f05e23edaa9af6defbbddc75be626128399aa4ab6f8f92a6fd7f54",
  "account_creation": "28d4c27285eaddbbb578e460de88d13b05872190567d2c3247829edbbf1218fc"
};
const segments = {
  validation: form.split('  const canContinue = (): boolean => {')[1]?.split('  const uploadAvatar = async')[0],
  avatar: form.split('  const uploadAvatar = async')[1]?.split('  const submit = async')[0],
  account_creation: form.split('    let referralValid = false;')[1]?.split('      navigate("/");')[0]?.split('      setCreated(')[0],
};
for (const [name, expected] of Object.entries(baseline)) {
  test(name + ' remains identical to existing signup backend', () => {
    assert.ok(segments[name], 'existing signup implementation must remain');
    const digest = createHash('sha256').update(segments[name].replace(/\s/g, '')).digest('hex');
    assert.equal(digest, expected);
  });
}

test('existing signup routes and components stay available', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  for (const route of ['/app/signup', '/signup', '/app/signup/form', '/signup/form']) {
    assert.ok(app.includes('path="' + route + '"'));
  }
  assert.match(app, /path="\/" element={<Landing \/>} /);
});

test('hero keeps real waitlist persistence and duplicate/error handling', () => {
  const landing = readFileSync(new URL('../src/redesign/Landing.tsx', import.meta.url), 'utf8');
  assert.ok(landing.includes('.from("waitlist_signups")'));
  assert.ok(landing.includes('.insert({ name: name.trim(), email: email.trim().toLowerCase(), user_type: role })'));
  assert.ok(landing.includes('error.code !== "23505"'));
  assert.ok(landing.includes('navigate(' + String.fromCharCode(96) + '/signup/form?'));
  assert.ok(!landing.includes("You're on the list."));
});

test('account-created screen respects email confirmation and enters real app', () => {
  assert.ok(form.includes('setCreated({ hasSession: !!authData.session })'));
  assert.ok(form.includes('Your account has been created'));
  assert.ok(form.includes('navigate("/feed")'));
  assert.ok(form.includes('Confirm your email'));
});
