import assert from 'node:assert/strict'
import test from 'node:test'
import { isOfficialCourtLink } from '../src/lib/official-link'
test('court URLs must point to official HTTPS domains', () => {
  assert.equal(isOfficialCourtLink('https://2kas.sudrf.ru/modules.php?case_id=1'), true)
  assert.equal(isOfficialCourtLink('https://www.mos-gorsud.ru/cases'), true)
  assert.equal(isOfficialCourtLink('https://mos-gorsud.ru.evil.example/cases'), false)
  assert.equal(isOfficialCourtLink('http://2kas.sudrf.ru/'), false)
  assert.equal(isOfficialCourtLink('javascript:alert(1)'), false)
  assert.equal(isOfficialCourtLink('https://evil.example/'), false)
})
