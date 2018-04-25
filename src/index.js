const isWin = process.platform === 'win32';

/**
 * Convert any glob pattern to a JavaScript Regexp object
 * @param {String} glob Glob pattern to convert
 * @param {Object} opts Configuration object
 * @param {Boolean} [opts.extended=false] Support advanced ext globbing
 * @param {Boolean} [opts.globstar=false] Support globstar
 * @param {Boolean} [opts.strict=true] be laissez faire about mutiple slashes
 * @param {String} [opts.flags=''] RegExp globs
 * @param {String} [opts.windows] Set to true to split path as a windows path. Defaults to OS.
 * @returns {Object} converted object with string, segments and RegExp object
 */
function globrex(glob, { extended = false, globstar = false, strict = false, flags = '', windows = isWin} = {}) {
    let reStr = '';

    // The individual path segments - array of regexp for each segment in a path
    let segment = '';
    let segments = [];

    // Helper function to build string and segments
    const add = (str, split, addLastPart) => {
        reStr += str;
        if (split) {
            if (addLastPart) segment += str;
            if (segment !== '') {
                if (!flags || !~flags.indexOf('g')) segment = `^${segment}$`;
                segments.push(new RegExp(segment, flags));
            }
            segment = '';
        } else {
            segment += str;
        }
    }

    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    let inGroup = false;
    let inRange = false;

    // extglob sign "call stack". Keep track of "scope"
    const ext = [];

    let c  // current char
    let n; // next char
    for (var i = 0, len = glob.length; i < len; i++) {
        c = glob[i];
        n = glob[i + 1] || null;
        switch (c) {
            case '$':
            case '^':
            case '.':
            case '=':
                add('\\' + c)
                break;
            case '\\':
                add('\\\\\+', windows);
                if (n === '\\') {
                    ++i; // skip next
                    if (!strict) reStr += '?';
                }
                break;
            case '/':
                add('\\' + c, !windows);
                if (n === '/' && !strict) reStr += '?';
                break;
            case '(':
                if (ext.length) {
                    add(c);
                    break;
                }
                add('\\' + c);
                break;
            case ')':
                if (ext.length) {
                    add(c);
                    let type = ext.pop();
                    if (type === '@') {
                        add('{1}');
                    } else if (type === '!') {
                        add('([^\/]*)');
                    } else {
                        add(type);
                    }
                    break;
                }
                add('\\' + c);
                break;
            case '|':
                if (ext.length) {
                    add(c);
                } else {
                    add('\\' + c);
                }
                break;
            case '+':
                if (n === '(' && extended) {
                    ext.push(c);
                } else {
                    add('\\' + c);
                }
                break;
            case '@':
                if (n === '(' && extended) {
                    ext.push(c);
                    break;
                }
            case '!':
                if (extended) {
                    if (inRange) {
                        add('^');
                        break
                    }
                    if (n === '(') {
                        ext.push(c);
                        add('(?!');
                        i++;
                        break;
                    }
                    add('\\' + c);
                    break;
                }
            case '?':
                if (extended) {
                    if (n === '(') {
                        ext.push(c);
                    } else {
                        add('.');
                    }
                    break;
                }
            case '[':
                if (inRange && n === ':') {
                    i++; // skip [
                    let value = '';
                    while(glob[++i] !== ':') value += glob[i];
                    if (value === 'alnum') add('(\\w|\\d)');
                    else if (value === 'space') add('\\s');
                    else if (value === 'digit') add('\\d');
                    i++; // skip last ]
                    break;
                }
                if (extended) {
                    inRange = true;
                    add(c);
                    break;
                }
            case ']':
                if (extended) {
                    inRange = false;
                    add(c);
                    break;
                }
            case '{':
                if (extended) {
                    inGroup = true;
                    add('(');
                    break;
                }
            case '}':
                if (extended) {
                    inGroup = false;
                    add(')');
                    break;
                }
            case ',':
                if (inGroup) {
                    add('|');
                    break;
                }
                add('\\' + c);
                break;
            case '*':
                if (n === '(' && extended) {
                    ext.push(c);
                    break;
                }
                // Move over all consecutive "*"'s.
                // Also store the previous and next characters
                let prevChar = glob[i - 1];
                let starCount = 1;
                while (glob[i + 1] === '*') {
                    starCount++;
                    i++;
                }
                let nextChar = glob[i + 1];
                if (!globstar) {
                    // globstar is disabled, so treat any number of "*" as one
                    add('.*');
                } else {
                    // globstar is enabled, so determine if this is a globstar segment
                    let isGlobstar =
                        starCount > 1 && // multiple "*"'s
                        (prevChar === '/' || prevChar === undefined) && // from the start of the segment
                        (nextChar === '/' || nextChar === undefined); // to the end of the segment
                    if (isGlobstar) {
                        // it's a globstar, so match zero or more path segments
                        add('((?:[^/]*(?:/|$))*)', true, true)
                        i++; // move over the "/"
                    } else {
                        // it's not a globstar, so only match one path segment
                        add('([^/]*)');
                    }
                }
                break;
            default:
                add(c);
        }
    }

    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags || !~flags.indexOf('g')) {
        reStr = `^${reStr}$`;
        segment = `^${segment}$`;
    }

    // Push the last segment
    segments.push(new RegExp(segment, flags));

    return { regex: new RegExp(reStr, flags), string: reStr, segments };
}

module.exports = globrex;
