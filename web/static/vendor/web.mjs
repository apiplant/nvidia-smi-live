import { createRenderEffect, createMemo, sharedConfig, enableHydration, untrack, runWithOwner, createRoot, flatten, flush, getOwner, createOwner, patchableRaw, storeHasOptimisticFamily, storeIsShallow, registerRowOps, registerSlotPatch, onCleanup, registerPatch, createComponent, omit, createSignal, createEffect } from './solid-js.mjs';
export { Errored, For, Hydration, Loading, Match, NoHydration, Repeat, Reveal, Show, Switch, createComponent, getOwner, merge as mergeProps, untrack } from './solid-js.mjs';

const DOMWithState = {
  INPUT: {
    value: 1,
    defaultValue: 2,
    checked: 1,
    defaultChecked: 2
  },
  SELECT: {
    value: 1
  },
  OPTION: {
    value: 1,
    selected: 1,
    defaultSelected: 2
  },
  TEXTAREA: {
    value: 1,
    defaultValue: 2
  },
  VIDEO: {
    muted: 1,
    defaultMuted: 2
  },
  AUDIO: {
    muted: 1,
    defaultMuted: 2
  }
};
const ChildProperties = /*#__PURE__*/new Set(["innerHTML", "textContent", "innerText", "children"]);
const $$SLOT = /*#__PURE__*/Symbol("slot");
const $$HOST = /*#__PURE__*/Symbol("host");
const DelegatedEvents = /*#__PURE__*/new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]);
const SVGElements = /*#__PURE__*/new Set([
"altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect",
"set", "stop",
"svg", "switch", "symbol", "text", "textPath",
"tref", "tspan", "use", "view", "vkern"]);
const MathMLElements = /*#__PURE__*/new Set(["annotation", "annotation-xml", "maction", "math", "menclose", "merror", "mfenced", "mfrac", "mi", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mprescripts", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msubsup", "msup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "semantics"]);
const Namespaces = {
  svg: "http://www.w3.org/2000/svg",
  mathml: "http://www.w3.org/1998/Math/MathML",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
const VoidElements = /*#__PURE__*/new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RawTextElements = /*#__PURE__*/new Set(["style", "script", "noscript", "template", "textarea", "title"]);
const DOMElements = /*#__PURE__*/new Set(/*#__PURE__*/"a,abbr,acronym,address,applet,area,article,aside,audio,b,base,basefont,bdi,bdo,bgsound,big,blink,blockquote,body,br,button,canvas,caption,center,cite,code,col,colgroup,content,data,datalist,dd,del,details,dfn,dialog,dir,div,dl,dt,em,embed,fieldset,figcaption,figure,font,footer,form,frame,frameset,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,image,img,input,ins,isindex,kbd,keygen,label,legend,li,link,listing,main,map,mark,marquee,math,menu,menuitem,meta,meter,multicol,nav,nextid,nobr,noembed,noframes,noindex,noscript,object,ol,optgroup,option,output,p,param,picture,plaintext,portal,pre,progress,q,rb,rp,rt,rtc,ruby,s,samp,script,search,section,select,shadow,slot,small,source,spacer,span,strike,strong,style,sub,summary,sup,svg,table,tbody,td,template,textarea,tfoot,th,thead,time,title,tr,track,tt,u,ul,var,video,wbr,webview,xmp".split(","));

const transparentOptions = {
  transparent: true,
  sync: true
};
const syncOptions = {
  sync: true
};
function effect(fn, effectFn, options) {
  createRenderEffect(fn, effectFn, options ? {
    sync: true,
    ...options,
    transparent: !options.scope
  } : transparentOptions);
}
function memo(fn) {
  return createMemo(() => fn(), syncOptions);
}

function reconcileArrays(parentNode, a, b, marker) {
  let bLength = b.length,
    aEnd = a.length,
    bEnd = bLength,
    aStart = 0,
    bStart = 0,
    tail = a[aEnd - 1],
    tailTag = tail[$$SLOT],
    after = tail.parentNode === parentNode && (!tailTag || tailTag === marker) ? tail.nextSibling : marker || null,
    map = null,
    anchor,
    anchorTag;
  const isLive = n => {
    if (!n) return false;
    const tag = n[$$SLOT];
    return n.parentNode === parentNode && (!tag || tag === marker);
  };
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart] && isLive(a[aStart])) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1] && isLive(a[aEnd - 1])) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      let node;
      if (bEnd < bLength) {
        if (bStart) {
          const prev = b[bStart - 1];
          const prevTag = prev[$$SLOT];
          node = prev.parentNode === parentNode && (!prevTag || prevTag === marker) ? prev.nextSibling : after;
        } else node = b[bEnd - bStart];
      } else node = after;
      while (bStart < bEnd) {
        const n = b[bStart++];
        parentNode.insertBefore(n, node);
        if (marker) n[$$SLOT] = marker;
      }
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        const n = a[aStart++];
        if (!map || !map.has(n)) {
          const tag = n[$$SLOT];
          if (n.parentNode === parentNode && (!tag || tag === marker)) n.remove();
        }
      }
    } else if ((anchor = a[aStart]) === b[bEnd - 1] && b[bStart] === a[aEnd - 1] && anchor.parentNode === parentNode && (!(anchorTag = anchor[$$SLOT]) || anchorTag === marker)) {
      if (marker) {
        do {
          const n = a[--aEnd];
          parentNode.insertBefore(n, anchor);
          n[$$SLOT] = marker;
          bStart++;
          if (aStart >= aEnd - 1 || bStart >= bEnd) break;
        } while (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]);
      } else {
        do {
          parentNode.insertBefore(a[--aEnd], anchor);
          bStart++;
          if (aStart >= aEnd - 1 || bStart >= bEnd) break;
        } while (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]);
      }
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
            sequence = 1,
            t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const head = a[aStart];
            const headTag = head[$$SLOT];
            const node = head.parentNode === parentNode && (!headTag || headTag === marker) ? head : after;
            while (bStart < index) {
              const n = b[bStart++];
              parentNode.insertBefore(n, node);
              if (marker) n[$$SLOT] = marker;
            }
          } else {
            const oldNode = a[aStart++];
            const newNode = b[bStart++];
            const oldTag = oldNode[$$SLOT];
            if (oldNode.parentNode === parentNode && (!oldTag || oldTag === marker)) {
              parentNode.replaceChild(newNode, oldNode);
            } else {
              parentNode.insertBefore(newNode, after);
            }
            if (marker) newNode[$$SLOT] = marker;
          }
        } else aStart++;
      } else {
        const n = a[aStart++];
        const nTag = n[$$SLOT];
        if (n.parentNode === parentNode && (!nTag || nTag === marker)) n.remove();
      }
    }
  }
}

const HEAD_ELIGIBLE_TAGS = new Set(["title", "meta", "link", "style", "script", "base"]);
const HEAD_ATTR_NAME = /^[a-zA-Z_][a-zA-Z0-9_:.-]*$/;
const RESOURCE_LINK_RELS = new Set(["preload", "modulepreload", "prefetch", "preconnect", "dns-prefetch", "stylesheet"]);
const RESOURCE_QUALIFIERS = ["as", "crossorigin", "type", "media", "imagesrcset", "imagesizes"];
const STYLESHEET_FETCH_META = new Set(["crossorigin", "integrity", "referrerpolicy", "fetchpriority"]);
function evalHeadValue(v) {
  return typeof v === "function" ? v() : v;
}
function evalHeadProps(props, presets) {
  const out = {};
  for (const name in props) out[name] = presets && name in presets ? presets[name] : evalHeadValue(props[name]);
  return out;
}
function classifyHeadTag(desc) {
  const tag = desc.tag;
  if (tag === "link") {
    const rel = evalHeadValue(desc.props && desc.props.rel);
    return {
      resource: RESOURCE_LINK_RELS.has(rel),
      rel
    };
  }
  if (tag === "style") return {
    resource: !!(desc.props && "href" in desc.props)
  };
  if (tag === "script") return {
    resource: !!(desc.props && "src" in desc.props)
  };
  return {
    resource: false
  };
}
function resourceIdentity(tag, props) {
  let id = "res:" + tag + ":" + (props.rel || "") + ":" + (props.href || props.src || "");
  for (let i = 0; i < RESOURCE_QUALIFIERS.length; i++) {
    const q = RESOURCE_QUALIFIERS[i];
    if (props[q] != null) id += ":" + q + "=" + props[q];
  }
  return id;
}
function replaceableIdentity(tag, props, key, unique) {
  if (tag === "title") return "title";
  if (tag === "base") return "base";
  if (tag === "meta" && props.charset != null) return "charset";
  if (key != null) return tag + ":key:" + key;
  if (tag === "meta") {
    for (const ns of ["name", "property", "http-equiv"]) if (props[ns] != null) return "meta:" + ns + ":" + props[ns] + (props.media != null ? ":media=" + props.media : "");
    return unique;
  }
  if (tag === "link") {
    const rel = props.rel || "";
    if (rel === "icon" || rel === "apple-touch-icon") return "link:" + rel + (props.sizes != null ? ":sizes=" + props.sizes : "") + (props.type != null ? ":type=" + props.type : "");
    return "link:" + rel + ":" + (props.href || "");
  }
  return unique;
}
function resolveHead(groups) {
  const winners = new Map();
  const sorted = groups.slice().sort((a, b) => a.seq - b.seq);
  for (let i = 0; i < sorted.length; i++) {
    const group = sorted[i];
    const byIdentity = new Map();
    for (let j = 0; j < group.tags.length; j++) {
      const t = group.tags[j];
      let list = byIdentity.get(t.identity);
      if (!list) byIdentity.set(t.identity, list = []);
      list.push(t);
    }
    for (const [identity, tags] of byIdentity) {
      if (identity === "title") {
        winners.set(identity, {
          seq: group.seq,
          tags: [tags[tags.length - 1]]
        });
      } else {
        winners.set(identity, {
          seq: group.seq,
          tags
        });
      }
    }
  }
  return winners;
}

