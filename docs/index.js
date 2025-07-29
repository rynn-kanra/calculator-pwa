// node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r2;
var o;
var e;
var f;
var c;
var s;
var a;
var h;
var p = {};
var v = [];
var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var w = Array.isArray;
function d(n2, l2) {
  for (var u2 in l2)
    n2[u2] = l2[u2];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _(l2, u2, t2) {
  var i2, r3, o2, e2 = {};
  for (o2 in u2)
    o2 == "key" ? i2 = u2[o2] : o2 == "ref" ? r3 = u2[o2] : e2[o2] = u2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), typeof l2 == "function" && l2.defaultProps != null)
    for (o2 in l2.defaultProps)
      e2[o2] === undefined && (e2[o2] = l2.defaultProps[o2]);
  return m(l2, e2, i2, r3, null);
}
function m(n2, t2, i2, r3, o2) {
  var e2 = { type: n2, props: t2, key: i2, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: o2 == null ? ++u : o2, __i: -1, __u: 0 };
  return o2 == null && l.vnode != null && l.vnode(e2), e2;
}
function k(n2) {
  return n2.children;
}
function x(n2, l2) {
  this.props = n2, this.context = l2;
}
function S(n2, l2) {
  if (l2 == null)
    return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var u2;l2 < n2.__k.length; l2++)
    if ((u2 = n2.__k[l2]) != null && u2.__e != null)
      return u2.__e;
  return typeof n2.type == "function" ? S(n2) : null;
}
function C(n2) {
  var l2, u2;
  if ((n2 = n2.__) != null && n2.__c != null) {
    for (n2.__e = n2.__c.base = null, l2 = 0;l2 < n2.__k.length; l2++)
      if ((u2 = n2.__k[l2]) != null && u2.__e != null) {
        n2.__e = n2.__c.base = u2.__e;
        break;
      }
    return C(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || r2 != l.debounceRendering) && ((r2 = l.debounceRendering) || o)($);
}
function $() {
  for (var n2, u2, t2, r3, o2, f2, c2, s2 = 1;i.length; )
    i.length > s2 && i.sort(e), n2 = i.shift(), s2 = i.length, n2.__d && (t2 = undefined, o2 = (r3 = (u2 = n2).__v).__e, f2 = [], c2 = [], u2.__P && ((t2 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(t2), O(u2.__P, t2, r3, u2.__n, u2.__P.namespaceURI, 32 & r3.__u ? [o2] : null, f2, o2 == null ? S(r3) : o2, !!(32 & r3.__u), c2), t2.__v = r3.__v, t2.__.__k[t2.__i] = t2, N(f2, t2, c2), t2.__e != o2 && C(t2)));
  $.__r = 0;
}
function I(n2, l2, u2, t2, i2, r3, o2, e2, f2, c2, s2) {
  var a2, h2, y2, w2, d2, g2, _2 = t2 && t2.__k || v, m2 = l2.length;
  for (f2 = P(u2, l2, _2, f2, m2), a2 = 0;a2 < m2; a2++)
    (y2 = u2.__k[a2]) != null && (h2 = y2.__i == -1 ? p : _2[y2.__i] || p, y2.__i = a2, g2 = O(n2, y2, h2, i2, r3, o2, e2, f2, c2, s2), w2 = y2.__e, y2.ref && h2.ref != y2.ref && (h2.ref && B(h2.ref, null, y2), s2.push(y2.ref, y2.__c || w2, y2)), d2 == null && w2 != null && (d2 = w2), 4 & y2.__u || h2.__k === y2.__k ? f2 = A(y2, f2, n2) : typeof y2.type == "function" && g2 !== undefined ? f2 = g2 : w2 && (f2 = w2.nextSibling), y2.__u &= -7);
  return u2.__e = d2, f2;
}
function P(n2, l2, u2, t2, i2) {
  var r3, o2, e2, f2, c2, s2 = u2.length, a2 = s2, h2 = 0;
  for (n2.__k = new Array(i2), r3 = 0;r3 < i2; r3++)
    (o2 = l2[r3]) != null && typeof o2 != "boolean" && typeof o2 != "function" ? (f2 = r3 + h2, (o2 = n2.__k[r3] = typeof o2 == "string" || typeof o2 == "number" || typeof o2 == "bigint" || o2.constructor == String ? m(null, o2, null, null, null) : w(o2) ? m(k, { children: o2 }, null, null, null) : o2.constructor == null && o2.__b > 0 ? m(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : o2).__ = n2, o2.__b = n2.__b + 1, e2 = null, (c2 = o2.__i = L(o2, u2, f2, a2)) != -1 && (a2--, (e2 = u2[c2]) && (e2.__u |= 2)), e2 == null || e2.__v == null ? (c2 == -1 && (i2 > s2 ? h2-- : i2 < s2 && h2++), typeof o2.type != "function" && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r3] = null;
  if (a2)
    for (r3 = 0;r3 < s2; r3++)
      (e2 = u2[r3]) != null && (2 & e2.__u) == 0 && (e2.__e == t2 && (t2 = S(e2)), D(e2, e2));
  return t2;
}
function A(n2, l2, u2) {
  var t2, i2;
  if (typeof n2.type == "function") {
    for (t2 = n2.__k, i2 = 0;t2 && i2 < t2.length; i2++)
      t2[i2] && (t2[i2].__ = n2, l2 = A(t2[i2], l2, u2));
    return l2;
  }
  n2.__e != l2 && (l2 && n2.type && !u2.contains(l2) && (l2 = S(n2)), u2.insertBefore(n2.__e, l2 || null), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (l2 != null && l2.nodeType == 8);
  return l2;
}
function L(n2, l2, u2, t2) {
  var i2, r3, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], s2 = c2 != null && (2 & c2.__u) == 0;
  if (c2 === null && n2.key == null || s2 && e2 == c2.key && f2 == c2.type)
    return u2;
  if (t2 > (s2 ? 1 : 0)) {
    for (i2 = u2 - 1, r3 = u2 + 1;i2 >= 0 || r3 < l2.length; )
      if ((c2 = l2[o2 = i2 >= 0 ? i2-- : r3++]) != null && (2 & c2.__u) == 0 && e2 == c2.key && f2 == c2.type)
        return o2;
  }
  return -1;
}
function T(n2, l2, u2) {
  l2[0] == "-" ? n2.setProperty(l2, u2 == null ? "" : u2) : n2[l2] = u2 == null ? "" : typeof u2 != "number" || y.test(l2) ? u2 : u2 + "px";
}
function j(n2, l2, u2, t2, i2) {
  var r3, o2;
  n:
    if (l2 == "style")
      if (typeof u2 == "string")
        n2.style.cssText = u2;
      else {
        if (typeof t2 == "string" && (n2.style.cssText = t2 = ""), t2)
          for (l2 in t2)
            u2 && l2 in u2 || T(n2.style, l2, "");
        if (u2)
          for (l2 in u2)
            t2 && u2[l2] == t2[l2] || T(n2.style, l2, u2[l2]);
      }
    else if (l2[0] == "o" && l2[1] == "n")
      r3 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || l2 == "onFocusOut" || l2 == "onFocusIn" ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r3] = u2, u2 ? t2 ? u2.u = t2.u : (u2.u = c, n2.addEventListener(l2, r3 ? a : s, r3)) : n2.removeEventListener(l2, r3 ? a : s, r3);
    else {
      if (i2 == "http://www.w3.org/2000/svg")
        l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if (l2 != "width" && l2 != "height" && l2 != "href" && l2 != "list" && l2 != "form" && l2 != "tabIndex" && l2 != "download" && l2 != "rowSpan" && l2 != "colSpan" && l2 != "role" && l2 != "popover" && l2 in n2)
        try {
          n2[l2] = u2 == null ? "" : u2;
          break n;
        } catch (n3) {}
      typeof u2 == "function" || (u2 == null || u2 === false && l2[4] != "-" ? n2.removeAttribute(l2) : n2.setAttribute(l2, l2 == "popover" && u2 == 1 ? "" : u2));
    }
}
function F(n2) {
  return function(u2) {
    if (this.l) {
      var t2 = this.l[u2.type + n2];
      if (u2.t == null)
        u2.t = c++;
      else if (u2.t < t2.u)
        return;
      return t2(l.event ? l.event(u2) : u2);
    }
  };
}
function O(n2, u2, t2, i2, r3, o2, e2, f2, c2, s2) {
  var a2, h2, p2, v2, y2, _2, m2, b, S2, C2, M2, $2, P2, A2, H, L2, T2, j2 = u2.type;
  if (u2.constructor != null)
    return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (a2 = l.__b) && a2(u2);
  n:
    if (typeof j2 == "function")
      try {
        if (b = u2.props, S2 = "prototype" in j2 && j2.prototype.render, C2 = (a2 = j2.contextType) && i2[a2.__c], M2 = a2 ? C2 ? C2.props.value : a2.__ : i2, t2.__c ? m2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (S2 ? u2.__c = h2 = new j2(b, M2) : (u2.__c = h2 = new x(b, M2), h2.constructor = j2, h2.render = E), C2 && C2.sub(h2), h2.props = b, h2.state || (h2.state = {}), h2.context = M2, h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && h2.__s == null && (h2.__s = h2.state), S2 && j2.getDerivedStateFromProps != null && (h2.__s == h2.state && (h2.__s = d({}, h2.__s)), d(h2.__s, j2.getDerivedStateFromProps(b, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2)
          S2 && j2.getDerivedStateFromProps == null && h2.componentWillMount != null && h2.componentWillMount(), S2 && h2.componentDidMount != null && h2.__h.push(h2.componentDidMount);
        else {
          if (S2 && j2.getDerivedStateFromProps == null && b !== v2 && h2.componentWillReceiveProps != null && h2.componentWillReceiveProps(b, M2), !h2.__e && h2.shouldComponentUpdate != null && h2.shouldComponentUpdate(b, h2.__s, M2) === false || u2.__v == t2.__v) {
            for (u2.__v != t2.__v && (h2.props = b, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
              n3 && (n3.__ = u2);
            }), $2 = 0;$2 < h2._sb.length; $2++)
              h2.__h.push(h2._sb[$2]);
            h2._sb = [], h2.__h.length && e2.push(h2);
            break n;
          }
          h2.componentWillUpdate != null && h2.componentWillUpdate(b, h2.__s, M2), S2 && h2.componentDidUpdate != null && h2.__h.push(function() {
            h2.componentDidUpdate(v2, y2, _2);
          });
        }
        if (h2.context = M2, h2.props = b, h2.__P = n2, h2.__e = false, P2 = l.__r, A2 = 0, S2) {
          for (h2.state = h2.__s, h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), H = 0;H < h2._sb.length; H++)
            h2.__h.push(h2._sb[H]);
          h2._sb = [];
        } else
          do {
            h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
          } while (h2.__d && ++A2 < 25);
        h2.state = h2.__s, h2.getChildContext != null && (i2 = d(d({}, i2), h2.getChildContext())), S2 && !p2 && h2.getSnapshotBeforeUpdate != null && (_2 = h2.getSnapshotBeforeUpdate(v2, y2)), L2 = a2, a2 != null && a2.type === k && a2.key == null && (L2 = V(a2.props.children)), f2 = I(n2, w(L2) ? L2 : [L2], u2, t2, i2, r3, o2, e2, f2, c2, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), m2 && (h2.__E = h2.__ = null);
      } catch (n3) {
        if (u2.__v = null, c2 || o2 != null)
          if (n3.then) {
            for (u2.__u |= c2 ? 160 : 128;f2 && f2.nodeType == 8 && f2.nextSibling; )
              f2 = f2.nextSibling;
            o2[o2.indexOf(f2)] = null, u2.__e = f2;
          } else {
            for (T2 = o2.length;T2--; )
              g(o2[T2]);
            z(u2);
          }
        else
          u2.__e = t2.__e, u2.__k = t2.__k, n3.then || z(u2);
        l.__e(n3, u2, t2);
      }
    else
      o2 == null && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = q(t2.__e, u2, t2, i2, r3, o2, e2, c2, s2);
  return (a2 = l.diffed) && a2(u2), 128 & u2.__u ? undefined : f2;
}
function z(n2) {
  n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
}
function N(n2, u2, t2) {
  for (var i2 = 0;i2 < t2.length; i2++)
    B(t2[i2], t2[++i2], t2[++i2]);
  l.__c && l.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l.__e(n3, u3.__v);
    }
  });
}
function V(n2) {
  return typeof n2 != "object" || n2 == null || n2.__b && n2.__b > 0 ? n2 : w(n2) ? n2.map(V) : d({}, n2);
}
function q(u2, t2, i2, r3, o2, e2, f2, c2, s2) {
  var a2, h2, v2, y2, d2, _2, m2, b = i2.props, k2 = t2.props, x2 = t2.type;
  if (x2 == "svg" ? o2 = "http://www.w3.org/2000/svg" : x2 == "math" ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), e2 != null) {
    for (a2 = 0;a2 < e2.length; a2++)
      if ((d2 = e2[a2]) && "setAttribute" in d2 == !!x2 && (x2 ? d2.localName == x2 : d2.nodeType == 3)) {
        u2 = d2, e2[a2] = null;
        break;
      }
  }
  if (u2 == null) {
    if (x2 == null)
      return document.createTextNode(k2);
    u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t2, e2), c2 = false), e2 = null;
  }
  if (x2 == null)
    b === k2 || c2 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = e2 && n.call(u2.childNodes), b = i2.props || p, !c2 && e2 != null)
      for (b = {}, a2 = 0;a2 < u2.attributes.length; a2++)
        b[(d2 = u2.attributes[a2]).name] = d2.value;
    for (a2 in b)
      if (d2 = b[a2], a2 == "children")
        ;
      else if (a2 == "dangerouslySetInnerHTML")
        v2 = d2;
      else if (!(a2 in k2)) {
        if (a2 == "value" && "defaultValue" in k2 || a2 == "checked" && "defaultChecked" in k2)
          continue;
        j(u2, a2, null, d2, o2);
      }
    for (a2 in k2)
      d2 = k2[a2], a2 == "children" ? y2 = d2 : a2 == "dangerouslySetInnerHTML" ? h2 = d2 : a2 == "value" ? _2 = d2 : a2 == "checked" ? m2 = d2 : c2 && typeof d2 != "function" || b[a2] === d2 || j(u2, a2, d2, b[a2], o2);
    if (h2)
      c2 || v2 && (h2.__html == v2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
    else if (v2 && (u2.innerHTML = ""), I(t2.type == "template" ? u2.content : u2, w(y2) ? y2 : [y2], t2, i2, r3, x2 == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && S(i2, 0), c2, s2), e2 != null)
      for (a2 = e2.length;a2--; )
        g(e2[a2]);
    c2 || (a2 = "value", x2 == "progress" && _2 == null ? u2.removeAttribute("value") : _2 != null && (_2 !== u2[a2] || x2 == "progress" && !_2 || x2 == "option" && _2 != b[a2]) && j(u2, a2, _2, b[a2], o2), a2 = "checked", m2 != null && m2 != u2[a2] && j(u2, a2, m2, b[a2], o2));
  }
  return u2;
}
function B(n2, u2, t2) {
  try {
    if (typeof n2 == "function") {
      var i2 = typeof n2.__u == "function";
      i2 && n2.__u(), i2 && u2 == null || (n2.__u = n2(u2));
    } else
      n2.current = u2;
  } catch (n3) {
    l.__e(n3, t2);
  }
}
function D(n2, u2, t2) {
  var i2, r3;
  if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || B(i2, null, u2)), (i2 = n2.__c) != null) {
    if (i2.componentWillUnmount)
      try {
        i2.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u2);
      }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k)
    for (r3 = 0;r3 < i2.length; r3++)
      i2[r3] && D(i2[r3], u2, t2 || typeof n2.type != "function");
  t2 || g(n2.__e), n2.__c = n2.__ = n2.__e = undefined;
}
function E(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function G(u2, t2, i2) {
  var r3, o2, e2, f2;
  t2 == document && (t2 = document.documentElement), l.__ && l.__(u2, t2), o2 = (r3 = typeof i2 == "function") ? null : i2 && i2.__k || t2.__k, e2 = [], f2 = [], O(t2, u2 = (!r3 && i2 || t2).__k = _(k, null, [u2]), o2 || p, p, t2.namespaceURI, !r3 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r3 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r3, f2), N(e2, u2, f2);
}
n = v.slice, l = { __e: function(n2, l2, u2, t2) {
  for (var i2, r3, o2;l2 = l2.__; )
    if ((i2 = l2.__c) && !i2.__)
      try {
        if ((r3 = i2.constructor) && r3.getDerivedStateFromError != null && (i2.setState(r3.getDerivedStateFromError(n2)), o2 = i2.__d), i2.componentDidCatch != null && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2)
          return i2.__E = i2;
      } catch (l3) {
        n2 = l3;
      }
  throw n2;
} }, u = 0, t = function(n2) {
  return n2 != null && n2.constructor == null;
}, x.prototype.setState = function(n2, l2) {
  var u2;
  u2 = this.__s != null && this.__s != this.state ? this.__s : this.__s = d({}, this.state), typeof n2 == "function" && (n2 = n2(d({}, u2), this.props)), n2 && d(u2, n2), n2 != null && this.__v && (l2 && this._sb.push(l2), M(this));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
}, x.prototype.render = k, i = [], o = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r3;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function p2(n2, t3) {
  c2.__h && c2.__h(r3, n2, o2 || t3), o2 = 0;
  var u3 = r3.__H || (r3.__H = { __: [], __h: [] });
  return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
}
function d2(n2) {
  return o2 = 1, h2(D2, n2);
}
function h2(n2, u3, i3) {
  var o3 = p2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(undefined, u3), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r4 = o3.t(t3, n3);
    t3 !== r4 && (o3.__N = [r4, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r3, !r3.__f)) {
    var f3 = function(n3, t3, r4) {
      if (!o3.__c.__H)
        return true;
      var u4 = o3.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u4.every(function(n4) {
        return !n4.__N;
      }))
        return !c3 || c3.call(this, n3, t3, r4);
      var i4 = o3.__c.props !== n3;
      return u4.forEach(function(n4) {
        if (n4.__N) {
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = undefined, t4 !== n4.__[0] && (i4 = true);
        }
      }), c3 && c3.call(this, n3, t3, r4) || i4;
    };
    r3.__f = true;
    var { shouldComponentUpdate: c3, componentWillUpdate: e3 } = r3;
    r3.componentWillUpdate = function(n3, t3, r4) {
      if (this.__e) {
        var u4 = c3;
        c3 = undefined, f3(n3, t3, r4), c3 = u4;
      }
      e3 && e3.call(this, n3, t3, r4);
    }, r3.shouldComponentUpdate = f3;
  }
  return o3.__N || o3.__;
}
function y2(n2, u3) {
  var i3 = p2(t2++, 3);
  !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r3.__H.__h.push(i3));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r4) {
  var u3 = p2(t2++, 7);
  return C2(u3.__H, r4) && (u3.__ = n2(), u3.__H = r4, u3.__h = n2), u3.__;
}
function j2() {
  for (var n2;n2 = f2.shift(); )
    if (n2.__P && n2.__H)
      try {
        n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
      } catch (t3) {
        n2.__H.__h = [], c2.__e(t3, n2.__v);
      }
}
c2.__b = function(n2) {
  r3 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i3 = (r3 = n2.__c).__H;
  i3 && (u2 === r3 ? (i3.__h = [], r3.__h = [], i3.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = undefined;
  })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r3;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (f2.push(t3) !== 1 && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = undefined;
  })), u2 = r3 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r4) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r4, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r4 = n2.__c;
  r4 && r4.__H && (r4.__H.__.forEach(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r4.__H = undefined, t3 && c2.__e(t3, r4.__v));
};
var k2 = typeof requestAnimationFrame == "function";
function w2(n2) {
  var t3, r4 = function() {
    clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u3 = setTimeout(r4, 35);
  k2 && (t3 = requestAnimationFrame(r4));
}
function z2(n2) {
  var t3 = r3, u3 = n2.__c;
  typeof u3 == "function" && (n2.__c = undefined, u3()), r3 = t3;
}
function B2(n2) {
  var t3 = r3;
  n2.__c = n2.__(), r3 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r4) {
    return t4 !== n2[r4];
  });
}
function D2(n2, t3) {
  return typeof t3 == "function" ? t3(n2) : t3;
}

