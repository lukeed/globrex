'use strict';

const fs = require('fs');
const test = require('tape');
const globrex = require('../');

function g(t, glob, expect, opts) {
    let { regex } = globrex(glob, opts);
    t.is(regex.toString(), expect, '~> regex matches expectant');
    return regex;
}

test('globrex: standard', t => {
    let res = globrex('*.js');
    t.is(typeof globrex, 'function', 'consturctor is a typeof function');
    t.true(res instanceof Object, 'returns object');
    t.is(res.regex.toString(), '/^.*\\.js$/', 'returns regex object');
    t.is(res.string, '^.*\\.js$', 'returns string version');
    t.true(Array.isArray(res.segments), 'returns array of segments');
    t.end();
});

test('globrex: Standard * matching', t => {
    let rgx;

    rgx = g(t, '*', '/^.*$/');
    t.true(rgx.test('hello'), 'matches everything');

    rgx = g(t, '*', '/.*/g', { flags:'g' });
    t.true(rgx.test('foo'), 'matches everything');

    rgx = g(t, 'f*', '/^f.*$/');
    t.true(rgx.test('foo'), 'match the end');

    rgx = g(t, 'f*', '/f.*/g', { flags:'g' });
    t.true(rgx.test('foo'), 'match the end');

    rgx = g(t, '*o', '/^.*o$/');
    t.true(rgx.test('foo'), 'match the start');

    rgx = g(t, '*o', '/.*o/g', { flags:'g' });
    t.true(rgx.test('foo'), 'match the start');

    rgx = g(t, 'f*uck', '/^f.*uck$/');
    t.true(rgx.test('firetruck'), 'match the middle');

    rgx = g(t, 'f*uck', '/f.*uck/g', { flags:'g' });
    t.true(rgx.test('firetruck'), 'match the middle');

    rgx = g(t, 'uc', '/^uc$/');
    t.false(rgx.test('firetruck'), 'do not match without global flag');

    rgx = g(t, 'uc', '/uc/g', { flags:'g' });
    t.true(rgx.test('firetruck'), 'match anywhere with RegExp "g" flag');

    rgx = g(t, 'f*uck', '/^f.*uck$/');
    t.true(rgx.test('fuck'), 'match zero characters');

    rgx = g(t, 'f*uck', '/f.*uck/g', { flags:'g' });
    t.true(rgx.test('fuck'), 'match zero characters');

    t.end();
});

test('globrex: advance * matching', t => {
    let rgx;

    rgx = g(t, '*.min.js', '/^.*\\.min\\.js$/', { globstar:false });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'complex match');

    rgx = g(t, '*.min.*', '/^.*\\.min\\..*$/', { globstar:false });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'complex match');

    rgx = g(t, '*/js/*.js', '/^.*\\/js\\/.*\\.js$/', { globstar:false });
    t.true(rgx.test('http://example.com/js/jquery.min.js'), 'complex match');
    t.false(rgx.test('example.com/js/jquery.min.css'));
    t.false(rgx.test('example.com/css/jquery.min.js'));

    rgx = g(t, '*.min.*', '/.*\\.min\\..*/g', { flags:'g' });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'complex match global');
    t.false(rgx.test('example.com/jquery.js'));
    t.false(rgx.test('mint.com'));

    rgx = g(t, '*.min.js', '/.*\\.min\\.js/g', { flags:'g' });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'complex match global');

    rgx = g(t, '*/js/*.js', '/.*\\/js\\/.*\\.js/g', { flags:'g' });
    t.true(rgx.test('http://example.com/js/jquery.min.js'), 'complex match global');

    let testStr = '\\/$^+?.()=!|{},[].*';

    rgx = g(t, testStr, '/^\\/\\/\\$\\^\\+\\?\\.\\(\\)\\=\\!\\|\\{\\}\\,\\[\\]\\..*$/');
    console.log(rgx);
    t.true(rgx.test(testStr), 'battle test complex string - strict');

    rgx = g(t, testStr, '/\\/\\/\\$\\^\\+\\?\\.\\(\\)\\=\\!\\|\\{\\}\\,\\[\\]\\..*/g', { flags:'g' });
    console.log(rgx);
    t.true(rgx.test(testStr), 'battle test complex string - global');

    rgx = g(t, '.min.', '/^\\.min\\.$/');
    t.false(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, '*.min.*', '/^.*\\.min\\..*$/');
    t.true(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, '.min.', '/\\.min\\./g', { flags:'g' });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, 'http:', '/^http:$/');
    t.false(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, 'http:*', '/^http:.*$/');
    t.true(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, 'http:', '/http:/g', { flags:'g' });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, 'min.js', '/^min\\.js$/');
    t.false(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, '*.min.js', '/^.*\\.min\\.js$/');
    t.true(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, 'min.js', '/min\\.js/g', { flags:'g' });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');

    rgx = g(t, 'min', '/min/g', { flags:'g' });
    t.true(rgx.test('http://example.com/jquery.min.js'), 'match anywhere (globally) using RegExp "g"');

    rgx = g(t, '/js/', '/\\/js\\//g', { flags:'g' });
    t.true(rgx.test( 'http://example.com/js/jquery.min.js'), 'match anywhere (globally) using RegExp "g"');

    rgx = g(t, '/js*jq*.js', '/^\\/js.*jq.*\\.js$/');
    t.false(rgx.test('http://example.com/js/jquery.min.js'));

    rgx = g(t, '/js*jq*.js', '/\\/js.*jq.*\\.js/g', { flags:'g' });
    t.true(rgx.test('http://example.com/js/jquery.min.js'));

    t.end();
});