function parseCookieHeader(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = decodeSafe(part.slice(0, eq).trim());
    let value = part.slice(eq + 1).trim();
    if (value.length > 1 && value[0] === '"' && value[value.length - 1] === '"') {
      value = value.slice(1, -1);
    }
    cookies[name] = decodeSafe(value);
  }
  return cookies;
}
function decodeSafe(text) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
function serializeCookie(name, value, options = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookie += `; Path=${options.path === undefined ? "/" : options.path}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${Math.trunc(options.maxAge)}`;
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) cookie += "; HttpOnly";
  if (options.secure) cookie += "; Secure";
  if (options.sameSite) {
    const sameSite = options.sameSite.toLowerCase();
    cookie += `; SameSite=${sameSite === "none" ? "None" : sameSite === "strict" ? "Strict" : "Lax"}`;
  }
  return cookie;
}
const FLASH_COOKIE = "flash";
const FLASH_MATCHER = new RegExp(`(?:^|;\\s*)${FLASH_COOKIE}=([^;]+)`);
function hasFlashCookie(cookieHeader) {
  return !!cookieHeader && FLASH_MATCHER.test(cookieHeader);
}
function clearFlashCookie() {
  return `${FLASH_COOKIE}=; Max-Age=0; Path=/`;
}

const SERVER_FUNCTION_METADATA = Symbol.for("solid.ServerFunctionMetadata");
function getServerFunctionMetadata(fn) {
  if (typeof fn !== "function") return undefined;
  return fn[SERVER_FUNCTION_METADATA] || undefined;
}
function isServerFunction(fn) {
  return typeof fn === "function" && !!fn[SERVER_FUNCTION_METADATA];
}
const SERVER_FUNCTION_RPC = Symbol.for("solid.ServerFunctionRPC");
function getServerFunctionRPC() {
  return globalThis[SERVER_FUNCTION_RPC];
}