// src/Utility/retry.ts
function delay(delay2) {
  return new Promise((resolve) => setTimeout(resolve, delay2));
}
async function retry(fn, delays) {
  if (!Array.isArray(delays)) {
    delays = [1000];
  }
  let count = 0;
  while (true) {
    try {
      const resetRetry = await fn();
      if (resetRetry) {
        count = 0;
        throw new Error("force retry");
      }
      break;
    } catch (err) {
      await delay(delays[count]);
      if (count < delays.length - 1) {
        count++;
      }
    }
  }
}

// src/Model/PrinterConfig.ts
class PrinterConfig {
  get width() {
    return Math.ceil(this.printableWidth * this.dpi / 25.4);
  }
  get printableWidth() {
    switch (this.paperWidth) {
      case 80:
        return 72;
      case 58:
        return 48;
      default:
        return this.paperWidth - 10;
    }
  }
  textAsImage = true;
  mtu = 50;
  image = "rastar";
  sharePrinter = false;
  fontSize = 30;
  fontFace = 0;
  lineHeight = 1.2;
  paperWidth = 58;
  dpi = 203;
}

// src/Utility/copy.ts
function isWritable(obj, prop) {
  while (obj) {
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (desc) {
      return !(typeof desc.get === "function" && typeof desc.set === "undefined");
    }
    obj = Object.getPrototypeOf(obj);
  }
  return true;
}
function copy(target, source, isSet = false) {
  if (!target || !source) {
    return target || source;
  }
  for (const prop in source) {
    if (!isWritable(target, prop)) {
      continue;
    }
    const curVal = target[prop];
    switch (true) {
      case Array.isArray(curVal): {
        if (isSet) {
          target[prop] = source[prop];
        }
        break;
      }
      case curVal instanceof Date: {
        if (isSet) {
          target[prop] = source[prop];
        }
        break;
      }
      case curVal === undefined:
      case curVal === null: {
        target[prop] = source[prop];
        break;
      }
      case typeof curVal === "object": {
        copy(curVal, source[prop], isSet);
        break;
      }
      default: {
        if (isSet) {
          target[prop] = source[prop];
        }
      }
    }
  }
  return target;
}

