const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePage, normalizeChoice, validateAreaInput, validateAccountStatus, requireAdmin, ACCOUNT_ROLES } = require('../../src/utils/admin');

test('admin normalizePage accepts positive integer',()=>assert.equal(normalizePage('3'),3));
test('admin normalizePage falls back for invalid values',()=>assert.equal(normalizePage('-4'),1));
test('admin normalizeChoice only accepts whitelisted values',()=>{assert.equal(normalizeChoice('Admin',ACCOUNT_ROLES),'Admin');assert.equal(normalizeChoice('Root',ACCOUNT_ROLES),'');});
test('admin area input trims and normalizes text',()=>assert.deepEqual(validateAreaInput({name:'  Bach   Khoa ',district:' Hai  Ba Trung '}),{name:'Bach Khoa',district:'Hai Ba Trung'}));
test('admin area input rejects missing district',()=>assert.throws(()=>validateAreaInput({name:'Bach Khoa',district:''}),/Quận\/huyện/));
test('admin account status accepts Hoat dong',()=>assert.equal(validateAccountStatus('Hoat dong'),'Hoat dong'));
test('admin account status rejects unknown status',()=>assert.throws(()=>validateAccountStatus('Deleted'),/không hợp lệ/));
test('admin requireAdmin rejects non-admin user',()=>assert.throws(()=>requireAdmin({role:'Chu san'}),/quản trị viên/));