const assetGates = new WeakMap();
const waitAsset = promise => {
  let gate = assetGates.get(promise);
  if (!gate) {
    runWithOwner(null, () => {
      gate = createMemo(() => promise);
    });
    assetGates.set(promise, gate);
  }
  gate();
};
let listDriver;
function installListDriver(driver) {
  listDriver = driver;
}
const $$EVENT_OWNER = "_$SOLID_EVENT_OWNER";
const INNER_OWNED = {};
const delegatedEvents = new Set();
const delegatedContainers = new Map();
function voidFn() {}
function generateHydrationScript(_options) {
  return "";
}
function HydrationScript(_props) {
  return null;
}
const getRequestEvent = voidFn;
function render(code, element, init, options = {}) {
  let disposer;
  registerDelegatedRoot(element);
  try {
    createRoot(dispose => {
      disposer = dispose;
      if (element === document) {
        const tree = code();
        effect(() => flatten(tree), () => {});
      } else {
        const tree = code();
        insert(element, () => tree, element.firstChild ? null : undefined, init, {
          ...options.insertOptions,
          schedule: true
        });
      }
    }, {
      id: options.renderId
    });
    flush();
  } catch (err) {
    if (disposer) disposer();
    unregisterDelegatedRoot(element);
    throw err;
  } finally {
  }
  return () => {
    disposer();
    unregisterDelegatedRoot(element);
    element.textContent = "";
  };
}
function create(html, bypassGuard, flag) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return flag === 2 ? t.content.firstChild.firstChild : t.content.firstChild;
}
function template(html, flag) {
  let node;
  const fn = flag === 1 ? bypassGuard => document.importNode(node || (node = create(html, bypassGuard, flag)), true) : bypassGuard => (node || (node = create(html, bypassGuard, flag))).cloneNode(true);
  return fn;
}
function delegateEvents(eventNames) {
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!delegatedEvents.has(name)) {
      delegatedEvents.add(name);
      delegatedContainers.forEach((state, container) => attachDelegatedEvent(name, container, state));
    }
  }
}
function registerDelegatedRoot(root) {
  const state = registerDelegatedContainer(root, root);
  if (state) state.roots = (state.roots || 0) + 1;
}
function unregisterDelegatedRoot(root) {
  const state = delegatedContainers.get(root);
  if (state) state.roots > 1 ? state.roots-- : delete state.roots;
  unregisterDelegatedContainer(root, root);
}
function registerDelegatedContainer(container, owner = container) {
  if (!container || !owner) return;
  let state = delegatedContainers.get(container);
  if (!state) delegatedContainers.set(container, state = {
    owners: new Map(),
    handlers: new Map()
  });
  state.owners.set(owner, (state.owners.get(owner) || 0) + 1);
  delegatedEvents.forEach(name => attachDelegatedEvent(name, container, state));
  return state;
}
function unregisterDelegatedContainer(container, owner = container) {
  const state = delegatedContainers.get(container);
  if (!state) return;
  const count = state.owners.get(owner);
  if (count > 1) state.owners.set(owner, count - 1);else state.owners.delete(owner);
  if (state.owners.size) return;
  state.handlers.forEach((handler, name) => container.removeEventListener(name, handler));
  delegatedContainers.delete(container);
}
function attachDelegatedEvent(name, container, state) {
  if (state.handlers.has(name)) return;
  const handler = e => eventHandler(e, container, state);
  state.handlers.set(name, handler);
  container.addEventListener(name, handler);
}
function getDelegatedRoot(node) {
  while (node) {
    if (delegatedContainers.get(node)?.roots) return node;
    node = node._$host || node.parentNode || node.host;
  }
}
function findOwner(target, state) {
  let node = target;
  let distance = 0;
  while (node) {
    if (state.owners.has(node)) return {
      owner: node,
      distance
    };
    distance++;
    node = node._$host || node.parentNode || node.host;
  }
}
function setProperty(node, name, value) {
  if (isHydrating(node)) return;
  node[name] = value;
}
let claimHandlers = null;
const CLAIM_SEAM = Symbol.for("solid.element-claims");
function registerElementClaim(handler) {
  (claimHandlers || (claimHandlers = globalThis[CLAIM_SEAM] = [])).push(handler);
  return () => {
    const index = claimHandlers.indexOf(handler);
    index > -1 && claimHandlers.splice(index, 1);
  };
}
const CLAIMED_ELEMENTS = "a[href], form[action]";
function claimElementTree(root) {
  const handlers = globalThis[CLAIM_SEAM];
  if (handlers === undefined || handlers.length === 0) return root;
  const isElement = root.nodeType === 1;
  if (!isElement && root.nodeType !== 11) return root;
  if (isElement && root.matches(CLAIMED_ELEMENTS)) {
    for (let i = 0; i < handlers.length; i++) handlers[i](root);
  }
  const found = root.querySelectorAll(CLAIMED_ELEMENTS);
  for (let i = 0; i < found.length; i++) {
    for (let j = 0; j < handlers.length; j++) handlers[j](found[i]);
  }
  return root;
}
function claimElement(node) {
  if (claimHandlers !== null) {
    for (let i = 0; i < claimHandlers.length; i++) claimHandlers[i](node);
  }
  return node;
}
function setAttribute(node, name, value) {
  if (isHydrating(node)) return;
  if (value == null || value === false) node.removeAttribute(name);else node.setAttribute(name, value === true ? "" : value);
  if (claimHandlers !== null && (name === "href" || name === "action")) claimElement(node);
}
function setAttributeNS(node, namespace, name, value) {
  if (isHydrating(node)) return;
  if (value == null || value === false) node.removeAttributeNS(namespace, name.indexOf(":") > -1 ? name.split(":").pop() : name);else node.setAttributeNS(namespace, name, value === true ? "" : value);
}
function className(node, value, prev) {
  if (isHydrating(node)) return;
  if (value == null || value === false) {
    prev && node.removeAttribute("class");
    return;
  }
  if (typeof value === "string") {
    value !== prev && node.setAttribute("class", value);
    return;
  }
  if (typeof prev === "string") {
    prev = {};
    node.removeAttribute("class");
  } else prev = classListToObject(prev || {});
  value = classListToObject(value);
  const classKeys = Object.keys(value || {});
  const prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    node.classList.remove(key);
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    node.classList.add(key);
  }
}
function addEvent(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = e => handlerFn.call(node, handler[1], e));
  } else node.addEventListener(name, handler, typeof handler !== "function" && handler);
}
function style(node, value, prev) {
  if (!value) {
    if (prev || node._$styles) {
      setAttribute(node, "style");
      node._$styles = undefined;
    }
    return;
  }
  const nodeStyle = node.style;
  if (typeof value === "string") {
    node._$styles = undefined;
    return nodeStyle.cssText = value;
  }
  if (typeof prev === "string") {
    nodeStyle.cssText = "";
    prev = undefined;
  }
  let applied = node._$styles;
  if (!applied) {
    applied = node._$styles = prev ? {
      ...prev
    } : {};
  }
  let v, s;
  for (s in applied) {
    if (value[s] == null) {
      nodeStyle.removeProperty(s);
      delete applied[s];
    }
  }
  for (s in value) {
    v = value[s];
    if (v != null && v !== applied[s]) {
      nodeStyle.setProperty(s, v);
      applied[s] = v;
    }
  }
}
function setStyleProperty(node, name, value) {
  value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
}
function spread(node, props = {}, skipChildren) {
  const prevProps = {};
  if (!skipChildren) insert(node, () => props.children);
  effect(() => {
    const r = props.ref;
    (typeof r === "function" || Array.isArray(r)) && ref(() => r, node);
  }, () => {});
  effect(() => {
    const newProps = {};
    for (const prop in props) {
      if (prop === "children" || prop === "ref") continue;
      newProps[prop] = props[prop];
    }
    return newProps;
  }, props => assign(node, props, true, prevProps, true));
  return prevProps;
}
function dynamicProperty(props, key) {
  const src = props[key];
  Object.defineProperty(props, key, {
    get() {
      return src();
    },
    enumerable: true
  });
  return props;
}
function applyRef(r, element) {
  Array.isArray(r) ? r.flat(Infinity).forEach(f => f && f(element)) : r(element);
}
function ref(fn, element) {
  const resolved = untrack(fn);
  runWithOwner(null, () => applyRef(resolved, element));
}
function scope(fn) {
  fn.$s = true;
  return fn;
}
const SCOPE_OPTIONS = {
  scope: true
};
let hydrationRt = null;
function installHydrationRuntime() {
  hydrationRt = {
    claimInitial(parent, multi, initial) {
      if (isHydrating(parent)) {
        if (!multi && initial === undefined && parent) initial = [...parent.childNodes];
        if (Array.isArray(initial)) stripTextSeparators(initial);
      }
      return initial;
    },
    reclaimRegion(current, parent, marker) {
      if (!sharedConfig.hydrating || !current || !parent.isConnected) return current;
      const first = Array.isArray(current) ? current[0] : current;
      if (!first || !first.nodeType || first.isConnected) return current;
      let nodes;
      if (marker) {
        nodes = [];
        let node = marker.previousSibling,
          depth = 0;
        while (node) {
          if (node.nodeType === 8) {
            const v = node.nodeValue;
            if (v === "/") depth++;else if (v === "$") {
              if (depth === 0) break;
              depth--;
            }
          }
          nodes.unshift(node);
          node = node.previousSibling;
        }
      } else nodes = [...parent.childNodes];
      return stripTextSeparators(nodes);
    },
    dedupEvent(e) {
      return !!(sharedConfig.registry && sharedConfig.events && sharedConfig.events.find(([el, ev]) => ev === e));
    }
  };
}
function stripTextSeparators(nodes) {
  let j = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i],
      t = node.nodeType;
    if (t === 8) {
      const v = node.nodeValue;
      if (v === "!$") {
        node.remove();
        continue;
      }
      if (v.startsWith("pl-")) continue;
    } else if (t === 1 && node.localName === "template" && node.id.startsWith("pl-")) continue;
    nodes[j++] = node;
  }
  nodes.length = j;
  return nodes;
}
function insert(parent, accessor, marker, initial, options) {
  const multi = marker !== undefined;
  const host = options && options.host;
  if (multi && !initial) initial = [];
  if (hydrationRt !== null) initial = hydrationRt.claimInitial(parent, multi, initial);
  if (listDriver !== undefined && typeof accessor === "function" && accessor.$ll !== undefined) {
    const listAccessor = accessor;
    const owner = getOwner();
    if (listDriver(parent, accessor, marker, () => runWithOwner(owner, () => insert(parent, () => listAccessor(), marker, marker !== undefined ? [] : undefined, options)))) return;
  }
  if (typeof accessor !== "function") {
    accessor = normalize(accessor, initial, multi, true);
    if (typeof accessor !== "function") {
      insertExpression(parent, accessor, initial, marker);
      host && tagHost(accessor, host);
      return;
    }
  }
  if (multi && initial.length === 0) {
    const placeholder = document.createTextNode("");
    parent.insertBefore(placeholder, marker);
    initial = [placeholder];
  }
  let current = initial;
  effect(prev => {
    if (hydrationRt !== null) current = hydrationRt.reclaimRegion(current, parent, marker);
    const value = normalize(accessor(), current, multi, true);
    if (typeof value !== "function") return value;
    effect(() => (hydrationRt !== null && (current = hydrationRt.reclaimRegion(current, parent, marker)), normalize(value, current, multi)), inner => {
      current = insertExpression(parent, inner, current, marker);
      host && tagHost(current, host);
    }, prev !== undefined && !(options && options.schedule) ? {
      ...options,
      schedule: true
    } : options);
    return INNER_OWNED;
  }, value => {
    if (value === INNER_OWNED) return;
    current = insertExpression(parent, value, current, marker);
    host && tagHost(current, host);
  },
  accessor.$s ? options ? {
    ...options,
    scope: true
  } : SCOPE_OPTIONS : options);
}
function assign(node, props, skipChildren, prevProps = {}, skipRef = false) {
  const nodeName = node.nodeName;
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children") continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], skipRef, nodeName);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, normalize(props.children, undefined, false));
      continue;
    }
    prevProps[prop] = assignProp(node, prop, props[prop], prevProps[prop], skipRef, nodeName);
  }
}
const ASSET_REMOVAL_GRACE = 100;
const assetRegistry = new Map();
function assetEntryKey(descriptor) {
  if (descriptor.policy === "exclusive") return "x|" + descriptor.key;
  return descriptor.type === "inline-style" ? "i|" + descriptor.id : descriptor.type + "|" + descriptor.href;
}
function findAssetElement(selector, attr, value) {
  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].getAttribute(attr) === value) return nodes[i];
  }
  return null;
}
function setAssetAttrs(el, attrs) {
  for (const name in attrs) el.setAttribute(name, attrs[name]);
}
function mountAssetElement(descriptor) {
  let el;
  if (descriptor.type === "inline-style") {
    el = findAssetElement("style[data-asset]", "data-asset", descriptor.id);
    if (!el) {
      el = document.createElement("style");
      el.setAttribute("data-asset", descriptor.id);
      el.textContent = descriptor.content || "";
    }
  } else {
    const rel = descriptor.type === "module" ? "modulepreload" : "stylesheet";
    el = findAssetElement(`link[rel="${rel}"]`, "href", descriptor.href);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      el.href = descriptor.href;
    }
  }
  if (descriptor.attrs) setAssetAttrs(el, descriptor.attrs);
  if (!el.isConnected) document.head.appendChild(el);
  return el;
}
const assetLoadSettled = /*#__PURE__*/Promise.resolve();
function trackAssetLoad(entry, adopted) {
  if (entry.loadPromise) return;
  const el = entry.element;
  let settled = el.sheet != null;
  if (!settled && adopted && typeof performance !== "undefined" && performance.getEntriesByName) {
    settled = performance.getEntriesByName(el.href).length > 0;
  }
  if (settled) {
    entry.loadState = "loaded";
    entry.loadPromise = assetLoadSettled;
    return;
  }
  entry.loadState = "pending";
  entry.loadPromise = new Promise(resolve => {
    const settle = state => {
      entry.loadState = state;
      resolve();
    };
    el.addEventListener("load", () => settle("loaded"), {
      once: true
    });
    el.addEventListener("error", () => settle("errored"), {
      once: true
    });
  });
}
function warmAsset(descriptor) {
  if (descriptor.policy === "exclusive" || descriptor.type === "inline-style") return;
  const key = assetEntryKey(descriptor);
  let entry = assetRegistry.get(key);
  if (!entry) {
    entry = {
      count: 0,
      element: null,
      timer: null
    };
    assetRegistry.set(key, entry);
  }
  let adopted = true;
  if (!entry.element || !entry.element.isConnected) {
    const rel = descriptor.type === "module" ? "modulepreload" : "stylesheet";
    let el = findAssetElement(`link[rel="${rel}"]`, "href", descriptor.href);
    if (!el && descriptor.type === "style") {
      el = findAssetElement('link[rel="preload"][as="style"]', "href", descriptor.href);
    }
    if (!el) {
      adopted = false;
      el = document.createElement("link");
      if (descriptor.type === "style") {
        el.setAttribute("rel", "preload");
        el.setAttribute("as", "style");
      } else {
        el.setAttribute("rel", "modulepreload");
      }
      el.setAttribute("href", descriptor.href);
      if (!document.body) el.setAttribute("blocking", "render");
    }
    if (descriptor.attrs) setAssetAttrs(el, descriptor.attrs);
    if (!el.isConnected) document.head.appendChild(el);
    entry.element = el;
    entry.loadState = undefined;
    entry.loadPromise = undefined;
  }
  if (descriptor.type === "style") trackAssetLoad(entry, adopted);
  return entry;
}
function acquireAsset(descriptor) {
  const key = assetEntryKey(descriptor);
  let entry = assetRegistry.get(key);
  if (descriptor.policy === "exclusive") {
    if (!entry) {
      entry = {
        original: descriptor.get(),
        set: descriptor.set,
        writers: []
      };
      assetRegistry.set(key, entry);
    }
    const writer = {
      value: descriptor.value
    };
    entry.writers.push(writer);
    entry.set(writer.value);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const index = entry.writers.indexOf(writer);
      const wasTop = index === entry.writers.length - 1;
      entry.writers.splice(index, 1);
      if (!wasTop) return;
      if (entry.writers.length) {
        entry.set(entry.writers[entry.writers.length - 1].value);
      } else {
        entry.set(entry.original);
        assetRegistry.delete(key);
      }
    };
  }
  if (!entry) {
    entry = {
      count: 0,
      element: null,
      timer: null
    };
    assetRegistry.set(key, entry);
  }
  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }
  entry.count++;
  if (!entry.element || !entry.element.isConnected) {
    entry.element = mountAssetElement(descriptor);
  } else if (descriptor.type === "style" && entry.element.getAttribute("rel") === "preload") {
    entry.element.removeAttribute("as");
    entry.element.setAttribute("rel", "stylesheet");
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--entry.count > 0) return;
    entry.timer = setTimeout(() => {
      assetRegistry.delete(key);
      entry.element && entry.element.remove();
    }, ASSET_REMOVAL_GRACE);
  };
}
let headRegistrations = null;
let headSeq = 0;
let headUid = 0;
let headOwned = null;
let headApplied = null;
let headFallbackTitle = null;
let headScheduled = false;
const headMountedResources = new Set();
function initHeadRegistry() {
  if (headRegistrations) return;
  headRegistrations = [];
  headOwned = new Map();
  headApplied = new Map();
  const t = document.querySelector("title");
  headFallbackTitle = t ? t.hasAttribute("data-dh") ? t.getAttribute("data-dhf") : t.textContent : null;
  if (globalThis._$HY) globalThis._$HY.h = applyServerHeadOps;
}
function applyServerHeadOps(ops) {
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const identity = op[0] === "t" ? "title" : op[1];
    if (headOwned.has(identity)) continue;
    if (op[0] === "t") setHeadTitle(op[1]);else if (op[0] === "r") {
      const els = headMarkedElements(identity);
      for (let j = 0; j < els.length; j++) els[j].remove();
    } else {
      const el = document.createElement(op[2]);
      for (const name in op[3]) el.setAttribute(name, op[3][name]);
      if (op[4] != null) el.textContent = op[4];
      el.setAttribute("data-dh", identity);
      document.head.appendChild(el);
    }
  }
}
function headMarkedElements(identity) {
  const nodes = document.head.querySelectorAll("[data-dh]");
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].getAttribute("data-dh") === identity) out.push(nodes[i]);
  }
  return out;
}
function setHeadTitle(text) {
  let el = document.querySelector("title");
  if (!el) {
    el = document.createElement("title");
    document.head.appendChild(el);
  }
  el.textContent = text;
  el.setAttribute("data-dh", "title");
  return el;
}
function scheduleHeadApply() {
  if (headScheduled) return;
  headScheduled = true;
  queueMicrotask(flushHeadRegistry);
}
function flushHeadRegistry() {
  if (sharedConfig.hydrating) {
    setTimeout(flushHeadRegistry, 0);
    return;
  }
  headScheduled = false;
  const winners = resolveHead(headRegistrations);
  for (const [identity, els] of headOwned) {
    if (winners.has(identity)) continue;
    headOwned.delete(identity);
    headApplied.delete(identity);
    if (identity === "title") {
      if (headFallbackTitle != null) {
        const el = setHeadTitle(headFallbackTitle);
        el.removeAttribute("data-dh");
        el.removeAttribute("data-dhf");
      }
    } else {
      for (let i = 0; i < els.length; i++) els[i].remove();
    }
  }
  for (const [identity, winner] of winners) {
    let sig = "";
    for (let i = 0; i < winner.tags.length; i++) sig += winner.tags[i].tag + JSON.stringify(winner.tags[i].props) + "|";
    if (headApplied.get(identity) === sig) continue;
    headApplied.set(identity, sig);
    if (identity === "base" || identity === "charset") {
      continue;
    }
    if (identity === "title") {
      const children = winner.tags[0].props.children;
      setHeadTitle(children == null ? "" : String(children));
      headOwned.set(identity, []);
      continue;
    }
    const existing = headMarkedElements(identity);
    const els = [];
    for (let i = 0; i < winner.tags.length; i++) {
      els.push(renderHeadElement(winner.tags[i], identity, existing));
    }
    for (let i = 0; i < existing.length; i++) {
      if (els.indexOf(existing[i]) === -1) existing[i].remove();
    }
    headOwned.set(identity, els);
  }
}
function createHeadElement(tag, props) {
  const el = document.createElement(tag);
  for (const name in props) {
    if (name === "children" || name === "ref" || name.slice(0, 2) === "on") continue;
    if (!HEAD_ATTR_NAME.test(name)) {
      continue;
    }
    const v = props[name];
    if (v == null || v === false) continue;
    el.setAttribute(name, v === true ? "" : String(v));
  }
  if (props.children != null) el.textContent = String(props.children);
  return el;
}
function renderHeadElement(t, identity, existing) {
  for (let i = 0; i < existing.length; i++) {
    if (headElementMatches(existing[i], t)) return existing.splice(i, 1)[0];
  }
  const el = createHeadElement(t.tag, t.props);
  el.setAttribute("data-dh", identity);
  document.head.appendChild(el);
  return el;
}
function headElementMatches(el, t) {
  if (el.tagName.toLowerCase() !== t.tag) return false;
  for (const name in t.props) {
    if (name === "children" || name === "ref" || name.slice(0, 2) === "on") continue;
    if (!HEAD_ATTR_NAME.test(name)) continue;
    const v = t.props[name];
    if (v == null || v === false) {
      if (el.hasAttribute(name)) return false;
    } else if (el.getAttribute(name) !== (v === true ? "" : String(v))) return false;
  }
  const children = t.props.children;
  return (children == null ? "" : String(children)) === el.textContent;
}
function mountHeadResource(tag, props) {
  const identity = resourceIdentity(tag, props);
  if (headMountedResources.has(identity)) return;
  headMountedResources.add(identity);
  const url = props.href || props.src;
  let el = null;
  if (url != null) {
    if (tag === "link") el = findAssetElement(`link[rel="${props.rel}"]`, "href", url);else if (tag === "script") el = findAssetElement("script[src]", "src", url);else el = findAssetElement("style[href]", "href", url);
  }
  if (!el) document.head.appendChild(createHeadElement(tag, props));
}
function gateHeadResource(props) {
  const descriptor = {
    type: props.rel === "stylesheet" ? "style" : "module",
    href: props.href
  };
  let gateable = props.rel === "stylesheet" && props.href != null;
  let attrs = null;
  for (const name in props) {
    if (name === "rel" || name === "href") continue;
    if (!STYLESHEET_FETCH_META.has(name)) gateable = false;
    if (!HEAD_ATTR_NAME.test(name)) continue;
    const v = props[name];
    if (v == null || v === false) continue;
    (attrs || (attrs = {}))[name] = v === true ? "" : String(v);
  }
  if (attrs) descriptor.attrs = attrs;
  effect(() => {
    const entry = warmAsset(descriptor);
    if (gateable && entry.loadState === "pending" && typeof waitAsset === "function") waitAsset(entry.loadPromise);
  }, () => acquireAsset(descriptor));
}
function useHead(tags) {
  initHeadRegistry();
  const reg = {
    seq: -1,
    tags: null
  };
  const uid = ++headUid;
  effect(() => {
    let list = typeof tags === "function" ? tags() : tags;
    if (!Array.isArray(list)) list = [list];
    const replaceable = [];
    const resources = [];
    for (let i = 0; i < list.length; i++) {
      const desc = list[i];
      if (!desc || !HEAD_ELIGIBLE_TAGS.has(desc.tag)) {
        continue;
      }
      const cls = classifyHeadTag(desc);
      const props = evalHeadProps(desc.props || {}, cls.rel !== undefined ? {
        rel: cls.rel
      } : undefined);
      if (cls.resource) {
        if (desc.tag === "link" && (props.rel === "stylesheet" || props.rel === "modulepreload")) {
          gateHeadResource(props);
        } else if (desc.tag === "link") {
          mountHeadResource(desc.tag, props);
        } else {
          resources.push({
            tag: desc.tag,
            props
          });
        }
      } else {
        const key = evalHeadValue(desc.key);
        replaceable.push({
          tag: desc.tag,
          props,
          identity: replaceableIdentity(desc.tag, props, key, "u:c" + uid + ":" + i)
        });
      }
    }
    return {
      replaceable,
      resources
    };
  }, evaluated => {
    for (let i = 0; i < evaluated.resources.length; i++) {
      mountHeadResource(evaluated.resources[i].tag, evaluated.resources[i].props);
    }
    reg.tags = evaluated.replaceable;
    if (reg.seq < 0) reg.seq = ++headSeq;
    if (headRegistrations.indexOf(reg) === -1) headRegistrations.push(reg);
    scheduleHeadApply();
    return () => {
      const idx = headRegistrations.indexOf(reg);
      if (idx > -1) headRegistrations.splice(idx, 1);
      scheduleHeadApply();
    };
  });
}
function loadModuleAssets(mapping) {
  const hy = globalThis._$HY;
  if (!hy) return;
  const pending = [];
  for (const key in mapping) {
    if (hy.modules[key]) continue;
    const entryUrl = new URL(mapping[key], document.baseURI).href;
    if (!hy.loading[key]) {
      hy.loading[key] = import(entryUrl).then(mod => {
        hy.modules[key] = mod;
      }, err => {
        delete hy.loading[key];
        throw err;
      });
    }
    pending.push(hy.loading[key]);
  }
  return pending.length ? Promise.all(pending).then(() => {}) : undefined;
}
function hydrate(code, element, options = {}) {
  enableHydration();
  installHydrationRuntime();
  if (globalThis._$HY.done) return render(code, element, [...element.childNodes], options);
  const head = (element.nodeType === 9 ? element : element.ownerDocument).head;
  if (head && element.contains(head)) {
    let n = head.firstChild;
    while (n && n.nodeType === 1 && n.hasAttribute("data-dh") && !n.hasAttribute("data-dhf")) {
      const next = n.nextSibling;
      head.appendChild(n);
      n = next;
    }
  }
  options.renderId ||= "";
  if (!globalThis._$HY.modules) globalThis._$HY.modules = {};
  if (!globalThis._$HY.loading) globalThis._$HY.loading = {};
  sharedConfig.completed = globalThis._$HY.completed;
  sharedConfig.events = globalThis._$HY.events;
  sharedConfig.load = id => globalThis._$HY.r[id];
  sharedConfig.has = id => id in globalThis._$HY.r;
  sharedConfig.gather = root => gatherHydratable(element, root);
  sharedConfig.loadModuleAssets = loadModuleAssets;
  sharedConfig.cleanupFragment = id => {
    const tpl = document.getElementById("pl-" + id);
    if (tpl) {
      let node = tpl.nextSibling;
      while (node) {
        const next = node.nextSibling;
        if (node.nodeType === 8 && node.nodeValue === "pl-" + id) {
          node.remove();
          break;
        }
        node.remove();
        node = next;
      }
      tpl.remove();
    }
  };
  sharedConfig.registry = new Map();
  if (!sharedConfig.boundaryScopes) sharedConfig.boundaryScopes = new Map();
  sharedConfig.captureBoundaryScope = id => {
    if (sharedConfig.registry) sharedConfig.boundaryScopes.set(id, {
      registry: sharedConfig.registry,
      gather: sharedConfig.gather
    });
  };
  sharedConfig.hydrating = true;
  const hyr = globalThis._$HY.r;
  const rootMapping = hyr && (hyr[options.renderId + "_assets"] || hyr["_assets"]);
  if (rootMapping && typeof rootMapping === "object") {
    const p = loadModuleAssets(rootMapping);
    if (p) {
      gatherHydratable(element, options.renderId);
      const registry = sharedConfig.registry;
      const gather = sharedConfig.gather;
      let disposer;
      p.then(() => {
        sharedConfig.registry = registry;
        sharedConfig.gather = gather;
        sharedConfig.hydrating = true;
        try {
          disposer = render(code, element, [...element.childNodes], options);
        } finally {
          sharedConfig.hydrating = false;
        }
      }, err => {
        console.error("Hydration module preload failed, falling back to client render:", err);
        sharedConfig.hydrating = false;
        sharedConfig.registry = undefined;
        disposer = render(code, element, [...element.childNodes], options);
      });
      return () => disposer && disposer();
    }
  }
  try {
    gatherHydratable(element, options.renderId);
    return render(code, element, [...element.childNodes], options);
  } finally {
    sharedConfig.hydrating = false;
  }
}
function getNextElement(template) {
  let node,
    key,
    hydrating = isHydrating();
  if (!hydrating || !(node = sharedConfig.registry.get(key = getHydrationKey()))) {
    if (!template) {
      throw new Error(`Hydration Mismatch. Unable to find DOM nodes for hydration key: ${key}`);
    }
    return template(true);
  }
  if (sharedConfig.completed) sharedConfig.completed.add(node);
  sharedConfig.registry.delete(key);
  return node;
}
function getNextMatch(el, nodeName) {
  while (el && el.localName !== nodeName) el = el.nextSibling;
  return el;
}
function getNextMarker(start) {
  let end = start,
    count = 0,
    current = [];
  if (isHydrating(start)) {
    while (end) {
      if (end.nodeType === 8) {
        const v = end.nodeValue;
        if (v === "$") count++;else if (v === "/") {
          if (count === 0) return [end, current];
          count--;
        }
      }
      current.push(end);
      end = end.nextSibling;
    }
  }
  return [end, current];
}
function getFirstChild(node, expectedTag) {
  const child = node.firstChild;
  return child;
}
function getNextSibling(node, expectedTag) {
  const sibling = node.nextSibling;
  return sibling;
}
function runHydrationEvents() {
  if (sharedConfig.events && !sharedConfig.events.queued) {
    queueMicrotask(() => {
      const {
        completed,
        events
      } = sharedConfig;
      if (!events) return;
      events.queued = false;
      while (events.length) {
        const [el, e] = events[0];
        if (!completed.has(el)) return;
        events.shift();
        let matchContainer, matchState, matchDistance, matches;
        for (const [container, state] of delegatedContainers) {
          if (!state.handlers.has(e.type)) continue;
          const entry = findOwner(e.target, state);
          if (!entry) continue;
          if (matchContainer) {
            if (!matches) matches = [{
              container: matchContainer,
              state: matchState,
              distance: matchDistance
            }];
            matches.push({
              container,
              state,
              distance: entry.distance
            });
          } else {
            matchContainer = container;
            matchState = state;
            matchDistance = entry.distance;
          }
        }
        if (matches) {
          matches.sort((a, b) => a.distance - b.distance);
          for (let i = 0; i < matches.length; i++) eventHandler(e, matches[i].container, matches[i].state);
        } else if (matchContainer) eventHandler(e, matchContainer, matchState);
      }
      if (sharedConfig.done) {
        sharedConfig.events = _$HY.events = null;
        sharedConfig.completed = _$HY.completed = null;
      }
    });
    sharedConfig.events.queued = true;
  }
}
function isHydrating(node) {
  if (!sharedConfig.hydrating) return false;
  if (!node || node.isConnected) return true;
  const roots = sharedConfig.claimRoots;
  if (roots) {
    for (let i = 0; i < roots.length; i++) {
      if (roots[i].contains(node)) return true;
    }
  }
  return false;
}
function classListToObject(classList) {
  if (Array.isArray(classList)) {
    const result = {};
    flattenClassList(classList, result);
    classList = result;
  }
  if (classList && typeof classList === "object") {
    const result = {},
      keys = Object.keys(classList);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (!classList[key]) continue;
      const classNames = key.trim().split(/\s+/);
      for (let j = 0, nameLen = classNames.length; j < nameLen; j++) classNames[j] && (result[classNames[j]] = true);
    }
    return result;
  }
  return classList;
}
function flattenClassList(list, result) {
  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i];
    if (Array.isArray(item)) flattenClassList(item, result);else if (typeof item === "object" && item != null) Object.assign(result, item);else if (item || item === 0) result[item] = true;
  }
}
function assignProp(node, prop, value, prev, skipRef, nodeName) {
  if (prop === "style") return style(node, value, prev), value;
  if (prop === "class") return className(node, value, prev), value;
  if (value === prev && DOMWithState[nodeName]?.[prop] !== 1) return prev;
  if (prop === "ref") {
    if (!skipRef && value) ref(() => value, node);
    return value;
  }
  const hasNamespace = prop.indexOf(":") > -1;
  if (!hasNamespace && prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEvent(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if (hasNamespace && prop.slice(0, 5) === "prop:" || ChildProperties.has(prop) || DOMWithState[nodeName]?.[prop]) {
    if (hasNamespace) prop = prop.slice(5);else if (isHydrating(node)) return value;
    if (prop === "value" && nodeName === "SELECT") queueMicrotask(() => node.value = value) || (node.value = value);else if ((prop === "value" || prop === "defaultValue") && (nodeName === "INPUT" || nodeName === "TEXTAREA"))
      node[prop] = value ?? "";else node[prop] = value;
  } else {
    const ns = hasNamespace && Namespaces[prop.split(":")[0]];
    if (ns) setAttributeNS(node, ns, prop, value);else setAttribute(node, prop, value);
  }
  return value;
}
function eventHandler(e, container, state) {
  if (hydrationRt !== null && hydrationRt.dedupEvent(e)) return;
  const prev = e[$$EVENT_OWNER];
  let resumeNode;
  if (prev) {
    if (prev === true || prev === container || !container.contains(prev)) return;
    resumeNode = prev;
  }
  const owner = state && (state.owners.size === 1 && state.owners.has(container) ? container : findOwner(e.target, state)?.owner);
  if (state && !owner) return;
  if (owner && owner === resumeNode) return;
  e[$$EVENT_OWNER] = owner || true;
  let node = resumeNode || e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const boundary = owner || container || e.currentTarget;
  const retarget = value => Object.defineProperty(e, "target", {
    configurable: true,
    value
  });
  const handleNode = () => {
    let handler = node[key];
    if (handler === undefined && node.hasAttribute && node.hasAttribute("_bnd")) {
      const seam = globalThis[Symbol.for("solid.bnd")];
      if (seam) handler = seam.resolve(node, e.type);
    }
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (node && handleNode()) {
      if (node === boundary || node.parentNode === boundary) break;
      node = node._$host || node.parentNode || node.host;
    }
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || boundary || document;
    }
  });
  if (resumeNode) {
    if (resumeNode === e.target) node = resumeNode._$host || resumeNode.parentNode || resumeNode.host;
    if (node && node !== boundary) walkUpTree();
  } else if (e.composedPath) {
    const path = e.composedPath();
    if (path.length) {
      retarget(path[0]);
      for (let i = 0; i < path.length; i++) {
        node = path[i];
        if (!handleNode()) break;
        if (node._$host) {
          node = node._$host;
          walkUpTree();
          break;
        }
        if (node === boundary || node.parentNode === boundary) {
          break;
        }
      }
    } else walkUpTree();
  }
  else walkUpTree();
  retarget(oriTarget);
}
function insertExpression(parent, value, current, marker) {
  if (hydrationRt !== null && isHydrating(parent)) {
    if (value && value !== current) {
      const arr = Array.isArray(value);
      for (const n of arr ? value : [value]) {
        if (n && n.nodeType) {
          if (!isHydrating(n)) return current;
        } else if (arr && (typeof n === "string" || typeof n === "number")) {
          return current;
        }
      }
    }
    return value;
  }
  if (value === current) return value;
  const t = typeof value,
    multi = marker !== undefined;
  if (t === "string" || t === "number") {
    const tc = typeof current;
    if (tc === "string" || tc === "number") {
      parent.firstChild.data = value;
    } else {
      if (ownsAllChildren(parent, current)) parent.textContent = value;else {
        removeOwnedChildren(parent, current);
        parent.insertBefore(document.createTextNode(value), parent.firstChild);
      }
    }
  } else if (value === undefined) {
    cleanChildren(parent, current, marker);
  } else if (value.nodeType) {
    if (Array.isArray(current)) {
      cleanChildren(parent, current, multi ? marker : null, value);
    } else if (current && current.nodeType) {
      current.parentNode === parent ? parent.replaceChild(value, current) : parent.appendChild(value);
    } else if (current && parent.firstChild) {
      parent.replaceChild(value, parent.firstChild);
    } else {
      parent.appendChild(value);
    }
    if (marker) value[$$SLOT] = marker;
  } else if (Array.isArray(value)) {
    const currentArray = current && Array.isArray(current);
    for (let i = 0, len = value.length; i < len; i++) {
      const item = value[i],
        t = typeof item;
      if (t === "string" || t === "number") {
        const prev = currentArray ? current[i] : undefined;
        if (prev && prev.nodeType === 3) {
          if (prev.data !== "" + item) prev.data = item;
          value[i] = prev;
        } else value[i] = document.createTextNode(item);
      }
    }
    if (value.length === 0) {
      cleanChildren(parent, current, marker);
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, value, marker);
      } else reconcileArrays(parent, current, value, marker);
    } else {
      current && cleanChildren(parent, current);
      appendNodes(parent, value);
    }
  } else ;
  return value;
}
function normalize(value, current, multi, doNotUnwrap) {
  value = flatten(value, {
    skipNonRendered: true,
    doNotUnwrap
  });
  if (doNotUnwrap && typeof value === "function") return value;
  if (multi && !Array.isArray(value)) value = [value != null ? value : ""];
  if (sharedConfig.hydrating && Array.isArray(value)) {
    for (let i = 0, len = value.length; i < len; i++) {
      const item = value[i],
        prev = current && current[i],
        t = typeof item;
      if ((t === "string" || t === "number") && prev && prev.nodeType === 3) value[i] = prev;
    }
  }
  return value;
}
function tagHost(value, host) {
  if (Array.isArray(value)) {
    for (let i = 0, len = value.length; i < len; i++) tagHost(value[i], host);
  } else if (value && value.nodeType && value[$$HOST] !== host) {
    value[$$HOST] = host;
    Object.defineProperty(value, "_$host", {
      get: host,
      configurable: true
    });
  }
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) {
    const n = array[i];
    parent.insertBefore(n, marker);
    if (marker) n[$$SLOT] = marker;
  }
}
function ownsAllChildren(parent, current) {
  if (current == null) return true;
  if (Array.isArray(current)) {
    return current.length ? parent.firstChild === current[0] && parent.lastChild === current[current.length - 1] : parent.firstChild === null;
  }
  if (current === "") return parent.firstChild === null;
  if (current.nodeType) return parent.firstChild === current && parent.lastChild === current;
  const first = parent.firstChild;
  return first !== null && first.nodeType === 3 && parent.lastChild === first;
}
function removeOwnedChildren(parent, current) {
  if (Array.isArray(current)) {
    for (let i = 0; i < current.length; i++) {
      const el = current[i];
      if (el.parentNode === parent) el.remove();
    }
  } else if (current.nodeType) {
    if (current.parentNode === parent) current.remove();
  } else {
    const first = parent.firstChild;
    if (first && first.nodeType === 3) first.remove();
  }
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) {
    if (ownsAllChildren(parent, current)) return parent.textContent = "";
    return removeOwnedChildren(parent, current);
  }
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (replacement !== el) {
        const tag = el[$$SLOT];
        const owns = el.parentNode === parent && (!tag || tag === marker);
        if (replacement && !inserted && !i) owns ? parent.replaceChild(replacement, el) : parent.insertBefore(replacement, marker);else if (owns) el.remove();
      } else inserted = true;
    }
  } else if (replacement) parent.insertBefore(replacement, marker);
  if (replacement && marker) replacement[$$SLOT] = marker;
}
function gatherHydratable(element, root) {
  const templates = element.querySelectorAll(`*[_hk]`);
  for (let i = 0; i < templates.length; i++) {
    const node = templates[i];
    const key = node.getAttribute("_hk");
    if (root) {
      if (!key.startsWith(root)) continue;
    } else {
      const frame = node.closest("[data-fid]");
      if (frame && frame !== element && element.contains(frame)) continue;
    }
    if (!sharedConfig.registry.has(key)) sharedConfig.registry.set(key, node);
  }
}
function getHydrationKey() {
  return sharedConfig.getNextContextId();
}
const RequestContext = Symbol();