// src/PrinterService/ImagePrinterService.ts
class ImagePrinterService {
  constructor(option, style) {
    if (!option) {
      option = {};
    }
    this.option = Object.assign(new PrinterConfig, option);
    if (!style) {
      style = {};
    }
    this.defaultStyle = copy(style, {
      align: 0 /* left */,
      lineHeight: 1.2,
      font: {
        fontFaceType: 0,
        fontStyle: 0 /* none */,
        size: 24
      }
    });
    this.currentStyle = copy({}, this.defaultStyle);
  }
  device;
  currentStyle;
  defaultStyle;
  _canvas = null;
  option;
  print(text, fontStyle) {
    const textStyle = fontStyle ? copy({ font: fontStyle }, this.currentStyle) : undefined;
    this.printLine(text, textStyle);
  }
  printLine(text, textStyl) {
    const textStyle = copy(textStyl, this.currentStyle);
    const imageData = this.drawCanvas((cv, ctx2) => {
      const lines = [];
      let line = "";
      let textHeight = 0;
      for (let i3 = 0;i3 < text.length; i3++) {
        const testLine = line + text[i3];
        const metrics = ctx2.measureText(testLine);
        textHeight = Math.max(textHeight, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
        if (metrics.width > cv.width && line !== "") {
          lines.push(line);
          line = text[i3];
        } else {
          line = testLine;
        }
      }
      if (line) {
        lines.push(line);
      }
      if (!textHeight) {
        textHeight = textStyle.font.size;
      }
      const lineHeight = Math.ceil(textHeight * textStyle.lineHeight);
      const height = lines.length * lineHeight;
      const x2 = textStyle.align === 2 /* right */ ? cv.width : textStyle.align == 1 /* center */ ? cv.width / 2 : 0;
      for (let i3 = 0;i3 < lines.length; i3++) {
        const y3 = i3 * lineHeight + Math.floor((lineHeight - textHeight) / 3);
        const text2 = lines[i3];
        ctx2.fillText(text2, x2, y3);
        if (textStyle.font.fontStyle & 4 /* underline */) {
          const textWidth = ctx2.measureText(text2).width;
          const y22 = y3 + lineHeight - Math.ceil((lineHeight - textHeight) / 2);
          ctx2.beginPath();
          const lx = textStyle.align === 2 /* right */ ? x2 - textWidth : textStyle.align == 1 /* center */ ? x2 - textWidth / 2 : 0;
          ctx2.moveTo(lx, y22);
          ctx2.lineTo(lx + textWidth, y22);
          ctx2.lineWidth = 1;
          ctx2.strokeStyle = ctx2.fillStyle;
          ctx2.stroke();
        }
      }
      return height;
    }, textStyle);
    this.printImage(imageData.data.buffer, imageData.width, imageData.height);
  }
  printSeparator(separator) {
    const textStyle = this.currentStyle;
    const imageData = this.drawCanvas((cv, ctx2) => {
      const baseMetrics = ctx2.measureText("1");
      const textHeight = baseMetrics.actualBoundingBoxAscent + baseMetrics.actualBoundingBoxDescent;
      const lineHeight = textHeight * textStyle.lineHeight;
      const metrics = ctx2.measureText(separator);
      const count = Math.ceil(cv.width / metrics.width);
      const text = separator.repeat(count);
      const y3 = Math.floor((lineHeight - textHeight) / 2);
      const x2 = textStyle.align === 2 /* right */ ? cv.width : textStyle.align == 1 /* center */ ? cv.width / 2 : 0;
      ctx2.fillText(text, x2, y3);
      return lineHeight;
    });
    this.printImage(imageData.data.buffer, imageData.width, imageData.height);
  }
  reset() {
    this.currentStyle = copy({}, this.defaultStyle);
  }
  feed(pt = 24) {
    const imageData = this.drawCanvas((cv, ctx2) => {
      ctx2.font = ctx2.font.replace(`${this.currentStyle.font.size}px`, `${pt}px`);
      const baseMetrics = ctx2.measureText("1");
      const textHeight = baseMetrics.actualBoundingBoxAscent + baseMetrics.actualBoundingBoxDescent;
      const lineHeight = textHeight * this.currentStyle.lineHeight;
      ctx2.fillStyle = "white";
      ctx2.fillRect(0, 0, cv.width, lineHeight);
      return lineHeight;
    });
    this.printImage(imageData.data.buffer, imageData.width, imageData.height);
  }
  drawCanvas(draw, textStyle) {
    let canvas = this._canvas;
    this._canvas = null;
    const width = this.option.width;
    const height = 100;
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    if (!textStyle) {
      textStyle = this.currentStyle;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx2 = canvas.getContext("2d");
    ctx2.fillStyle = "black";
    ctx2.textBaseline = "top";
    ctx2.font = `${textStyle.font.size}px sans-serif`;
    if (textStyle.font.fontStyle & 2 /* italic */) {
      ctx2.font += " italic";
    }
    if (textStyle.font.fontStyle & 1 /* bold */) {
      ctx2.font += " bold";
    }
    ctx2.textBaseline = "top";
    switch (textStyle.align) {
      case 2 /* right */: {
        ctx2.textAlign = "right";
        break;
      }
      case 1 /* center */: {
        ctx2.textAlign = "center";
        break;
      }
      case 0 /* left */:
      default: {
        ctx2.textAlign = "left";
        break;
      }
    }
    ctx2.clearRect(0, 0, width, height);
    const finalHeight = draw(canvas, ctx2);
    const imageData = ctx2.getImageData(0, 0, width, finalHeight);
    this._canvas = canvas;
    return imageData;
  }
  setDefaultStyle(style) {
    this.defaultStyle = style;
    this.currentStyle = copy({}, style);
  }
}

// src/PrinterService/ESCPrinterService.ts
var ESC = "\x1B";
var GS = "\x1D";
var encoder = new TextEncoder;

class ESCPrinterService extends ImagePrinterService {
  constructor(option, style) {
    super(option, style);
  }
  _queue = [];
  _isRunning = false;
  execute(command, isTop = false) {
    this.enqueue(encoder.encode(command), isTop);
  }
  enqueue(command, isTop = false) {
    if (isTop) {
      this._queue.unshift(command);
    } else {
      this._queue.push(command);
    }
    this.runQueue();
  }
  async runQueue() {
    if (this._isRunning) {
      return;
    }
    this._isRunning = true;
    if (this.option.sharePrinter) {
      try {
        const delays = [500, 500, 1000, 1000 * 2, 1000 * 5, 1000 * 10, 1000 * 30, 1000 * 60];
        await retry(async () => {
          if (this._queue.length <= 0) {
            return;
          }
          await this.connect();
          while (this._queue.length > 0) {
            const c3 = this._queue[0];
            if (c3.length === 0) {
              await this.disconnect();
              this._queue.shift();
              return true;
            } else {
              await this.executeRaw(c3);
              this._queue.shift();
            }
          }
        }, delays);
      } catch {}
    } else {
      try {
        await this.connect();
        while (this._queue.length > 0) {
          const c3 = this._queue[0];
          if (c3.length === 0) {
            continue;
          } else {
            await this.executeRaw(c3);
            this._queue.shift();
          }
        }
      } catch {}
    }
    this._isRunning = false;
  }
  pause() {
    this.enqueue(new Uint8Array);
  }
  async dispose() {
    this._queue.length = 0;
    await this.disconnect();
  }
  reset() {
    super.reset();
    this.resetPrinter();
    this.textAlign(this.currentStyle.align);
    this.lineHeight(this.currentStyle.lineHeight);
    this.fontStyle(this.currentStyle.font);
  }
  resetPrinter() {
    this.execute(`${ESC}@`, true);
  }
  textAlign(align) {
    this.execute(`${ESC}a` + String.fromCharCode(align));
    this.currentStyle.align = align;
  }
  bold(isActive = true) {
    this.execute(`${ESC}E` + String.fromCharCode(isActive ? 1 : 0));
    const mode = 1 /* bold */;
    if (isActive) {
      this.currentStyle.font.fontStyle |= mode;
    } else {
      this.currentStyle.font.fontStyle &= mode;
    }
  }
  underline(isActive = true) {
    this.execute(`${ESC}-` + String.fromCharCode(isActive ? 1 : 0));
    const mode = 4 /* underline */;
    if (isActive) {
      this.currentStyle.font.fontStyle |= mode;
    } else {
      this.currentStyle.font.fontStyle &= mode;
    }
  }
  italic(isActive = true) {
    this.execute(`${ESC}4` + String.fromCharCode(isActive ? 1 : 0));
    const mode = 2 /* italic */;
    if (isActive) {
      this.currentStyle.font.fontStyle |= mode;
    } else {
      this.currentStyle.font.fontStyle &= mode;
    }
  }
  cut(isFull = true) {
    this.execute(`${GS}V` + String.fromCharCode(isFull ? 1 : 0));
  }
  lineFeed(n2 = 1) {
    this.execute(`${ESC}d` + String.fromCharCode(n2));
  }
  feed(pt = 24) {
    if (this.option.textAsImage) {
      super.feed(pt);
      return;
    }
    this.execute(`${ESC}j` + String.fromCharCode(pt));
  }
  fontFace(faceId = 0) {
    this.execute(`${ESC}!` + String.fromCharCode(faceId));
    this.currentStyle.font.fontFaceType = faceId;
  }
  fontSize(size = 0) {
    const normalSize = 24;
    let d3 = size / normalSize;
    let m3 = 0;
    let t3 = Math.round(d3);
    if (d3 - t3 >= 0.5) {
      m3 = 1;
    }
    if (t3 > 0) {
      t3--;
    }
    if (t3 > 7) {
      t3 = 7;
    }
    const sizeC = t3 * (16 + 1) + m3;
    this.execute(`${GS}!${String.fromCharCode(sizeC)}`);
    this.currentStyle.font.size = size;
  }
  lineHeight(size) {
    const ln = Math.ceil(this.currentStyle.font?.size * size);
    this.execute(`${ESC}3${String.fromCharCode(ln)}`);
    this.currentStyle.lineHeight = size;
  }
  fontStyle(style) {
    if (typeof style.fontFaceType == "number") {
      this.fontFace(style.fontFaceType);
    }
    if (typeof style.size == "number") {
      this.fontSize(style.size);
    }
    if (!style.fontStyle) {
      return;
    }
    this.bold(Boolean(style.fontStyle & 1 /* bold */));
    this.italic(Boolean(style.fontStyle & 2 /* italic */));
    this.underline(Boolean(style.fontStyle & 4 /* underline */));
  }
  print(text, fontStyle) {
    if (this.option.textAsImage) {
      return super.print(text, fontStyle);
    }
    if (fontStyle) {
      this.fontStyle(fontStyle);
    }
    this.execute(text);
    if (fontStyle) {
      this.reset();
    }
  }
  printLine(text, textStyle) {
    if (this.option.textAsImage) {
      return super.printLine(text, textStyle);
    }
    if (textStyle) {
      if (textStyle.font) {
        this.fontStyle(textStyle.font);
      }
      if (textStyle.align) {
        this.textAlign(textStyle.align);
      }
    }
    this.execute(`${text}
`);
    if (textStyle) {
      this.reset();
    }
  }
  printSeparator(separator) {
    if (this.option.textAsImage) {
      return super.printSeparator(separator);
    }
    let count = 32;
    if (this.option.paperWidth > 58) {
      count = 42;
    }
    this.printLine(separator.padStart(count, separator));
  }
  printImage(data, width, height) {
    const imageData = this.option.image === "bit" ? this.bitImage(new Uint8ClampedArray(data), width, height) : this.rastarImage(new Uint8ClampedArray(data), width, height);
    this.enqueue(imageData);
  }
  openCashdrawer() {
    const pin = 48, on = 25, off = 200;
    this.execute(`${ESC}p${String.fromCharCode(pin)}${String.fromCharCode(on)}${String.fromCharCode(off)}`);
  }
  printQR() {
    this.execute(``);
  }
  printBarcode() {
    this.execute(``);
  }
  rastarImage(pixels, width, height) {
    const bytesPerRow = Math.ceil(width / 8);
    const bitmap = new Uint8Array(bytesPerRow * height);
    for (let y3 = 0;y3 < height; y3++) {
      for (let x2 = 0;x2 < width; x2++) {
        const i3 = (y3 * width + x2) * 4;
        const r4 = pixels[i3];
        const g2 = pixels[i3 + 1];
        const b = pixels[i3 + 2];
        const a3 = pixels[i3 + 3];
        const luminance = (r4 + g2 + b) / 3;
        const black = a3 > 128 && luminance < 127;
        if (black)
          bitmap[y3 * bytesPerRow + (x2 >> 3)] |= 128 >> x2 % 8;
      }
    }
    const header = new Uint8Array([
      29,
      118,
      48,
      0,
      bytesPerRow & 255,
      bytesPerRow >> 8 & 255,
      height & 255,
      height >> 8 & 255
    ]);
    const full = new Uint8Array(header.length + bitmap.length);
    full.set(header);
    full.set(bitmap, header.length);
    return full;
  }
  bitImage(pixels, width, height) {
    const bytes = [];
    bytes.push(27, 51, 0);
    for (let y3 = 0;y3 < height; y3 += 24) {
      bytes.push(27, 42, 33, width & 255, width >> 8 & 255);
      for (let x2 = 0;x2 < width; x2++) {
        for (let k3 = 0;k3 < 3; k3++) {
          let byte = 0;
          for (let bp = 0;bp < 8; bp++) {
            const yOffset = y3 + k3 * 8 + bp;
            if (yOffset >= height)
              continue;
            const i3 = (yOffset * width + x2) * 4;
            const r4 = pixels[i3];
            const g2 = pixels[i3 + 1];
            const b = pixels[i3 + 2];
            const a3 = pixels[i3 + 3];
            const luminance = 0.299 * r4 + 0.587 * g2 + 0.114 * b;
            const black = a3 > 128 && luminance < 127;
            byte |= (black ? 1 : 0) << 7 - bp;
          }
          bytes.push(byte);
        }
      }
      bytes.push(10);
    }
    bytes.push(27, 51, Math.ceil(this.currentStyle.font?.size * this.currentStyle.lineHeight));
    return new Uint8Array(bytes);
  }
}

// src/PrinterService/BluetoothPrinterService.ts
class BluetoothPrinterService extends ESCPrinterService {
  constructor(option, style) {
    super(option, style);
  }
  _connection;
  async init() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{
        services: ["000018f0-0000-1000-8000-00805f9b34fb"]
      }]
    });
    const server = await device.gatt?.connect();
    const service = await server?.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    this._connection = await service?.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
    this.device = device;
    if (this.option.sharePrinter) {
      device.gatt?.disconnect();
      this._connection = undefined;
    }
  }
  async connect() {
    if (!this.device) {
      return;
    }
    if (this.device.gatt?.connected && this._connection) {
      return;
    }
    const server = await this.device.gatt?.connect();
    const service = await server?.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    this._connection = await service?.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
    this.resetPrinter();
  }
  async disconnect() {
    if (!this._connection) {
      return;
    }
    this.device?.gatt?.disconnect();
    this._connection = undefined;
  }
  async executeRaw(command) {
    const delay3 = 0;
    const chunkSize = this.option.mtu;
    if (command.length <= chunkSize) {
      await this._connection?.writeValue(command);
      if (delay3) {
        await new Promise((resolve) => setTimeout(resolve, delay3));
      }
      return;
    }
    let offset = 0;
    do {
      const chunk = command.slice(offset, offset + chunkSize);
      await this._connection?.writeValue(chunk);
      if (delay3) {
        await new Promise((resolve) => setTimeout(resolve, delay3));
      }
      offset += chunkSize;
    } while (offset < command.length);
  }
  async dispose() {
    await super.dispose();
    this._connection = undefined;
  }
}

