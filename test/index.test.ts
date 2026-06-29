import { parsePackageString, encode } from '../lib';

const mod = parsePackageString;

describe('module string to object', () => {
  it('supports versionless', () =>
    expect(mod('nodemon')).toEqual({ name: 'nodemon', version: '*' }));

  it('switches latest to *', () =>
    expect(mod('nodemon@latest')).toEqual({ name: 'nodemon', version: '*' }));

  it('always give a version', () =>
    expect(mod('nodemon@')).toEqual({ name: 'nodemon', version: '*' }));

  it.each([
    ['nodemon@1', '1'],
    ['nodemon@1.0', '1.0'],
    ['nodemon@1.0.0', '1.0.0'],
  ])('with version: %s', (input: string, version: string) =>
    expect(mod(input as string)).toEqual({ name: 'nodemon', version })
  );

  it('private packages', () =>
    expect(mod('@remy/snyk-module')).toEqual({
      name: '@remy/snyk-module',
      version: '*',
    }));

  it('version arg works', () =>
    expect(mod('jsbin', '1')).toEqual({ name: 'jsbin', version: '1' }));

  it('scoped with version arg works', () =>
    expect(mod('@remy/jsbin', '1')).toEqual({
      name: '@remy/jsbin',
      version: '1',
    }));

  it.each(['a@1', 'url'])('%s parsed ok', (str: string) =>
    expect(mod(str)).toBeTruthy()
  );

  const baseUrls = [
    'https://github.com/remy/undefsafe',
    'https://github.com/remy/undefsafe/',
    'https://github.com/remy/undefsafe.git',
    'git@github.com:remy/undefsafe.git',
    'git@bitbucket.org:remy/undefsafe.git',
    'remy/undefsafe',
  ];

  const allUrls = baseUrls.reduce((acc, curr) => {
    acc.push(curr);
    if (curr.indexOf('@') === -1) {
      acc.push('undefsafe@' + curr);
    }
    return acc;
  }, [] as string[]);

  const expectedUndefsafe = { name: 'undefsafe', version: 'remy/undefsafe' };

  it.each(allUrls)('%s works', (url: string) =>
    expect(mod(url)).toEqual(expectedUndefsafe)
  );

  it('short github works', () =>
    expect(mod('jsbin/jsbin')).toEqual({
      name: 'jsbin',
      version: 'jsbin/jsbin',
    }));

  it('add hash correctly', () =>
    expect(mod('https://github.com/remy/undefsafe#123')).toEqual({
      name: 'undefsafe',
      version: 'remy/undefsafe#123',
    }));

  it('requires args', () =>
    expect(() => (mod as any)()).toThrow(/requires string/));

  it('package + giturl as version works', () =>
    expect(
      mod(
        'grunt-sails-linker@git://github.com/Zolmeister/grunt-sails-linker.git'
      )
    ).toEqual({
      name: 'grunt-sails-linker',
      version: 'Zolmeister/grunt-sails-linker',
    }));

  it('external git repo is supported', () =>
    expect(mod('ikt@git+http://ikt.pm2.io/ikt.git#master')).toEqual({
      name: 'ikt',
      version: 'git+http://ikt.pm2.io/ikt.git#master',
    }));

  it('external git repo with ssh is supported', () =>
    expect(mod('ikt@git+ssh://git@ikt.pm2.io/ikt.git#master')).toEqual({
      name: 'ikt',
      version: 'git+ssh://git@ikt.pm2.io/ikt.git#master',
    }));

  it('scoped package with git repo is supported', () =>
    expect(mod('@scope/ikt@git+ssh://git@ikt.pm2.io/ikt.git#master')).toEqual({
      name: '@scope/ikt',
      version: 'git+ssh://git@ikt.pm2.io/ikt.git#master',
    }));
});

describe('loose parsing', () => {
  const opts = { loose: true };

  it('package + giturl as version works', () =>
    expect(
      mod(
        'grunt-sails-linker@git://github.com/Zolmeister/grunt-sails-linker.git',
        opts
      )
    ).toEqual({
      name: 'grunt-sails-linker',
      version: 'Zolmeister/grunt-sails-linker',
    }));

  it('loose allows non-supported parsing', () =>
    expect(mod('ikt@git+http://ikt.pm2.io/ikt.git#master', opts)).toEqual({
      name: 'ikt',
      version: '*',
    }));
});

describe('vanilla urls from github', () => {
  const urls = [
    'https://github.com/snyk/module/tree/v1.6.0',
    'https://github.com/snyk/module',
    'https://github.com/snyk/module/tree/master',
    'https://github.com/snyk/module/commit/fc0ac92416fe330cb9d13b6cdefa007de81885ad',
  ];

  const expected = [
    { name: 'module', version: 'snyk/module#v1.6.0' },
    { name: 'module', version: 'snyk/module' },
    { name: 'module', version: 'snyk/module#master' },
    {
      name: 'module',
      version: 'snyk/module#fc0ac92416fe330cb9d13b6cdefa007de81885ad',
    },
  ];

  const cases = urls.map((url, i) => ({ url, exp: expected[i] }));

  it.each(cases)(
    '$url works',
    ({ url, exp }: { url: string; exp: typeof expected[number] }) => {
      expect(mod(url)).toEqual(exp);
    }
  );
});

describe('encoding', () => {
  it('vanilla strings unaffected', () => expect(encode('snyk')).toBe('snyk'));

  it('slash is escaped', () =>
    expect(encode('@snyk/config')).toBe('@snyk%2Fconfig'));
});

describe('Maven modules', () => {
  const groupId = 'org.apache.httpcomponents';
  const artifactId = 'httpcomponents-core';
  const packageName = groupId + ':' + artifactId;

  it('encodes colon in package name', () =>
    expect(encode(packageName)).toBe(groupId + '%3A' + artifactId));

  it('parses maven package without version', () =>
    expect(mod(packageName, { packageManager: 'maven' })).toEqual({
      name: packageName,
      version: '*',
    }));

  it('parses maven package with version', () =>
    expect(mod(packageName, '3.4.5', { packageManager: 'maven' })).toEqual({
      name: packageName,
      version: '3.4.5',
    }));

  it('parses maven package with SNAPSHOT version', () =>
    expect(
      mod(packageName, '3.4.5-SNAPSHOT', { packageManager: 'maven' })
    ).toEqual({
      name: packageName,
      version: '3.4.5-SNAPSHOT',
    }));

  it('parses maven package with @ version syntax', () =>
    expect(mod(packageName + '@3.4.5', { packageManager: 'maven' })).toEqual({
      name: packageName,
      version: '3.4.5',
    }));

  it('throws on incomplete maven package name', () =>
    expect(() => mod(groupId, { packageManager: 'maven' })).toThrow(
      'invalid Maven package name: ' + groupId
    ));

  it('returns parsed result for colon package without maven option', () =>
    expect(mod(packageName)).toEqual({
      name: packageName,
      version: '*',
    }));
});