test('globrex: ? match one character, no more and no less', t => {
    let rgx;

    rgx = g(t, 'f?o', '/^f.o$/', { extended:true });
    t.true(rgx.test('foo'));

    rgx = g(t, 'f?o', '/^f.o$/', { extended:true });
    t.false(rgx.test('fooo'));

    rgx = g(t, 'f?oo', '/^f.oo$/', { extended:true });
    t.false(rgx.test('foo'));

    [
        ['f?o', '/f.o/g', 'foo', true],
        ['f?o', '/f.o/g', 'fooo', true],
        ['f?o?', '/f.o./g', 'fooo', true],
        ['?fo', '/.fo/g', 'fooo', false],
        ['f?oo', '/f.oo/g', 'foo', false],
        ['foo?', '/foo./g', 'foo', false],
    ].forEach(arr => {
        rgx = g(t, arr[0], arr[1], { extended:true, globstar:true, flags:'g' });
        t.is(rgx.test(arr[2]), arr[3], `${arr[1]}.test(${arr[2]}) = ${arr[3]} (globstar:true)`);
        rgx = g(t, arr[0], arr[1], { extended:true, globstar:false, flags:'g' });
        t.is(rgx.test(arr[2]), arr[3], `${arr[1]}.test(${arr[2]}) = ${arr[3]} (globstar:false)`);
    });

    t.end();
});

test('globrex: [] match a character range', t => {
    let rgx, o={ extended:true };

    rgx = g(t, 'fo[oz]', '/^fo[oz]$/', o);
    t.true(rgx.test('foo'));

    rgx = g(t, 'fo[oz]', '/^fo[oz]$/', o);
    t.true(rgx.test('foz'));

    rgx = g(t, 'fo[oz]', '/^fo[oz]$/', o);
    t.false(rgx.test('fog'));

    rgx = g(t, 'fo[a-z]', '/^fo[a-z]$/', o);
    t.true(rgx.test('fob'));

    rgx = g(t, 'fo[a-d]', '/^fo[a-d]$/', o);
    t.false(rgx.test('fot'));

    rgx = g(t, 'fo[!tz]', '/^fo[^tz]$/', o);
    t.false(rgx.test('fot'));

    rgx = g(t, 'fo[!tz]', '/^fo[^tz]$/', o);
    t.true(rgx.test('fob'));

    [
        ['fo[oz]', '/fo[oz]/g', 'foo', true],
        ['fo[oz]', '/fo[oz]/g', 'foz', true],
        ['fo[oz]', '/fo[oz]/g', 'fog', false],
    ].forEach(arr => {
        rgx = g(t, arr[0], arr[1], { ...o, globstar:true, flags:'g' });
        t.is(rgx.test(arr[2]), arr[3], `${arr[1]}.test(${arr[2]}) = ${arr[3]} (globstar:true)`);
        rgx = g(t, arr[0], arr[1], { ...o, globstar:false, flags:'g' });
        t.is(rgx.test(arr[2]), arr[3], `${arr[1]}.test(${arr[2]}) = ${arr[3]} (globstar:false)`);
    });

    t.end();
})