// src/PrinterService/LogPrinterService.ts
class LogPrinterService extends ImagePrinterService {
  constructor(option, style) {
    super(option, style);
  }
  _imageCanvas;
  _tempCanvas;
  init() {
    this.device = { id: "", name: "console" };
    return Promise.resolve();
  }
  connect() {
    return Promise.resolve();
  }
  disconnect() {
    return Promise.resolve();
  }
  dispose() {
    return Promise.resolve();
  }
  printLine(text, textStyle) {
    if (this.option.textAsImage) {
      return super.printLine(text, textStyle);
    }
    textStyle = copy(textStyle, this.currentStyle);
    switch (textStyle.align) {
      case 2 /* right */: {
        text = text.padStart(50);
        break;
      }
      case 1 /* center */: {
        text = " ".repeat((50 - text.length) / 2) + text;
        break;
      }
    }
    console.log(text);
  }
  printSeparator(separator) {
    if (this.option.textAsImage) {
      return super.printSeparator(separator);
    }
    console.log(separator.padStart(50, separator));
  }
  textAlign(align) {}
  cut(isFull) {
    console.log("cut");
  }
  lineFeed(n2 = 1) {
    for (let i3 = 0, len = n2 || 1;i3 < len; i3++) {
      console.log("");
    }
  }
  feed(pt = 24) {
    if (this.option.textAsImage) {
      return super.feed(pt);
    }
    this.lineFeed(Math.ceil(pt / 24));
  }
  printImage(data, width, height) {
    if (!this._imageCanvas) {
      this._imageCanvas = document.createElement("canvas");
    }
    this._imageCanvas.width = width;
    this._imageCanvas.height = height;
    const ctx2 = this._imageCanvas.getContext("2d");
    ctx2.fillStyle = "white";
    ctx2.fillRect(0, 0, width, height);
    if (!this._tempCanvas) {
      this._tempCanvas = document.createElement("canvas");
    }
    this._tempCanvas.width = width;
    this._tempCanvas.height = height;
    const tempCtx = this._tempCanvas.getContext("2d");
    tempCtx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
    ctx2.drawImage(this._tempCanvas, 0, 0);
    const dataUrl = this._imageCanvas.toDataURL();
    const style = [
      "font-size: 1px;",
      `background: url(${dataUrl}) no-repeat;`,
      "background-size: contain;",
      `padding: ${height}px ${width}px;`,
      "line-height: 0;"
    ].join(" ");
    console.log("%c ", style);
  }
  openCashdrawer() {}
  printQR() {}
  printBarcode() {}
  pause() {}
}