const PURE_ROW = Symbol.for("solid.pure-row");
const arm = () => {
  installListDriver(driveList);
};
function rowProof(fn) {
  arm();
  fn[PURE_ROW] = true;
  return fn;
}
let rowCollector = null;
const lisPositions = sources => {
  const n = sources.length;
  const tails = [];
  const tailsIdx = [];
  const prev = new Array(n).fill(-1);
  for (let j = 0; j < n; j++) {
    const v = sources[j];
    if (v === -1) continue;
    let lo = 0,
      hi = tails.length;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (tails[mid] < v) lo = mid + 1;else hi = mid;
    }
    if (lo > 0) prev[j] = tailsIdx[lo - 1];
    tails[lo] = v;
    tailsIdx[lo] = j;
  }
  const stable = new Set();
  let k = tailsIdx.length ? tailsIdx[tails.length - 1] : -1;
  while (k >= 0) {
    stable.add(k);
    k = prev[k];
  }
  return stable;
};
const driveList = (parent, listFn, marker, lateClassic) => {
  const meta = listFn.$ll;
  if (meta.row?.[PURE_ROW] !== true) return false;
  if (typeof meta.keyed === "function") return false;
  const evalOwner = createOwner({
    id: "&each"
  });
  let subject = runWithOwner(evalOwner, () => untrack(meta.each));
  evalOwner.dispose();
  let raw = subject != null ? patchableRaw(subject) : undefined;
  if (raw === undefined || !Array.isArray(raw)) return false;
  const optimistic = storeHasOptimisticFamily(subject);
  if (optimistic) raw = untrack(() => Array.from(subject));
  const hydrating = !!sharedConfig.hydrating;
  if (hydrating && raw.length === 0) return false;
  let domRows;
  let rowIds;
  if (hydrating) {
    if (marker !== undefined) return false;
    domRows = Array.from(parent.children);
    if (domRows.length !== raw.length) return false;
    rowIds = new Array(raw.length);
    for (let i = 0; i < domRows.length; i++) {
      const key = domRows[i].getAttribute("_hk");
      if (key === null || !key.endsWith("0") || key.length < 2) return false;
      rowIds[i] = key.slice(0, -1);
    }
  }
  const rowFn = meta.row;
  const endAnchor = marker ?? null;
  const shallow = storeIsShallow(subject);
  let lastBodies = null;
  let lastUnbinds = null;
  const collectBind = (abs, build) => {
    const prevC = rowCollector;
    rowCollector = {
      row: shallow ? subject[abs] : undefined,
      bodies: [],
      unbinds: []
    };
    try {
      return build();
    } finally {
      lastBodies = rowCollector.bodies;
      lastUnbinds = rowCollector.unbinds;
      rowCollector = prevC;
    }
  };
  const listOwner = createOwner();
  let declined = false;
  const bindRow = (abs, claimId) => {
    return collectBind(abs, () => runWithOwner(listOwner, () => claimId !== undefined ? runWithOwner(createOwner({
      id: claimId
    }), () => untrack(() => rowFn(subject[abs]))) : untrack(() => rowFn(subject[abs]))));
  };
  let entries = new Array(raw.length);
  let rowBodies = shallow ? new Array(raw.length) : null;
  let rowUnbinds = new Array(raw.length);
  const runUnbinds = list => {
    if (list !== undefined) for (let u = 0; u < list.length; u++) list[u]();
  };
  const unbindAllRows = () => {
    for (let j = 0; j < rowUnbinds.length; j++) runUnbinds(rowUnbinds[j]);
    rowUnbinds = [];
  };
  let prevRaws = raw.slice();
  try {
    if (hydrating) {
      for (let i = 0; i < raw.length; i++) {
        entries[i] = bindRow(i, rowIds[i]);
        if (rowBodies !== null) rowBodies[i] = lastBodies;
        rowUnbinds[i] = lastUnbinds;
      }
    } else {
      for (let i = 0; i < raw.length; i++) {
        const node = bindRow(i);
        entries[i] = node;
        if (rowBodies !== null) rowBodies[i] = lastBodies;
        rowUnbinds[i] = lastUnbinds;
        parent.insertBefore(node, endAnchor);
      }
    }
  } catch (err) {
    unbindAllRows();
    runUnbinds(lastUnbinds ?? undefined);
    for (let j = 0; j < entries.length; j++) {
      const n = entries[j];
      if (n !== undefined && n.parentNode === parent) n.remove();
    }
    listOwner.dispose();
    throw err;
  }
  const identityOps = nextArr => {
    const keyOf = r => {
      const w = r != null ? patchableRaw(r) : undefined;
      return w !== undefined ? w : r;
    };
    const oldIndex = new Map();
    for (let j = 0; j < prevRaws.length; j++) {
      const k = keyOf(prevRaws[j]);
      const existing = oldIndex.get(k);
      if (existing === undefined) oldIndex.set(k, j);else if (Array.isArray(existing)) existing.push(j);else oldIndex.set(k, [existing, j]);
    }
    const sources = new Array(nextArr.length);
    for (let k = 0; k < nextArr.length; k++) {
      const m = oldIndex.get(keyOf(nextArr[k]));
      if (m === undefined) sources[k] = -1;else if (Array.isArray(m)) {
        sources[k] = m.shift();
        if (m.length === 1) oldIndex.set(keyOf(nextArr[k]), m[0]);
      } else {
        sources[k] = m;
        oldIndex.delete(keyOf(nextArr[k]));
      }
    }
    return {
      prefix: 0,
      sources
    };
  };
  let resyncNeeded = false;
  const applyOps = (next, ops) => {
    if (declined) return;
    if (resyncNeeded) ops = null;
    if (ops === null) ops = identityOps(next);
    const {
      prefix,
      sources
    } = ops;
    const built = new Array(sources.length);
    const builtBodies = rowBodies !== null ? new Array(sources.length) : null;
    const builtUnbinds = new Array(sources.length);
    let j = 0;
    try {
      for (; j < sources.length; j++) {
        const abs = prefix + j;
        const src = sources[j];
        if (src === -1 || refRebuild && src >= 0 && next[abs] !== prevRaws[src]) {
          built[j] = bindRow(abs);
          if (builtBodies !== null) builtBodies[j] = lastBodies;
          builtUnbinds[j] = lastUnbinds;
        }
      }
    } catch (err) {
      for (let k = 0; k < j; k++) runUnbinds(builtUnbinds[k]);
      runUnbinds(lastUnbinds ?? undefined);
      resyncNeeded = true;
      throw err;
    }
    const retained = new Set();
    for (let k = 0; k < sources.length; k++) {
      if (sources[k] >= 0 && built[k] === undefined) retained.add(sources[k]);
    }
    for (let k = prefix; k < entries.length; k++) {
      if (!retained.has(k)) {
        entries[k].remove();
        runUnbinds(rowUnbinds[k]);
      }
    }
    const newEntries = new Array(prefix + sources.length);
    const newBodies = rowBodies !== null ? new Array(prefix + sources.length) : null;
    const newUnbinds = new Array(prefix + sources.length);
    for (let i = 0; i < prefix; i++) {
      newEntries[i] = entries[i];
      if (newBodies !== null) newBodies[i] = rowBodies[i];
      newUnbinds[i] = rowUnbinds[i];
    }
    const stable = lisPositions(sources);
    let anchor = endAnchor;
    for (let k = sources.length - 1; k >= 0; k--) {
      const abs = prefix + k;
      const src = sources[k];
      let node;
      if (built[k] !== undefined) {
        node = built[k];
        if (newBodies !== null) newBodies[abs] = builtBodies[k];
        newUnbinds[abs] = builtUnbinds[k];
        parent.insertBefore(node, anchor);
      } else {
        node = entries[src];
        if (newBodies !== null) newBodies[abs] = rowBodies[src];
        newUnbinds[abs] = rowUnbinds[src];
        if (!stable.has(k)) parent.insertBefore(node, anchor);
      }
      newEntries[abs] = node;
      anchor = node;
    }
    entries = newEntries;
    if (newBodies !== null) rowBodies = newBodies;
    rowUnbinds = newUnbinds;
    prevRaws = next.slice();
    resyncNeeded = false;
  };
  let unbindOps = runWithOwner(listOwner, () => registerRowOps(subject, applyOps));
  const refRebuild = shallow && typeof meta.keyed !== "function";
  const rebuildSlot = i => {
    runUnbinds(rowUnbinds[i]);
    const old = entries[i];
    const node = bindRow(i);
    rowBodies[i] = lastBodies;
    rowUnbinds[i] = lastUnbinds;
    parent.insertBefore(node, old);
    old.remove();
    entries[i] = node;
  };
  const applySlot = (i, next, prev) => {
    if (declined) return;
    if (resyncNeeded) {
      const live = subject != null ? patchableRaw(subject) : undefined;
      if (live !== undefined && Array.isArray(live)) applyOps(live, null);
      return;
    }
    if (refRebuild) {
      rebuildSlot(i);
      prevRaws[i] = next;
      return;
    }
    const bodies = rowBodies[i];
    if (bodies !== undefined) {
      for (let b = 0; b < bodies.length; b++) bodies[b](next, prev, false);
    }
    prevRaws[i] = next;
  };
  let unbindSlots = shallow ? runWithOwner(listOwner, () => registerSlotPatch(subject, applySlot)) : null;
  runWithOwner(listOwner, () => effect(() => meta.each(), value => {
    if (declined || value === subject) return;
    const nextRaw = value != null ? patchableRaw(value) : undefined;
    unbindOps();
    unbindSlots?.();
    if (nextRaw !== undefined && Array.isArray(nextRaw) && storeIsShallow(value) !== shallow) {
      for (let j = 0; j < entries.length; j++) entries[j].remove();
      entries = [];
      prevRaws = [];
      unbindAllRows();
      subject = value;
      declined = true;
      listOwner.dispose();
      lateClassic?.();
      return;
    }
    if (nextRaw === undefined || !Array.isArray(nextRaw)) {
      for (let j = 0; j < entries.length; j++) entries[j].remove();
      entries = [];
      prevRaws = [];
      unbindAllRows();
      subject = value;
      declined = true;
      listOwner.dispose();
      lateClassic?.();
      return;
    }
    const swapOps = identityOps(nextRaw);
    subject = value;
    unbindOps = runWithOwner(listOwner, () => registerRowOps(subject, applyOps));
    if (shallow) unbindSlots = runWithOwner(listOwner, () => registerSlotPatch(subject, applySlot));
    applyOps(nextRaw, swapOps);
  }));
  onCleanup(() => {
    unbindOps();
    unbindSlots?.();
    unbindAllRows();
    listOwner.dispose();
  });
  return true;
};
const patchDriver = (subject, body) => {
  const raw = patchableRaw(subject);
  if (raw !== undefined) {
    if (!sharedConfig.hydrating) body(raw, undefined, true);
    const unbind = registerPatch(subject, body);
    if (rowCollector !== null) rowCollector.unbinds.push(unbind);
    else onCleanup(unbind);
  } else if (rowCollector !== null && subject === rowCollector.row) {
    rowCollector.bodies.push(body);
    if (!sharedConfig.hydrating) body(subject, undefined, true);
  } else {
    effect(() => body(subject, subject, false),
    () => untrack(() => body(subject, undefined, true)));
  }
};

