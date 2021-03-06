/**
 *
 * Original code
 * https://github.com/Jxck/html2json
 */
var HTMLParser = require('./htmlparser');

function q(v) {
  return '"' + v + '"';
}

function removeDOCTYPE(html) {
  return html
    .replace(/<\?xml.*\?>\n/, '')
    .replace(/<!doctype.*\>\n/, '')
    .replace(/<!DOCTYPE.*\>\n/, '');
}

function html2json(html) {
  html = removeDOCTYPE(html);
  var bufArray = [];
  var results = {
    node: 'root',
    child: []
  };
  HTMLParser(html, {
    start: function (tag, attrs, unary) {
      // node for this element
      var node = {
        node: 'element',
        tag: tag
      };
      if (attrs.length !== 0) {
        node.attrs = attrs.reduce(function (pre, attr) {
          var name = attr.name;
          var value = attr.value;

          // has multi attibutes
          // make it array of attribute
          if (value.match(/ /)) {
            value = value.split(' ');
          }

          // if attr already exists
          // merge it
          if (pre[name]) {
            if (Array.isArray(pre[name])) {
              // already array, push to last
              pre[name].push(value);
            } else {
              // single value, make it array
              pre[name] = [pre[name], value];
            }
          } else {
            // not exist, put it
            pre[name] = value;
          }

          return pre;
        }, {});
      }
      if (unary) {
        // if this tag dosen't have end tag
        // like <img src="hoge.png"/>
        // add to parents
        var parent = bufArray[0] || results;
        if (parent.child === undefined) {
          parent.child = [];
        }
        parent.child.push(node);
      } else {
        bufArray.unshift(node);
      }
    },
    end: function (tag) {
      // merge into parent tag
      var node = bufArray.shift();
      if (node.tag !== tag) console.error('invalid state: mismatch end tag');

      if (bufArray.length === 0) {
        results.child.push(node);
      } else {
        var parent = bufArray[0];
        if (parent.child === undefined) {
          parent.child = [];
        }
        parent.child.push(node);
      }
    },
    chars: function (text) {
      var node = {
        node: 'text',
        text: text
      };
      if (bufArray.length === 0) {
        results.child.push(node);
      } else {
        var parent = bufArray[0];
        if (parent.child === undefined) {
          parent.child = [];
        }
        parent.child.push(node);
      }
    },
    comment: function (text) {
      var node = {
        node: 'comment',
        text: text
      };
      var parent = bufArray[0];
      if (parent.child === undefined) {
        parent.child = [];
      }
      parent.child.push(node);
    }
  });
  return results;
}

module.exports = html2json;