// src/Services/MathLanguageParser.ts
var map = {
  nol: 0,
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000,
  sejuta: 10 ^ 6,
  semiliar: 10 ^ 9,
  setriliun: 10 ^ 12,
  setengah: (n2) => n2 + Math.pow(10, Math.floor(n2).toString().length - 1) / 2,
  puluh: (n2) => n2 * 10,
  belas: (n2) => n2 + 10,
  ratus: (n2) => n2 * 100,
  ribu: (n2) => n2 * 1000,
  juta: (n2) => n2 * 1e6,
  miliar: (n2) => n2 * 1e9,
  triliun: (n2) => n2 * 1000000000000
};
var normalizeMap = new Map([
  [/[.]/g, ""],
  [/,/g, "."],
  [/(di)?kali/g, "*"],
  [/(di)?bagi/g, "/"],
  [/(di)?tambah/g, "+"],
  [/((di)?kurang|min[ue]s)/g, "-"],
  [/koma/g, "."],
  [/ blas/g, "belas"],
  [/enol/g, "nol"],
  [/due/g, "dua"],
  [/tige/g, "tiga"],
  [/lime/g, "lima"],
  [/tujoh/g, "tujuh"],
  [/lapan/g, "delapan"],
  [/persen/g, "%"],
  [/([^0-9.]|^)1\/2(?![0-9.])/g, "$1setengah"],
  [/(sama dengan|berapa|hasil|brapa)/g, "="]
]);
function isNumber(n2) {
  return n2.match(/^[-]?[0-9]+([.][0-9]+)?$/) != null;
}
function isOperator(n2) {
  return n2 && "+*-/%=".includes(n2);
}
function Normalize(input) {
  input = input.toLowerCase();
  for (const [key, val] of normalizeMap) {
    input = input.replace(key, val);
  }
  return input;
}
function MathParser(input) {
  const words = Normalize(input).split(" ");
  let res = [];
  let total = 0;
  let hundred = 0;
  let num = 0;
  let isComa = false;
  let isComaB = false;
  for (const word of words) {
    if (word === ".") {
      res.push((total + hundred + num).toFixed(0) + word);
      isComaB = isComa = true;
      total = hundred = num = 0;
      continue;
    }
    if (isOperator(word)) {
      total += hundred + num;
      if (total != 0) {
        res.push(total.toFixed(10).replace(/[.]?0+$/, ""));
      }
      res.push(word);
      isComa = false;
      total = hundred = num = 0;
      continue;
    }
    if (isNumber(word)) {
      total += hundred + num;
      if (total != 0) {
        res.push(total.toFixed(10).replace(/[.]?0+$/, ""));
      }
      res.push(word);
      isComa = false;
      total = hundred = num = 0;
      continue;
    }
    const d3 = map[word];
    switch (typeof d3) {
      case "number": {
        if (isComa) {
          if (isComaB) {
            isComaB = false;
          } else {
            res[res.length - 1] += num;
          }
        }
        if (num == 0) {
          num = d3;
        } else if (num == 1 || !Number.isInteger(num)) {
          res.push((total + hundred + num).toFixed(10).replace(/[.]?0+$/, ""));
          total = hundred = 0;
          num = d3;
        } else if (total + hundred == 0) {
          hundred = num * 10;
          num = d3;
        } else {
          res.push((total + hundred + num).toFixed(10).replace(/[.]?0+$/, ""));
          total = hundred = 0;
          num = d3;
        }
        break;
      }
      case "undefined": {
        break;
      }
      default: {
        if (num == 0) {
          total += hundred + num;
          if (total === 0 && res.length > 0) {
            total = Number(res[res.length - 1]);
          }
          total = d3(total);
          if (total >= 100) {
            hundred = 0;
          } else if (total >= 10) {
            hundred = total;
            total = 0;
          } else {
            num = total;
            total = hundred = 0;
          }
        } else {
          const chunk = d3(num);
          if (hundred > 0 && chunk.toFixed(0).length >= hundred.toFixed(0).length) {
            res.push((total + hundred).toFixed(10).replace(/[.]?0+$/, ""));
            total = 0;
            num = 0;
          } else if (chunk >= 10) {
            hundred += chunk;
            num = 0;
          } else {
            num = chunk;
          }
        }
        isComa = false;
        break;
      }
    }
  }
  if (isComa) {
    if (num) {
      res[res.length - 1] += num;
    }
  } else {
    total += hundred + num;
    if (total != 0) {
      res.push(total.toFixed(10).replace(/[.]?0+$/, ""));
    }
  }
  return res;
}
function CalcParser(input) {
  const tokens = MathParser(input);
  let result2 = "";
  let isPrevNumber = false;
  let skipThousand = false;
  for (const token of tokens) {
    if (isNumber(token)) {
      if (isPrevNumber) {
        result2 += "+";
        skipThousand = false;
      }
      let num = Number(token);
      if (!skipThousand && num < 999) {
        num *= 1000;
        result2 += num.toFixed(10).replace(/[.]?0+$/, "");
      } else {
        result2 += token;
      }
      isPrevNumber = true;
    } else {
      result2 += token;
      switch (token) {
        case "*":
        case "/": {
          skipThousand = true;
          break;
        }
        default: {
          skipThousand = false;
        }
      }
      isPrevNumber = false;
    }
  }
  if (isNumber(result2[result2.length - 1])) {
    result2 += "+";
  }
  return result2;
}

// src/Services/ScreenService.ts
class ScreenService {
  _wakeLock;
  async keepScreenAwake() {
    try {
      this._wakeLock = await navigator.wakeLock.request("screen");
      document.addEventListener("visibilitychange", async () => {
        if (this._wakeLock !== null && document.visibilityState === "visible") {
          this._wakeLock = await navigator.wakeLock.request("screen");
        }
      });
      return true;
    } catch (e3) {
      alert(e3);
      return false;
    }
  }
  get isKeepAwake() {
    return this._wakeLock?.released == false;
  }
  async releaseWakeLock() {
    if (!this._wakeLock) {
      return;
    }
    await this._wakeLock.release();
    this._wakeLock = undefined;
  }
  static default = new ScreenService;
}
var ScreenService_default = ScreenService.default;

// src/Model/CalculatorConfig.ts
class CalculatorConfig {
  maxDecimal = 8;
  maxDigit = 15;
  deviceName = "";
  printerType = "bluetooth";
  keepScreenAwake = true;
  align = 2 /* right */;
  printOperator = false;
  show3Zero = true;
  defaultConfig = new PrinterConfig;
  printerConfig = {};
  apply(printer) {
    if (!printer?.device) {
      return;
    }
    printer.option = this.printerConfig[printer.device?.name ?? ""] ?? this.defaultConfig;
    printer.setDefaultStyle({
      align: this.align,
      lineHeight: this.defaultConfig.lineHeight ?? 1.2,
      font: {
        size: this.defaultConfig.fontSize,
        fontFaceType: this.defaultConfig.fontFace,
        fontStyle: 0 /* none */
      }
    });
  }
}

// src/Services/SettingService.ts
var isPersisted = false;

class LocalStorageService {
  _type;
  _key;
  constructor(_type, _key) {
    this._type = _type;
    this._key = _key;
  }
  get() {
    const d3 = localStorage.getItem(this._key);
    let data = new this._type;
    if (d3) {
      const dat = JSON.parse(d3);
      data = copy(data, dat, true);
    }
    return data;
  }
  set(data) {
    if (!isPersisted) {
      navigator.storage.persisted().then(async (persisted) => {
        isPersisted = persisted;
        if (!persisted) {
          isPersisted = await navigator.storage.persist();
        }
      });
    }
    let dataStr = "";
    if (data !== null && data !== undefined) {
      dataStr = JSON.stringify(data);
    }
    localStorage.setItem(this._key, dataStr);
  }
  delete() {
    localStorage.removeItem(this._key);
  }
}
var SettingService = new LocalStorageService(CalculatorConfig, "setting");
var SettingService_default = SettingService;

// src/Services/SpeechService.ts
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

class SpeechService {
  _recognition;
  _isPermissionGranted = false;
  _isListening = false;
  get isListening() {
    return this._isListening;
  }
  async requestPermission() {
    if (this._isPermissionGranted) {
      return;
    }
    const m3 = await navigator.mediaDevices.getUserMedia({ audio: true });
    this._isPermissionGranted = m3.active;
  }
  recognize(lang = "id-ID") {
    if (this.isListening) {
      throw new Error("listening");
    }
    if (!this._isPermissionGranted) {
      throw new Error("require permission");
    }
    if (!this._recognition) {
      this._recognition = new SpeechRecognition;
    }
    this._recognition.lang = lang;
    this._recognition.interimResults = false;
    this._recognition.continuous = true;
    this._recognition.maxAlternatives = 1;
    let result2;
    return new Promise((r4, e3) => {
      try {
        this._recognition.onresult = (event) => {
          console.log(event.results[event.results.length - 1][0].transcript);
          result2 = event.results;
        };
        this._recognition.onerror = (event) => {
          e3(event.error);
        };
        this._recognition.onnomatch = (event) => {
          if (this._isListening) {
            this._recognition?.start();
          }
        };
        this._recognition.onend = () => {
          if (this._isListening) {
            this._recognition?.start();
          } else {
            let final = "";
            if (result2) {
              final = Array.from(result2).map((o3) => o3[0].transcript).join(" ");
              console.log(Array.from(result2).map((o3) => `[${o3[0].confidence}]${o3[0].transcript}`).join(`
`));
            }
            r4(final);
          }
        };
        this._recognition.start();
        this._isListening = true;
      } catch (error) {
        e3(error);
      }
    });
  }
  stop() {
    this._isListening = false;
    if (!this._recognition) {
      return;
    }
    this._recognition.stop();
  }
  static default = new SpeechService;
}
var SpeechService_default = SpeechService.default;