function throwInBrowser(func) {
  const err = new Error(`${func.name} is not supported in the browser, returning undefined`);
  console.error(err);
}
function renderToString(fn, options) {
  throwInBrowser(renderToString);
}
function renderToStream(fn, options) {
  throwInBrowser(renderToStream);
}
function createResponseStub() {
  throwInBrowser(createResponseStub);
}
function createRequestEvent(request, init) {
  throwInBrowser(createRequestEvent);
}
function getExpectedRedirectStatus(response) {
  throwInBrowser(getExpectedRedirectStatus);
}
function createSSRResponse() {
  throwInBrowser(createSSRResponse);
}
function commitEventResponse(response, event) {
  throwInBrowser(commitEventResponse);
}
function composeMiddleware(middlewares) {
  throwInBrowser(composeMiddleware);
}
function ssr(template, ...nodes) {}
function ssrElement(name, props, children, needsId) {}
function ssrClassName(value) {}
function ssrStyle(value) {}
function ssrStyleProperty(name, value) {}
function ssrAttribute(key, value) {}
function ssrGroup(fn, n) {}
function ssrHydrationKey() {}
function resolveSSRNode(node, result, top) {}
function escape(s, attr) {}

const ENVELOPE = Symbol.for("solid.ResponseEnvelope");
// PURE-annotated factory (same convention as solid's MockPromise): the brand
const ResponseEnvelope = /* @__PURE__ */(() => {
  class ResponseEnvelope {
    constructor(response, value) {
      this.response = response;
      this.value = value;
    }
  }
  ResponseEnvelope.prototype[ENVELOPE] = true;
  return ResponseEnvelope;
})();
function isResponseEnvelope(value) {
  return !!(value && typeof value === "object" && value[ENVELOPE]);
}
const HREF = Symbol.for("solid.Href");
function isHref(value) {
  return !!(value && (typeof value === "object" || typeof value === "function") && value[HREF]);
}
const SAFE_ERROR = Symbol.for("solid.SafeError");
function markSafeError(error) {
  if (error && (typeof error === "object" || typeof error === "function")) {
    Object.defineProperty(error, SAFE_ERROR, {
      value: true,
      enumerable: false,
      configurable: true
    });
  }
  return error;
}
function isSafeError(value) {
  return !!(value && (typeof value === "object" || typeof value === "function") && value[SAFE_ERROR]);
}
const REVALIDATE_HEADER = "X-Revalidate";
function initWithRevalidate(init = {}) {
  const resolved = typeof init === "number" ? {
    status: init
  } : init;
  const {
    revalidate,
    ...responseInit
  } = resolved;
  let headers;
  if (responseInit.headers && responseInit.headers.getSetCookie) {
    headers = new Headers();
    responseInit.headers.forEach((value, key) => {
      if (key !== "set-cookie") headers.append(key, value);
    });
    for (const cookie of responseInit.headers.getSetCookie()) {
      headers.append("Set-Cookie", cookie);
    }
  } else {
    headers = new Headers(responseInit.headers);
  }
  revalidate !== undefined && headers.set(REVALIDATE_HEADER, revalidate.toString());
  return {
    responseInit,
    headers
  };
}
function redirect(url, init = 302) {
  if (typeof url !== "string" && !isHref(url)) {
    throw new TypeError("redirect() expects a string URL or an Href-branded value (Symbol.for('solid.Href')).");
  }
  const {
    responseInit,
    headers
  } = initWithRevalidate(init);
  if (responseInit.status === undefined) {
    responseInit.status = 302;
  }
  const target = typeof url === "string" ? url : url[HREF];
  headers.set("Location", typeof target === "string" ? target : String(url));
  return new Response(null, {
    ...responseInit,
    headers
  });
}
function reload(init = {}) {
  const {
    responseInit,
    headers
  } = initWithRevalidate(init);
  return new Response(null, {
    ...responseInit,
    headers
  });
}
function respond(value, init = {}) {
  const {
    responseInit,
    headers
  } = initWithRevalidate(init);
  headers.set("Content-Type", "application/json");
  return new ResponseEnvelope(new Response(JSON.stringify(value), {
    ...responseInit,
    headers
  }), value);
}