test('globrex: [] extended character ranges', t => {
    let rgx, o={ extended:true };

    rgx = g(t, '[[:alnum:]]/bar.txt', '/^[(\\w|\\d)]\\/bar\\.txt$/', o);
    t.false(rgx.test('!/bar.txt'));
    t.true(rgx.test('a/bar.txt'));

    rgx = g(t, '@([[:alnum:]abc]|11)/bar.txt', '/^([(\\w|\\d)abc]|11){1}\\/bar\\.txt$/', o);
    t.true(rgx.test('11/bar.txt'));
    t.true(rgx.test('a/bar.txt'));
    t.true(rgx.test('b/bar.txt'));
    t.true(rgx.test('c/bar.txt'));
    t.false(rgx.test('abc/bar.txt'));
    t.true(rgx.test('3/bar.txt'));

    rgx = g(t, '[[:digit:]]/bar.txt', '/^[\\d]\\/bar\\.txt$/', o);
    t.false(rgx.test('a/bar.txt'));
    t.true(rgx.test('1/bar.txt'));

    rgx = g(t, '[[:digit:]b]/bar.txt', '/^[\\db]\\/bar\\.txt$/', o);
    t.true(rgx.test('b/bar.txt'));
    t.false(rgx.test('a/bar.txt'));

    rgx = g(t, '[![:digit:]b]/bar.txt', '/^[^\\db]\\/bar\\.txt$/', o);
    t.true(rgx.test('a/bar.txt'));

    t.end();
});

test('globrex: {} match a choice of different substrings', t => {
    let rgx, o={ extended:true };

    rgx = g(t, 'foo{bar,baaz}', '/^foo(bar|baaz)$/', o);
    t.true(rgx.test('foobaaz'));
    t.true(rgx.test('foobar'));
    t.false(rgx.test('foobuzz'));

    rgx = g(t, 'foo{bar,b*z}', '/^foo(bar|b.*z)$/', o);
    t.true(rgx.test('foobuzz'));

    o.flag = 'g';

    rgx = g(t, 'foo{bar,baaz}', '/^foo(bar|baaz)$/', o);
    t.true(rgx.test('foobaaz'));
    t.true(rgx.test('foobar'));
    t.false(rgx.test('foobuzz'));

    rgx = g(t, 'foo{bar,b*z}', '/^foo(bar|b.*z)$/', o);
    t.true(rgx.test('foobuzz'));

    o.globstar = true;

    rgx = g(t, 'foo{bar,baaz}', '/^foo(bar|baaz)$/', o);
    t.true(rgx.test('foobaaz'));
    t.true(rgx.test('foobar'));
    t.false(rgx.test('foobuzz'));

    rgx = g(t, 'foo{bar,b*z}', '/^foo(bar|b([^\\/]*)z)$/', o);
    t.true(rgx.test('foobuzz'));

    t.end();
});