// src/Utility/useLongPress.ts
function useLongPress({
  onClick,
  onHold,
  repeat = true,
  delay: delay3 = 500,
  interval = 100
}) {
  const timerRef = A2(null);
  const intervalRef = A2(null);
  const triggered = A2(false);
  const start = () => {
    triggered.current = false;
    if (!timerRef.current) {
      timerRef.current = window.setTimeout(() => {
        triggered.current = true;
        if (onHold)
          onHold();
        if (repeat && onHold) {
          intervalRef.current = window.setInterval(onHold, interval);
        }
      }, delay3);
    }
  };
  const stop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const handlePointerDown = (e3) => {
    if (e3.button !== 0)
      return;
    start();
  };
  const handlePointerUp = () => {
    if (triggered.current == false) {
      onClick();
      triggered.current = null;
    }
    stop();
  };
  y2(() => {
    return stop;
  }, []);
  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchEnd: handlePointerUp,
    onPointerLeave: stop,
    onPointerCancel: stop
  };
}
// node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f3 = 0;
function jsxDEV(e3, t3, n2, o3, i3, u3) {
  t3 || (t3 = {});
  var a3, c3, p3 = t3;
  if ("ref" in p3)
    for (c3 in p3 = {}, t3)
      c3 == "ref" ? a3 = t3[c3] : p3[c3] = t3[c3];
  var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u3 };
  if (typeof e3 == "function" && (a3 = e3.defaultProps))
    for (c3 in a3)
      p3[c3] === undefined && (p3[c3] = a3[c3]);
  return l.vnode && l.vnode(l3), l3;
}