const isServer = false;
const isDev = false;
function Portal(props) {
  return runWithOwner(createOwner(), () => portalImpl(props));
}
function portalImpl(props) {
  const treeMarker = document.createTextNode(""),
    startMarker = document.createTextNode(""),
    endMarker = document.createTextNode(""),
    mount = () => props.mount || document.body,
    content = createMemo(() => [startMarker, props.children], {
      ssrSource: "client",
      loadingValue: undefined
    });
  createRenderEffect(
  () => [mount(), content(), getOwner()], ([, c, owner]) => {
    const m = untrack(mount);
    m.appendChild(endMarker);
    const dispose = runWithOwner(owner, () => createRoot(d => {
      insert(m, c, endMarker, undefined, {
        host: () => treeMarker.parentNode
      });
      return d;
    }));
    return () => {
      dispose();
      let c = startMarker;
      while (c) {
        const n = c.nextSibling;
        m.removeChild(c);
        if (c === endMarker) break;
        c = n;
      }
    };
  },
  {
    schedule: true,
    ssrSource: "client"
  });
  createEffect(mount, () => {
    const m = untrack(mount);
    const ownerRoot = getDelegatedRoot(treeMarker);
    if (!ownerRoot || ownerRoot.contains(m)) return;
    registerDelegatedContainer(m, ownerRoot);
    return () => unregisterDelegatedContainer(m, ownerRoot);
  }, {
    ssrSource: "client"
  });
  if (sharedConfig.hydrating) return createMemo(() => treeMarker, {
    ssrSource: "client",
    loadingValue: undefined
  });
  return treeMarker;
}
const COMPONENT_BINDING = Symbol.for("solid.component-binding");
function bindingOf(value) {
  return value !== null && (typeof value === "function" || typeof value === "object") && value[COMPONENT_BINDING] || undefined;
}
function dynamic(source) {
  let latest = 0;
  const sites = new Set();
  let deliveredAddress;
  const resolveBinding = (next, prev) => {
    const binding = bindingOf(next);
    if (!binding) return next;
    deliveredAddress = binding.address;
    const prevBinding = bindingOf(prev);
    if (prevBinding && prevBinding.component === binding.component) {
      for (const deliver of sites) deliver(binding.address);
      return prev;
    }
    return next;
  };
  const cached = createMemo(prev => {
    const next = source();
    if (!next || typeof next.then !== "function") return resolveBinding(next, prev);
    const token = ++latest;
    return {
      then: (onFulfilled, onRejected) => next.then(resolved => onFulfilled(token === latest ? resolveBinding(resolved, prev) : resolved), onRejected)
    };
  }, {
    lazy: true
  });
  return props => {
    return createMemo(() => {
      const component = cached();
      switch (typeof component) {
        case "function":
          {
            const binding = bindingOf(component);
            if (binding) {
              const [address, setAddress] = createSignal(deliveredAddress ?? binding.address);
              sites.add(setAddress);
              onCleanup(() => sites.delete(setAddress));
              return untrack(() => binding.component(props, address));
            }
            return untrack(() => component(props));
          }
        case "string":
          const el = sharedConfig.hydrating ? getNextElement() : createElement(component, untrack(() => props.is));
          spread(el, props);
          return el;
      }
    });
  };
}
function Dynamic(props) {
  const Comp = dynamic(() => props.component);
  return createComponent(Comp, omit(props, "component"));
}
function createElement(tagName, is = undefined) {
  return SVGElements.has(tagName) ? document.createElementNS(Namespaces.svg, tagName) : MathMLElements.has(tagName) ? document.createElementNS(Namespaces.mathml, tagName) : document.createElement(tagName, {
    is
  });
}
function loadClientOnly(fn, setComp, exportName) {
  fn().then(m => setComp(() => exportName ? m[exportName] : m.default));
}
function clientOnly(fn, options = {},
_moduleUrl) {
  const [comp, setComp] = createSignal();
  let started = !options.lazy;
  started && loadClientOnly(fn, setComp, options.export);
  return props => {
    let Comp;
    let m;
    const rest = omit(props, "fallback");
    if (!started) {
      started = true;
      loadClientOnly(fn, setComp, options.export);
    }
    if ((Comp = untrack(comp)) && !sharedConfig.hydrating) return Comp(rest);
    const [mounted, setMounted] = createSignal(!sharedConfig.hydrating);
    const gate = createMemo(() => (Comp = comp(), m = mounted(), untrack(() => Comp && m ? Comp(rest) : props.fallback)));
    const onHydrationEnd = sharedConfig.onHydrationEnd;
    const release = () => setMounted(true);
    onHydrationEnd ? onHydrationEnd(release) : queueMicrotask(release);
    return gate;
  };
}
function httpStatus(_code, _text) {}
function httpHeader(_name, _value, _options) {}