test('globrex: complex extended matches', t => {
    let rgx, o={ extended:true };

    rgx = g(t, 'http://?o[oz].b*z.com/{*.js,*.html}', '/^http:\\/?\\/.o[oz]\\.b.*z\\.com\\/(.*\\.js|.*\\.html)$/', o);
    t.true(rgx.test('http://foo.baaz.com/jquery.min.js'));
    t.true(rgx.test('http://moz.buzz.com/index.html'));
    t.false(rgx.test('http://moz.buzz.com/index.htm'));
    t.false(rgx.test('http://moz.bar.com/index.html'));
    t.false(rgx.test('http://flozz.buzz.com/index.html'));

    o.flags = 'g';
    o.globstar = true;

    rgx = g(t, 'http://?o[oz].b*z.com/{*.js,*.html}', '/http:\\/?\\/.o[oz]\\.b([^\\/]*)z\\.com\\/(([^\\/]*)\\.js|([^\\/]*)\\.html)/g', o);
    t.true(rgx.test('http://foo.baaz.com/jquery.min.js'));
    t.true(rgx.test('http://moz.buzz.com/index.html'));
    t.false(rgx.test('http://moz.buzz.com/index.htm'));
    t.false(rgx.test('http://moz.bar.com/index.html'));
    t.false(rgx.test('http://flozz.buzz.com/index.html'));

    o.globstar = false;

    rgx = g(t, 'http://?o[oz].b*z.com/{*.js,*.html}', '/http:\\/?\\/.o[oz]\\.b.*z\\.com\\/(.*\\.js|.*\\.html)/g', o);
    t.true(rgx.test('http://foo.baaz.com/jquery.min.js'));
    t.true(rgx.test('http://moz.buzz.com/index.html'));
    t.false(rgx.test('http://moz.buzz.com/index.htm'));
    t.false(rgx.test('http://moz.bar.com/index.html'));
    t.false(rgx.test('http://flozz.buzz.com/index.html'));

    t.end();
});

test('globrex: standard globstar', t => {
    let rgx, o={ extended:true, flags:'g' };

    rgx = g(t, 'http://foo.com/**/{*.js,*.html}', '/http:\\/?\\/foo\\.com\\/.*\\/(.*\\.js|.*\\.html)/g', o);
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));
    t.true(rgx.test('http://foo.com/bar/jquery.min.js'));

    rgx = g(t, 'http://foo.com/**', '/http:\\/?\\/foo\\.com\\/.*/g', o);
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    o.globstar = true;

    rgx = g(t, 'http://foo.com/**/{*.js,*.html}', '/http:\\/?\\/foo\\.com\\/((?:[^\\/]*(?:\\/|$))*)(([^\\/]*)\\.js|([^\\/]*)\\.html)/g', o);
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));
    t.true(rgx.test('http://foo.com/bar/jquery.min.js'));

    rgx = g(t, 'http://foo.com/**', '/http:\\/?\\/foo\\.com\\/((?:[^\\/]*(?:\\/|$))*)/g', o);
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    t.end();
});

test('globrex: remaining chars should match themself', t => {
    let rgx, o={ extended:true };
    let testExtStr = '\\/$^+.()=!|,.*';

    rgx = g(t, testExtStr, '/^\\/\\/\\$\\^\\+\\.\\(\\)\\=\\!\\|\\,\\..*$/', o);
    t.true(rgx.test(testExtStr));

    o.flags = 'g';
    o.globstar = true;
    rgx = g(t, testExtStr, '/\\/\\/\\$\\^\\+\\.\\(\\)\\=\\!\\|\\,\\.([^\\/]*)/g', o);
    t.true(rgx.test(testExtStr));

    t.end();
});

