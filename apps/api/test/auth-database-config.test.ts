import {describe,it,expect} from 'vitest';
import {readEnvironment} from '../src/config.js';
const base={DATABASE_URL:'postgresql://app@localhost/koraz',BETTER_AUTH_URL:'https://test.example',BETTER_AUTH_SECRET:'a'.repeat(32)};
describe('separate authentication database connection',()=>{
 it('keeps the application connection while selecting the auth connection',()=>{
  const config=readEnvironment({...base,AUTH_DATABASE_URL:'postgresql://auth@localhost/koraz'});
  expect(config.databaseUrl).toBe(base.DATABASE_URL);
  expect(config.auth?.databaseUrl).toBe('postgresql://auth@localhost/koraz');
 });
 it('preserves the existing shared-connection configuration',()=>{
  expect(readEnvironment(base).auth?.databaseUrl).toBe(base.DATABASE_URL);
 });
 it('rejects an auth connection without the required application/auth configuration',()=>{
  expect(()=>readEnvironment({AUTH_DATABASE_URL:'postgresql://auth@localhost/koraz'})).toThrow();
 });
});