export { ChildProperties, DOMElements, DOMWithState, DelegatedEvents, Dynamic, HREF, HydrationScript, MathMLElements, Namespaces, Portal, REVALIDATE_HEADER, RawTextElements, RequestContext, ResponseEnvelope, SAFE_ERROR, SVGElements, VoidElements, acquireAsset, addEvent, applyRef, assign, claimElement, claimElementTree, className, clearFlashCookie, clientOnly, commitEventResponse, composeMiddleware, createRequestEvent, createResponseStub, createSSRResponse, delegateEvents, driveList, dynamic, dynamicProperty, effect, escape, generateHydrationScript, getDelegatedRoot, getExpectedRedirectStatus, getFirstChild, getHydrationKey, getNextElement, getNextMarker, getNextMatch, getNextSibling, getRequestEvent, getServerFunctionMetadata, getServerFunctionRPC, hasFlashCookie, httpHeader, httpStatus, hydrate, insert, installHydrationRuntime, installListDriver, isDev, isHref, isResponseEnvelope, isSafeError, isServer, isServerFunction, listDriver, markSafeError, memo, parseCookieHeader, patchDriver, redirect, ref, registerDelegatedContainer, registerDelegatedRoot, registerElementClaim, reload, render, renderToStream, renderToString, resolveSSRNode, respond, rowProof, runHydrationEvents, scope, serializeCookie, setAttribute, setAttributeNS, setProperty, setStyleProperty, spread, ssr, ssrAttribute, ssrClassName, ssrElement, ssrGroup, ssrHydrationKey, ssrStyle, ssrStyleProperty, style, template, unregisterDelegatedContainer, unregisterDelegatedRoot, useHead, waitAsset, warmAsset };