test('globrex: globstar advance testing', t => {
   let rgx, o={ globstar:true };

    rgx = g(t, '/foo/**', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)$/', o);
    t.true(rgx.test('/foo/bar.txt'));
    t.true(rgx.test('/foo/bar/baz.txt'));
    t.true(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '/foo/*', '/^\\/foo\\/([^\\/]*)$/', o);
    t.true(rgx.test('/foo/bar.txt'));
    t.false(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '/foo/*/*.txt', '/^\\/foo\\/([^\\/]*)\\/([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('/foo/bar/baz.txt'));
    t.false(rgx.test('/foo/bar/baz/qux.txt'));

    rgx = g(t, '/foo/**/*.txt', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('/foo/bar/baz.txt'));
    t.true(rgx.test('/foo/bar/baz/qux.txt'));
    t.true(rgx.test('/foo/bar.txt'));

    rgx = g(t, '/foo/**/bar.txt', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)bar\\.txt$/', o);
    t.true(rgx.test('/foo/bar.txt'));

    rgx = g(t, '/foo/**/**/bar.txt', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)((?:[^\\/]*(?:\\/|$))*)bar\\.txt$/', o);
    t.true(rgx.test('/foo/bar.txt'));

    rgx = g(t, '/foo/**/*/baz.txt', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\/baz\\.txt$/', o);
    t.true(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '/foo/**/**/*.txt', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('/foo/bar.txt'));

    rgx = g(t, '/foo/**/*/*.txt', '/^\\/foo\\/((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\/([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '**/*.txt', '/^((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('/foo/bar/baz/qux.txt'));
    t.true(rgx.test('foo.txt'));

    rgx = g(t, '**/foo.txt', '/^((?:[^\\/]*(?:\\/|$))*)foo\\.txt$/', o);
    t.true(rgx.test('foo.txt'));

    rgx = g(t, '/foo/*.txt', '/^\\/foo\\/([^\\/]*)\\.txt$/', o);
    t.false(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '/foo/*/bar.txt', '/^\\/foo\\/([^\\/]*)\\/bar\\.txt$/', o);
    t.false(rgx.test('/foo/bar.txt'));

    rgx = g(t, '/foo/*/*/baz.txt', '/^\\/foo\\/([^\\/]*)\\/([^\\/]*)\\/baz\\.txt$/', o);
    t.false(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '/foo/**.txt', '/^\\/foo\\/([^\\/]*)\\.txt$/', o);
    t.false(rgx.test('/foo/bar/baz/qux.txt'));

    rgx = g(t, '/foo/bar**/*.txt', '/^\\/foo\\/bar([^\\/]*)\\/([^\\/]*)\\.txt$/', o);
    t.false(rgx.test('/foo/bar/baz/qux.txt'));

    rgx = g(t, '/foo/bar**', '/^\\/foo\\/bar([^\\/]*)$/', o);
    t.false(rgx.test('/foo/bar/baz.txt'));

    rgx = g(t, '**/.txt', '/^((?:[^\\/]*(?:\\/|$))*)\\.txt$/', o);
    t.false(rgx.test('/foo/bar/baz/qux.txt'));

    rgx = g(t, '*/*.txt', '/^([^\\/]*)\\/([^\\/]*)\\.txt$/', o);
    t.false(rgx.test('/foo/bar/baz/qux.txt'));
    t.false(rgx.test('foo.txt'));

    rgx = g(t, 'http://foo.com/*', '/^http:\\/?\\/foo\\.com\\/([^\\/]*)$/', { ...o, extended:true });
    t.false(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    rgx = g(t, 'http://foo.com/*', '/^http:\\/?\\/foo\\.com\\/([^\\/]*)$/', o);
    t.false(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    rgx = g(t, 'http://foo.com/*', '/^http:\\/?\\/foo\\.com\\/.*$/', { globstar:false });
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    rgx = g(t, 'http://foo.com/**', '/^http:\\/?\\/foo\\.com\\/((?:[^\\/]*(?:\\/|$))*)$/', o);
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    rgx = g(t, 'http://foo.com/*/*/jquery.min.js', '/^http:\\/?\\/foo\\.com\\/([^\\/]*)\\/([^\\/]*)\\/jquery\\.min\\.js$/', o);
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    rgx = g(t, 'http://foo.com/*/*/jquery.min.js', '/^http:\\/?\\/foo\\.com\\/.*\\/.*\\/jquery\\.min\\.js$/', { globstar:false });
    t.true(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    rgx = g(t, 'http://foo.com/*/jquery.min.js', '/^http:\\/?\\/foo\\.com\\/([^\\/]*)\\/jquery\\.min\\.js$/', o);
    t.false(rgx.test('http://foo.com/bar/baz/jquery.min.js'));

    t.end();
});

// Matches zero or ONE occurrence of the given patterns.
test('globrex: extended extglob ?', t => {
    let rgx, o={ extended:true };

    // if no sign, match litteral
    rgx = g(t, '(foo).txt', '/^\\(foo\\)\\.txt$/', o);
    t.true(rgx.test('(foo).txt'));

    rgx = g(t, '?(foo).txt', '/^\\?\\(foo\\)\\.txt$/', { extended:false });
    t.false(rgx.test('foo.txt'));

    rgx = g(t, '?(foo).txt', '/^(foo)?\\.txt$/', o);
    t.true(rgx.test('foo.txt'));
    t.true(rgx.test('.txt'));

    rgx = g(t, '?(foo|bar)baz.txt', '/^(foo|bar)?baz\\.txt$/', o);
    t.false(rgx.test('foobarbaz.txt'));
    t.true(rgx.test('foobaz.txt'));

    rgx = g(t, '?(ba[zr]|qux)baz.txt', '/^(ba[zr]|qux)?baz\\.txt$/', o);
    t.true(rgx.test('bazbaz.txt'));
    t.true(rgx.test('barbaz.txt'));
    t.true(rgx.test('quxbaz.txt'));
    t.false(rgx.test('bazquxbaz.txt'));

    rgx = g(t, '?(ba[!zr]|qux)baz.txt', '/^(ba[^zr]|qux)?baz\\.txt$/', o);
    t.true(rgx.test('batbaz.txt'));
    t.false(rgx.test('bazbaz.txt'));

    rgx = g(t, '?(ba*|qux)baz.txt', '/^(ba.*|qux)?baz\\.txt$/', o);
    t.true(rgx.test('batbaz.txt'));
    t.true(rgx.test('batttbaz.txt'));
    t.true(rgx.test('quxbaz.txt'));

    rgx = g(t, '?(ba?(z|r)|qux)baz.txt', '/^(ba(z|r)?|qux)?baz\\.txt$/', o);
    t.true(rgx.test('bazbaz.txt'));

    rgx = g(t, '?(ba?(z|?(r))|qux)baz.txt', '/^(ba(z|(r)?)?|qux)?baz\\.txt$/', o);
    t.true(rgx.test('bazbaz.txt'));

    t.end();
});

// Matches zero or MORE occurrences of the given patterns.
test('globrex: extended extglob *', t => {
    let rgx, o={ extended:true };

    rgx = g(t, '*(foo).txt', '/^(foo)*\\.txt$/', o);
    t.true(rgx.test('foo.txt'));

    rgx = g(t, '*foo.txt', '/^.*foo\\.txt$/', o);
    t.true(rgx.test('bofoo.txt'));

    rgx = g(t, '*(foo).txt', '/^(foo)*\\.txt$/', o);
    t.true(rgx.test('foofoo.txt'));
    t.true(rgx.test('.txt'));

    rgx = g(t, '*(fooo).txt', '/^(fooo)*\\.txt$/', o);
    t.false(rgx.test('foo.txt'));
    t.true(rgx.test('.txt'));

    rgx = g(t, '*(foo|bar).txt', '/^(foo|bar)*\\.txt$/', o);
    t.true(rgx.test('barfoobar.txt'));
    t.true(rgx.test('foobar.txt'));
    t.true(rgx.test('barbar.txt'));
    t.true(rgx.test('.txt'));

    rgx = g(t, '*(foo|ba[rt]).txt', '/^(foo|ba[rt])*\\.txt$/', o);
    t.true(rgx.test('bat.txt'));

    rgx = g(t, '*(foo|b*[rt]).txt', '/^(foo|b.*[rt])*\\.txt$/', o);
    t.false(rgx.test('tlat.txt'));
    t.true(rgx.test('blat.txt'));

    o.globstar = true;
    rgx = g(t, '*(*).txt', '/^(([^\\/]*))*\\.txt$/', o);
    t.true(rgx.test('whatever.txt'));

    rgx = g(t, '*(foo|bar)/**/*.txt', '/^(foo|bar)*\\/((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('foo/hello/world/bar.txt'));
    t.true(rgx.test('foo/world/bar.txt'));

    t.end();
});

// Matches one or more occurrences of the given patterns.
test('globrex: extended extglob +', t => {
    let rgx, o={ extended:true };

    rgx = g(t, '+(foo).txt', '/^(foo)+\\.txt$/', o);
    t.true(rgx.test('foo.txt'));

    rgx = g(t, '+foo.txt', '/^\\+foo\\.txt$/', o);
    t.true(rgx.test('+foo.txt'));

    rgx = g(t, '+(foo).txt', '/^(foo)+\\.txt$/', o);
    t.false(rgx.test('.txt'));

    rgx = g(t, '+(foo|bar).txt', '/^(foo|bar)+\\.txt$/', o);
    t.true(rgx.test('foobar.txt'));

    t.end();
});

// Matches one of the given patterns.
test('globrex: extended extglob @', t => {
    let rgx, o={ extended:true };

    rgx = g(t, '@(foo).txt', '/^(foo){1}\\.txt$/', o);
    t.true(rgx.test('foo.txt'));

    rgx = g(t, '@foo.txt', '/^\\@foo\\.txt$/', o);
    t.true(rgx.test('@foo.txt'));

    rgx = g(t, '@(foo|baz)bar.txt', '/^(foo|baz){1}bar\\.txt$/', o);
    t.false(rgx.test('foobazbar.txt'));
    t.false(rgx.test('foofoobar.txt'));
    t.false(rgx.test('toofoobar.txt'));
    t.true(rgx.test('foobar.txt'));

    t.end();
});

// Matches anything except one of the given patterns.
test('globrex: extended extglob !', t => {
    let rgx, o={ extended:true };

    rgx = g(t, '!(boo).txt', '/^(?!boo)([^\\/]*)\\.txt$/', o);
    t.true(rgx.test('foo.txt'));

    rgx = g(t, '!(foo|baz)bar.txt', '/^(?!foo|baz)([^\\/]*)bar\\.txt$/', o);
    t.true(rgx.test('buzbar.txt'));

    rgx = g(t, '!bar.txt', '/^\\!bar\\.txt$/', o);
    t.true(rgx.test('!bar.txt'));

    rgx = g(t, '!({foo,bar})baz.txt', '/^(?!(foo|bar))([^\\/]*)baz\\.txt$/', o);
    t.false(rgx.test('foobaz.txt'));
    t.true(rgx.test('notbaz.txt'));

    t.end();
});

test('globrex: strict', t => {
    let rgx;

    rgx = g(t, 'foo//bar.txt', '/^foo\\/?\\/bar\\.txt$/');
    t.true(rgx.test('foo/bar.txt'));

    rgx = g(t, 'foo///bar.txt', '/^foo\\/?\\/?\\/bar\\.txt$/');
    t.true(rgx.test('foo/bar.txt'));

    rgx = g(t, 'foo///bar.txt', '/^foo\\/\\/\\/bar\\.txt$/', { strict:true });
    t.false(rgx.test('foo/bar.txt'));

    t.end();
});

test('globrex: path segments option', t => {
    let rgx, o={ extended:true, windows:false };

    rgx = globrex('foo/bar/*/baz.{md,js,txt}', { ...o, globstar:true });
    t.equal(rgx.segments.join('  '), `/^foo$/  /^bar$/  /^([^\\/]*)$/  /^baz\\.(md|js|txt)$/`);
    t.equal(rgx.regex.toString(), `/^foo\\/bar\\/([^\\/]*)\\/baz\\.(md|js|txt)$/`);

    rgx = globrex('foo/*/baz.md', o);
    t.equal(rgx.segments.join('  '), `/^foo$/  /^.*$/  /^baz\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/.*\\/baz\\.md$/`);

    rgx = globrex('foo/**/baz.md', o);
    t.equal(rgx.segments.join('  '), `/^foo$/  /^.*$/  /^baz\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/.*\\/baz\\.md$/`);

    rgx = globrex('foo/**/baz.md', { ...o, globstar:true });
    t.equal(rgx.segments.join('  '), `/^foo$/  /^((?:[^\\/]*(?:\\/|$))*)$/  /^baz\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/((?:[^\\/]*(?:\\/|$))*)baz\\.md$/`);

    rgx = globrex('foo/**/*.md', o);
    t.equal(rgx.segments.join('  '), `/^foo$/  /^.*$/  /^.*\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/.*\\/.*\\.md$/`);

    rgx = globrex('foo/**/*.md', { ...o, globstar:true });
    t.equal(rgx.segments.join('  '), `/^foo$/  /^((?:[^\\/]*(?:\\/|$))*)$/  /^([^\\/]*)\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/((?:[^\\/]*(?:\\/|$))*)([^\\/]*)\\.md$/`);

    rgx = globrex('foo/:/b:az',  o);
    t.equal(rgx.segments.join('  '), `/^foo$/  /^:$/  /^b:az$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/:\\/b:az$/`);

    rgx = globrex('foo///baz.md', { ...o, strict:true });
    t.equal(rgx.segments.join('  '), `/^foo$/  /^baz\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/\\/\\/baz\\.md$/`);

    rgx = globrex('foo///baz.md', { ...o, strict:false });
    t.equal(rgx.segments.join('  '), `/^foo$/  /^baz\\.md$/`);
    t.equal(`${rgx.regex}`, `/^foo\\/?\\/?\\/baz\\.md$/`);

    t.end();
});


test('globrex: path segments option windows', t => {
    t.plan(17);

    const res1 = globrex(`C:\\Users\\foo\\bar\\baz`, { windows:true });
    t.equal(res1.segments.join('  '), `/^C:$/  /^Users$/  /^foo$/  /^bar$/  /^baz$/`);
    t.equal(`${res1.regex}`, `/^C:\\\\+Users\\\\+foo\\\\+bar\\\\+baz$/`);
    t.true(res1.regex.test(`C:\\\\Users\\\\foo\\\\bar\\\\baz`));
    t.true(res1.regex.test(`C:\\Users\\foo\\bar\\baz`));

    const res2 = globrex(`Users\\foo\\bar\\baz`, { windows:true });
    t.equal(res2.segments.join('  '), `/^Users$/  /^foo$/  /^bar$/  /^baz$/`);
    t.equal(`${res2.regex}`, `/^Users\\\\+foo\\\\+bar\\\\+baz$/`);

    const res3 = globrex(`Users\\foo\\bar.{md,js}`, { windows:true, extended:true });
    t.equal(res3.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res3.regex}`, `/^Users\\\\+foo\\\\+bar\\.(md|js)$/`);
    t.true(res3.regex.test(`Users\\\\foo\\\\bar.js`));
    t.false(res3.regex.test(`Users\\foo\\bar.mp3`));
    t.true(res3.regex.test(`Users\\foo\\bar.js`));

    const res4 = globrex(`Users\\\\foo\\bar.{md,js}`, { windows:true, extended:true, strict:false });
    t.equal(res4.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res4.regex}`, `/^Users\\\\+?foo\\\\+bar\\.(md|js)$/`);

    const res5 = globrex(`Users\\\\foo\\bar.{md,js}`, { windows:true, extended:true, strict:true });
    t.equal(res5.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res5.regex}`, `/^Users\\\\+foo\\\\+bar\\.(md|js)$/`);

    const res6 = globrex(`Users\\\\foo\\bar.{md,js}`, { windows:true, extended:true });
    t.equal(res6.segments.join('  '), `/^Users$/  /^foo$/  /^bar\\.(md|js)$/`);
    t.equal(`${res6.regex}`, `/^Users\\\\+?foo\\\\+bar\\.(md|js)$/`);
});

test('globrex: stress testing', t => {
    let rgx, o={ extended:true };

    rgx = g(t, '**/*/?yfile.{md,js,txt}', '/^.*\\/.*\\/.yfile\\.(md|js|txt)$/', o);
    t.true(rgx.test('foo/bar/baz/myfile.md'));
    t.true(rgx.test('foo/baz/myfile.md'));
    t.true(rgx.test('foo/baz/tyfile.js'));

    rgx = g(t, '[[:digit:]_.]/file.js', '/^[\\d_\\.]\\/file\\.js$/', o);
    t.true(rgx.test('1/file.js'));
    t.true(rgx.test('2/file.js'));
    t.true(rgx.test('_/file.js'));
    t.true(rgx.test('./file.js'));
    t.false(rgx.test('z/file.js'));

    t.end();
});