// src/Components/BottomPopup.tsx
var BottomPopup = ({ isOpen, onClose, hideClose, contentStyle, children }) => {
  if (!isOpen)
    return null;
  return /* @__PURE__ */ jsxDEV("div", {
    class: "popup-backdrop",
    onClick: onClose,
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "popup-content",
      style: contentStyle,
      onClick: (e3) => e3.stopPropagation(),
      children: [
        !hideClose && /* @__PURE__ */ jsxDEV("button", {
          class: "close-btn",
          onClick: onClose,
          children: "×"
        }, undefined, false, undefined, this),
        children
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
};
var BottomPopup_default = BottomPopup;

// src/Components/SettingPopup.tsx
function SettingPopup(setting) {
  let settingData = setting.setting;
  if (!settingData) {
    settingData = SettingService_default.get();
  }
  const [data] = d2(settingData);
  const [isRight, setIsRight] = d2(data.align == 2 /* right */);
  const onClose = () => {
    SettingService_default.set(data);
    setting.onClose && setting.onClose(data);
  };
  return /* @__PURE__ */ jsxDEV(BottomPopup_default, {
    isOpen: setting.isOpen,
    onClose,
    contentStyle: { height: "100dvh", fontSize: "1rem", backgroundColor: "#f0f0f0", padding: "1rem 0" },
    children: [
      /* @__PURE__ */ jsxDEV("h4", {
        style: { textAlign: "center", margin: "0 0 1rem 0" },
        children: "SETTING"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("div", {
        style: { overflow: "auto", height: "calc(100% - 2rem)", padding: "0 1rem", boxSizing: "border-box" },
        children: /* @__PURE__ */ jsxDEV("div", {
          style: {
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "1rem 0.5rem"
          },
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              children: "Maks. desimal"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("input", {
                class: "form",
                type: "number",
                name: "max-decimal",
                step: "1",
                min: "0",
                max: "10",
                value: data.maxDecimal,
                onInput: (e3) => {
                  data.maxDecimal = parseInt(e3.target.value);
                }
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Maks. digit"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("input", {
                class: "form",
                type: "number",
                name: "max-digit",
                step: "1",
                min: "6",
                max: "15",
                value: data.maxDigit,
                onInput: (e3) => {
                  data.maxDigit = parseInt(e3.target.value);
                }
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Tombol 0 tambahan"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "input-container",
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                value: data.show3Zero ? "000" : "00",
                onInput: (e3) => {
                  data.show3Zero = e3.target?.value == "000";
                },
                children: [
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "00",
                    children: "00"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "000",
                    children: "000"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              style: { gridColumn: "span 2" },
              children: [
                "Nama device",
                /* @__PURE__ */ jsxDEV("div", {
                  children: /* @__PURE__ */ jsxDEV("input", {
                    class: "form",
                    type: "text",
                    name: "device-name",
                    value: data.deviceName,
                    onInput: (e3) => {
                      data.deviceName = e3.target.value;
                    }
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Berbagi printer"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "input-container",
              children: /* @__PURE__ */ jsxDEV("label", {
                class: "switch",
                children: [
                  /* @__PURE__ */ jsxDEV("input", {
                    type: "checkbox",
                    checked: data.defaultConfig.sharePrinter,
                    onInput: (e3) => {
                      data.defaultConfig.sharePrinter = e3.target.checked;
                    }
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("span", {
                    class: "slider"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Ukuran kertas"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                value: data.defaultConfig.paperWidth,
                onInput: (e3) => {
                  data.defaultConfig.paperWidth = parseInt(e3.target.value);
                },
                children: [58, 80].map((o3) => /* @__PURE__ */ jsxDEV("option", {
                  value: o3,
                  children: [
                    o3,
                    "mm"
                  ]
                }, undefined, true, undefined, this))
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "DPI"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                value: data.defaultConfig.dpi,
                onInput: (e3) => {
                  data.defaultConfig.dpi = parseInt(e3.target.value);
                },
                children: [203, 300, 600, 1200, 2400, 4800].map((o3) => /* @__PURE__ */ jsxDEV("option", {
                  value: o3,
                  children: o3
                }, undefined, false, undefined, this))
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Ukuran huruf"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("input", {
                class: "form",
                type: "number",
                name: "font-size",
                step: "2",
                min: "12",
                max: "72",
                value: data.defaultConfig.fontSize,
                onInput: (e3) => {
                  data.defaultConfig.fontSize = parseInt(e3.target.value);
                }
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Posisi cetakan"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "input-container",
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                value: data.align,
                onInput: (e3) => {
                  data.align = parseInt(e3.target.value);
                  setIsRight(data.align == 2 /* right */);
                },
                children: [
                  /* @__PURE__ */ jsxDEV("option", {
                    value: 0 /* left */,
                    children: "Kiri"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("option", {
                    value: 1 /* center */,
                    children: "Tengah"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("option", {
                    value: 2 /* right */,
                    children: "Kanan"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            isRight && /* @__PURE__ */ jsxDEV(k, {
              children: [
                /* @__PURE__ */ jsxDEV("div", {
                  children: "Cetak operator +"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("div", {
                  class: "input-container",
                  children: /* @__PURE__ */ jsxDEV("label", {
                    class: "switch",
                    children: [
                      /* @__PURE__ */ jsxDEV("input", {
                        type: "checkbox",
                        checked: data.printOperator,
                        onInput: (e3) => {
                          data.printOperator = e3.target.checked;
                        }
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV("span", {
                        class: "slider"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Tipe printer"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                value: data.printerType,
                onInput: (e3) => {
                  data.printerType = e3.target.value;
                },
                children: [
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "bluetooth",
                    children: "Bluetooth"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "imin",
                    children: "Imin Built-in"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "MTU (Maximum Transmision Unit)"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("input", {
                class: "form",
                type: "number",
                name: "max-digit",
                step: "10",
                min: "20",
                max: "512",
                value: data.defaultConfig.mtu,
                onInput: (e3) => {
                  data.defaultConfig.mtu = Math.max(parseInt(e3.target.value), 20);
                }
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Tipe cetakan text"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                name: "print-mode",
                value: data.defaultConfig.textAsImage?.toString(),
                onInput: (e3) => {
                  data.defaultConfig.textAsImage = e3.target.value != "false";
                },
                children: [
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "true",
                    children: "Gambar"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "false",
                    children: "Text"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: "Mode cetakan gambar"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              children: /* @__PURE__ */ jsxDEV("select", {
                class: "form",
                name: "image-mode",
                value: data.defaultConfig.image,
                onInput: (e3) => {
                  data.defaultConfig.image = e3.target.value;
                },
                children: [
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "rastar",
                    children: "Rastar"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("option", {
                    value: "bit",
                    children: "Bit"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/Components/Calculator.tsx
var exps = [];
var temp = "";
var tempDisplay = "";
var input = "";
var listenKeyboard = true;
var setting = SettingService_default.get();
if (setting.keepScreenAwake !== false) {
  ScreenService_default.keepScreenAwake();
}
var SpeechService2 = SpeechService_default;
var printer = new LogPrinterService(setting.defaultConfig);
printer.init();
setting.apply(printer);
globalThis.printer = printer;
function Calculator() {
  const [isCheckView, openCheckView] = d2(false);
  const [showSetting, openSetting] = d2(false);
  const [isListening, setListening] = d2(false);
  const clickRef = A2((a3) => {});
  const inAudioCtxRef = A2(null);
  const inBufferRef = A2(null);
  const [printerStatus, setPrinterStatus] = d2("offline");
  const [showAC, setShowAC] = d2(true);
  const [operator, setOperator] = d2("");
  const [display, setDisplay] = d2("");
  const [checkIndex, setCheckIndex] = d2(-1);
  const requestPrinter = async () => {
    try {
      const d3 = new BluetoothPrinterService(setting.defaultConfig, {
        align: setting.align,
        font: {
          size: setting.defaultConfig.fontSize,
          fontFaceType: setting.defaultConfig.fontFace
        }
      });
      await d3.init();
      setting.apply(d3);
      if (printer) {
        printer.dispose();
      }
      printer = d3;
      globalThis.printer = printer;
      setPrinterStatus("online");
    } catch (e3) {
      console.log("ini printer:" + e3);
    }
  };
  const addResult = function(text, num) {
    const exp = [text, num];
    exps.push(exp);
    print(exp);
  };
  const isMultExp = (text) => text.indexOf("×") != -1 || text.indexOf("÷") != -1;
  const print = (exp) => {
    const index = exps.indexOf(exp);
    if (index === 0) {
      if (setting.deviceName) {
        printer?.printLine(setting.deviceName, {
          align: 1 /* center */
        });
        printer?.feed(printer.option.fontSize * 0.5);
      }
    }
    let text = exp[0];
    const sum = exp[1];
    if (text[0] === "+") {
      text = text.substring(1);
    }
    const isMult = isMultExp(text);
    if (isMult && index > 0 && !isMultExp(exps[index - 1][0])) {
      printer?.feed(printer.option.fontSize * 0.5);
    }
    if (setting.printOperator && setting.align == 2 /* right */) {
      text += ` ${isMult ? setting.defaultConfig.textAsImage ? " " : " " : "+"}`;
    }
    printer?.printLine(text);
    if (isMult) {
      let multSumText = "=" + formatNumber(sum || 0);
      if (setting.printOperator && setting.align == 2 /* right */) {
        multSumText += ` +`;
      }
      printer?.printLine(multSumText);
      printer?.feed(printer.option.fontSize * 0.5);
    }
  };
  const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: setting.maxDecimal });
  const formatNumber = (number) => {
    return numberFormat.format(number).replaceAll("-", "−");
  };
  const result = () => {
    let result2 = 0;
    for (const d3 of exps) {
      result2 = fixFloat(result2 + d3[1]);
    }
    return result2;
  };
  const fixFloat = (n2) => {
    return Number((n2 + Number.EPSILON).toFixed(15));
  };
  const handleClick = (value) => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    const ctx = inAudioCtxRef.current;
    const buffer = inBufferRef.current;
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
    switch (value) {
      case " ": {
        break;
      }
      case "⎙": {
        if (!printer || printer instanceof LogPrinterService) {
          requestPrinter();
          return;
        }
        let result2 = 0;
        if (exps.length > 1 && setting.deviceName) {
          printer?.printLine(setting.deviceName, {
            align: 1 /* center */
          });
          printer?.feed(printer.option.fontSize * 0.5);
        }
        for (const exp of exps) {
          print(exp);
          result2 += exp[1];
        }
        printer?.printSeparator("-");
        let resultText = formatNumber(result2);
        if (setting.printOperator && setting.align == 2 /* right */) {
          resultText += ` ${setting.defaultConfig.textAsImage ? " " : " "}`;
        }
        printer?.printLine(resultText);
        printer?.lineFeed(1);
        printer?.printSeparator("=");
        printer?.lineFeed(1);
        if (printer?.option.sharePrinter) {
          printer?.pause();
        }
        break;
      }
      case "⍐": {
        if (!printer) {
          return;
        }
        if (printer) {
          printer?.lineFeed();
        }
        break;
      }
      case "CE": {
        if (input) {
          input = "";
          setDisplay(input);
        }
        setTimeout(() => {
          setShowAC(true);
        }, 100);
        break;
      }
      case "AC": {
        temp = tempDisplay = input = "";
        setDisplay(formatNumber(Number(input)));
        exps.length = 0;
        setCheckIndex(exps.length);
        setOperator("");
        setShowAC(true);
        if (printer?.option.sharePrinter) {
          printer?.pause();
        }
        break;
      }
      case "=": {
        let ncheckIndex = checkIndex;
        if (input && input !== "-") {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          addResult(formatted, eval(temp + input));
          ncheckIndex = exps.length;
          temp = tempDisplay = input = "";
        }
        setOperator(value);
        const resultNumb = result();
        setDisplay(formatNumber(resultNumb));
        if (ncheckIndex >= exps.length && exps.length > 0) {
          temp = tempDisplay = input = "";
          printer?.printSeparator("-");
          let resultText = formatNumber(resultNumb);
          if (setting.printOperator && setting.align == 2 /* right */) {
            resultText += ` ${setting.defaultConfig.textAsImage ? " " : " "}`;
          }
          printer?.printLine(resultText);
          printer?.printSeparator("=");
          printer?.lineFeed(1);
          if (printer?.option.sharePrinter) {
            printer?.pause();
          }
        }
        setCheckIndex(exps.length);
        setShowAC(true);
        break;
      }
      case "⌫": {
        if (input) {
          input = input.substring(0, input.length - 1);
        }
        if (input === "-") {
          input = "";
        }
        let display2 = "";
        let inputn = Number(input);
        const isZero = "0.".includes(input[input.length - 1]);
        if (isZero && input.indexOf(".") != -1) {
          inputn = Number(input + "1");
          display2 = formatNumber(inputn);
          display2 = display2.substring(0, display2.length - 1);
        } else {
          display2 = formatNumber(inputn);
        }
        setDisplay(display2);
        break;
      }
      case "%": {
        if (!input || input === "-") {
          return;
        }
        const numb = Number(input);
        if (isNaN(numb) || numb === 0) {
          return;
        }
        if (exps.length > 0) {
          const r = result();
          const formatted = `${r}×${tempDisplay}${formatNumber(parseFloat(input))}%`;
          addResult(formatted, eval(`(${temp + input}) * ${r}/100`));
          setCheckIndex(exps.length);
          input = temp = tempDisplay = "";
          setOperator("+");
          setDisplay(formatNumber(result()));
        } else {
          const decimal = input.split(".")[1];
          if (decimal && decimal.length + 2 > setting.maxDecimal) {
            return;
          }
          input = "" + fixFloat(parseFloat(input) / 100).toFixed(setting.maxDecimal).replace(/0+$/, "");
          setDisplay(formatNumber(Number(input)));
        }
        break;
      }
      case "÷": {
        if ((!input || input === "-") && temp.length <= 1) {
          return;
        }
        if (temp.length > 0 && temp[temp.length - 1] == "*") {
          tempDisplay = tempDisplay.substring(0, tempDisplay.length - 1) + value;
          temp = temp.substring(0, temp.length - 1) + "/";
        }
        if (input) {
          setDisplay(formatNumber(Number(input)));
          tempDisplay += formatNumber(Number(input)) + "÷";
          temp += input + "/";
        }
        input = "";
        setOperator(value);
        break;
      }
      case "×": {
        if ((!input || input === "-") && temp.length <= 1) {
          return;
        }
        if (temp.length > 0 && temp[temp.length - 1] == "/") {
          tempDisplay = tempDisplay.substring(0, tempDisplay.length - 1) + value;
          temp = temp.substring(0, temp.length - 1) + "*";
        }
        if (input) {
          setDisplay(formatNumber(Number(input)));
          tempDisplay += formatNumber(Number(input)) + "×";
          temp += input + "*";
        }
        input = "";
        setOperator(value);
        break;
      }
      case "±": {
        if (!input)
          return;
        if (input[0] !== "-") {
          input = "-" + input;
          setDisplay("−" + display);
        } else {
          input = input.substring(1);
          setDisplay(display.substring(1));
        }
        break;
      }
      case "−": {
        if (input && input !== "-") {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          addResult(formatted, eval(temp + input));
          input = "";
          temp = "-";
          tempDisplay = "−";
          setDisplay(formatNumber(result()));
          setOperator(value);
        } else {
          if (temp == "-") {
            temp = tempDisplay = "";
          }
          input = "-";
          setDisplay("−");
          if (operator === "−") {
            setOperator("+");
          }
        }
        setCheckIndex(exps.length);
        break;
      }
      case "+": {
        if (input && input !== "-") {
          const formatted = tempDisplay + formatNumber(parseFloat(input));
          addResult(formatted, eval(temp + input));
          input = "";
        }
        setCheckIndex(exps.length);
        temp = tempDisplay = "";
        setOperator(value);
        setDisplay(formatNumber(result()));
        break;
      }
      case "△": {
        if (exps.length === 0)
          return;
        let dIndex = checkIndex;
        if (dIndex === 0) {
          dIndex = exps.length - 1;
          setCheckIndex(dIndex);
        } else {
          dIndex--;
          setCheckIndex(dIndex);
        }
        let d3 = exps[dIndex][0];
        if (d3[0] === "+") {
          d3 = d3.substring(1);
        }
        input = "";
        setOperator("");
        setDisplay(d3);
        break;
      }
      case "▽": {
        if (exps.length === 0)
          return;
        let dIndex = checkIndex;
        if (checkIndex >= exps.length - 1) {
          dIndex = 0;
          setCheckIndex(dIndex);
        } else {
          dIndex++;
          setCheckIndex(dIndex);
        }
        let d3 = exps[dIndex][0];
        if (d3[0] === "+") {
          d3 = d3.substring(1);
        }
        input = "";
        setOperator("");
        setDisplay(d3);
        break;
      }
      case ".": {
        if (operator === "=") {
          exps.length = 0;
          setCheckIndex(exps.length);
          temp = tempDisplay = "";
          setOperator("");
        }
        if (input.indexOf(".") != -1) {
          return;
        }
        if (!input || input === "-") {
          value = "0" + value;
        }
        input += value;
        let display2 = formatNumber(Number(input + "1"));
        display2 = display2.substring(0, display2.length - 1);
        setDisplay(display2);
        setShowAC(false);
        break;
      }
      case "CHECK": {
        openCheckView(true);
        break;
      }
      case "⚙": {
        listenKeyboard = false;
        openSetting((o3) => !o3);
        break;
      }
      default: {
        if (operator === "=") {
          exps.length = 0;
          setCheckIndex(exps.length);
          temp = tempDisplay = "";
          setOperator("");
        }
        const isZero = value[0] === "0";
        if (isZero && (!input || input === "-")) {
          input = "";
          setDisplay("");
          setShowAC(false);
          return;
        }
        const numbParts = input.split(".");
        const isDecimal = input.indexOf(".") != -1;
        if (isDecimal) {
          if (numbParts[1].length + value.length + (isZero ? 1 : 0) > setting.maxDecimal) {
            return;
          }
        } else {
          if (numbParts[0].length + value.length > setting.maxDigit) {
            return;
          }
        }
        input += value;
        let display2 = "";
        let inputn = Number(input);
        if (isZero && isDecimal) {
          inputn = Number(input + "1");
          display2 = formatNumber(inputn);
          display2 = display2.substring(0, display2.length - 1);
        } else {
          display2 = formatNumber(inputn);
        }
        setDisplay(display2);
        setShowAC(false);
        break;
      }
    }
  };
  clickRef.current = handleClick;
  const handleKeyDown = (e3) => {
    if (e3.target?.tagName == "INPUT" || !listenKeyboard) {
      return;
    }
    let key = e3.key;
    if (e3.shiftKey) {
      switch (key) {
        case "Backspace": {
          key = showAC ? "AC" : "CE";
          break;
        }
        case "ArrowUp": {
          key = "⍐";
          break;
        }
      }
    }
    switch (key) {
      case "*": {
        key = "×";
        break;
      }
      case "/": {
        key = "÷";
        break;
      }
      case "-": {
        key = "−";
        break;
      }
      case "Enter": {
        key = "=";
        break;
      }
      case "Backspace": {
        key = "⌫";
        break;
      }
      case "ArrowUp": {
        key = "△";
        break;
      }
      case "ArrowDown": {
        key = "▽";
        break;
      }
    }
    if (buttons.includes(key)) {
      handleClick(key);
    }
  };
  const inputBatch = (tokens) => {
    if (!tokens)
      return;
    for (let token of tokens) {
      switch (token) {
        case "*": {
          token = "×";
          break;
        }
        case "/": {
          token = "÷";
          break;
        }
        case "-": {
          token = "−";
          break;
        }
      }
      if ("0123456789.+−×÷%=".includes(token)) {
        clickRef.current(token);
      }
    }
  };
  const handlePaste = (e3) => {
    if (e3.target?.tagName == "INPUT") {
      return;
    }
    const pastedText = e3.clipboardData?.getData("text");
    inputBatch(pastedText);
  };
  const buttons = [
    "⎙",
    "⍐",
    "CHECK",
    "☊",
    "AC",
    "CE",
    "%",
    "÷",
    "⌫",
    "7",
    "8",
    "9",
    "×",
    "4",
    "5",
    "6",
    "−",
    "1",
    "2",
    "3",
    "+",
    "0",
    setting.show3Zero ? "000" : "00",
    ".",
    "="
  ];
  y2(() => {
    inAudioCtxRef.current = new AudioContext;
    fetch("assets/audio/click-in.mp3").then((res) => res.arrayBuffer()).then((arrayBuffer) => inAudioCtxRef.current.decodeAudioData(arrayBuffer)).then((decoded) => {
      inBufferRef.current = decoded;
    });
  }, []);
  const divRef = A2(null);
  y2(() => {
    divRef.current?.focus();
  }, []);
  y2(() => {
    const container = divRef.current?.querySelector(".result-container");
    if (container && container.scrollWidth > container.clientWidth) {
      container.scrollLeft = container.scrollWidth;
    }
  }, [display]);
  const rHandlers = useLongPress({
    onClick: () => {},
    onHold: () => clickRef.current("⚙"),
    repeat: false,
    delay: 800
  });
  return /* @__PURE__ */ jsxDEV("div", {
    ref: divRef,
    tabIndex: -1,
    onKeyDown: handleKeyDown,
    onPaste: handlePaste,
    style: {
      height: "100dvh",
      display: "flex",
      userSelect: "none",
      touchAction: "manipulation",
      overflow: "hidden",
      flexDirection: "column",
      fontFamily: "sans-serif"
    },
    children: [
      /* @__PURE__ */ jsxDEV("div", {
        ...rHandlers,
        style: {
          fontSize: "2.5rem",
          display: "grid",
          gridTemplateColumns: "1fr 1.5rem",
          minHeight: "4rem",
          lineHeight: "4rem",
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #ccc"
        },
        children: [
          /* @__PURE__ */ jsxDEV("div", {
            class: "result-container",
            style: {
              textAlign: "right",
              overflow: "auto",
              padding: "1rem 0 1rem 1rem"
            },
            children: display || "0"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("div", {
            style: {
              textAlign: "center",
              color: "#888",
              fontSize: "1.5rem",
              lineHeight: "4"
            },
            children: operator
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV("span", {
        style: {
          position: "absolute",
          left: "4px",
          top: "4px",
          color: "#888",
          fontSize: "1rem"
        },
        children: [
          checkIndex < exps.length && exps.length > 0 && /* @__PURE__ */ jsxDEV("span", {
            children: [
              checkIndex + 1,
              "/"
            ]
          }, undefined, true, undefined, this),
          exps.length
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV("div", {
        style: {
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "0.5fr 0.5fr repeat(4, 1fr)",
          gridAutoRows: "1fr",
          gap: "1px",
          background: "#ccc"
        },
        children: buttons.map((b, index) => {
          let show = true;
          let color = "black";
          let gridRow = "";
          let isNumber2 = "0123456789.".includes(b[0]);
          let fontSize = isNumber2 && b.length < 3 ? "2.5rem" : "2rem";
          let handlers = {
            onClick: () => clickRef.current(b)
          };
          switch (b) {
            case "AC": {
              color = "red";
              show = showAC;
              fontSize = "1.5rem";
              break;
            }
            case "CE": {
              show = !showAC;
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current("AC"),
                repeat: false,
                delay: 400,
                interval: 400
              });
              break;
            }
            case "⎙": {
              fontSize = "1.5rem";
              if (printerStatus != "online") {
                color = "red";
              }
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => {
                  if (printer) {
                    const d3 = printer;
                    printer = undefined;
                    d3.disconnect();
                    setPrinterStatus("offline");
                  } else {
                    requestPrinter();
                  }
                },
                repeat: false,
                delay: 1000
              });
              break;
            }
            case "⌫": {
              fontSize = "1.5rem";
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 100
              });
              break;
            }
            case "⍐": {
              fontSize = "1.5rem";
              if (printerStatus != "online") {
                color = "red";
              }
              handlers = useLongPress({
                onClick: () => handleClick(b),
                onHold: () => handleClick(b),
                repeat: true,
                delay: 400,
                interval: 100
              });
              break;
            }
            case "▽": {
              fontSize = "1.5rem";
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 800
              });
              break;
            }
            case "△": {
              fontSize = "1.5rem";
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 800
              });
              break;
            }
            case "CHECK": {
              fontSize = "1rem";
              break;
            }
            case "%": {
              fontSize = "1.5rem";
              break;
            }
            case "☊": {
              handlers = {
                onClick: async () => {
                  if (SpeechService2.isListening) {
                    SpeechService2.stop();
                    return;
                  }
                  try {
                    await SpeechService2.requestPermission();
                    const rprom = SpeechService2.recognize();
                    setTimeout(() => {
                      listenKeyboard = false;
                      setListening(true);
                    }, 100);
                    const result2 = await rprom;
                    if (!result2) {
                      return;
                    }
                    console.log(result2);
                    const calcCommand = CalcParser(result2);
                    console.log(calcCommand);
                    if (input) {
                      clickRef.current("+");
                    }
                    inputBatch(calcCommand);
                  } catch {} finally {
                    listenKeyboard = true;
                    setListening(false);
                  }
                }
              };
              break;
            }
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9": {
              handlers = useLongPress({
                onClick: () => clickRef.current(b),
                onHold: () => clickRef.current(b),
                repeat: true,
                delay: 400,
                interval: 100
              });
              break;
            }
          }
          return show && /* @__PURE__ */ jsxDEV("button", {
            class: "press-button",
            style: {
              fontSize,
              gridColumn: gridRow,
              fontWeight: isNumber2 ? "bold" : "normal",
              padding: 0,
              border: "none",
              color,
              height: "100%",
              width: "100%"
            },
            ...handlers,
            children: b
          }, b, false, undefined, this);
        })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(BottomPopup_default, {
        isOpen: isCheckView,
        hideClose: true,
        contentStyle: { height: "calc(100dvh - 6rem)", backgroundColor: "#f0f0f0", padding: "1rem 0" },
        onClose: () => {
          openCheckView(false);
        },
        children: [
          /* @__PURE__ */ jsxDEV("h4", {
            style: { textAlign: "center", margin: "0 0 1rem 0", fontSize: "1rem" },
            children: "CHECK"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("div", {
            style: { overflow: "auto", height: "calc(100% - 2rem)", padding: "0 1rem" },
            children: /* @__PURE__ */ jsxDEV("div", {
              style: {
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "1.5rem 0.5rem",
                fontSize: "2rem",
                textAlign: "right"
              },
              children: exps.map((exp, i3) => {
                const isMult = exp[0].indexOf("×") != -1 || exp[0].indexOf("÷") != -1;
                return /* @__PURE__ */ jsxDEV(k, {
                  children: [
                    /* @__PURE__ */ jsxDEV("div", {
                      children: [
                        exp[0],
                        isMult && /* @__PURE__ */ jsxDEV("span", {
                          children: [
                            /* @__PURE__ */ jsxDEV("br", {}, undefined, false, undefined, this),
                            "=",
                            formatNumber(exp[1])
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    /* @__PURE__ */ jsxDEV("div", {
                      style: {
                        color: "#888",
                        fontSize: "1rem",
                        lineHeight: "2.2rem"
                      },
                      children: i3 + 1
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this);
              })
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(SettingPopup, {
        isOpen: showSetting,
        onClose: (set) => {
          if (printer) {
            set.apply(printer);
          }
          setting = set;
          openSetting(false);
          listenKeyboard = true;
        }
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(BottomPopup_default, {
        isOpen: isListening,
        hideClose: true,
        onClose: () => {
          listenKeyboard = true;
          SpeechService2.stop();
        },
        children: /* @__PURE__ */ jsxDEV("h4", {
          style: { textAlign: "center", margin: "0 0 1rem 0", fontSize: "1rem" },
          children: "Listening"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/App.tsx
function App() {
  return /* @__PURE__ */ jsxDEV(Calculator, {}, undefined, false, undefined, this);
}

// src/index.ts
window.matht = CalcParser;
G(_(App, null), document.getElementById("app"));
