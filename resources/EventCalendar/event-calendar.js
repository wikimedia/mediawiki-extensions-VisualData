/*!
 * EventCalendar v4.5.1
 * https://github.com/vkurko/calendar
 */
var EventCalendar = function(exports) {
  "use strict";var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  var _previous, _callbacks, _pending, _deferred, _neutered, _async_effects, _boundary_async_effects, _render_effects, _effects, _block_effects, _dirty_effects, _maybe_dirty_effects, _Batch_instances, traverse_effect_tree_fn, defer_effects_fn, commit_fn, _a, _b, _c, _sources, _version, _size, _update_version, _SvelteSet_instances, source_fn, init_fn;
  const DEV = false;
  var is_array = Array.isArray;
  var index_of = Array.prototype.indexOf;
  var array_from = Array.from;
  var define_property = Object.defineProperty;
  var get_descriptor = Object.getOwnPropertyDescriptor;
  var get_descriptors = Object.getOwnPropertyDescriptors;
  var object_prototype = Object.prototype;
  var array_prototype = Array.prototype;
  var get_prototype_of = Object.getPrototypeOf;
  var is_extensible = Object.isExtensible;
  const noop$1 = () => {
  };
  function run$1(fn) {
    return fn();
  }
  function run_all(arr) {
    for (var i = 0; i < arr.length; i++) {
      arr[i]();
    }
  }
  function deferred() {
    var resolve;
    var reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
  function to_array(value, n) {
    if (Array.isArray(value)) {
      return value;
    }
    if (n === void 0 || !(Symbol.iterator in value)) {
      return Array.from(value);
    }
    const array = [];
    for (const element of value) {
      array.push(element);
      if (array.length === n) break;
    }
    return array;
  }
  const DERIVED = 1 << 1;
  const EFFECT = 1 << 2;
  const RENDER_EFFECT = 1 << 3;
  const BLOCK_EFFECT = 1 << 4;
  const BRANCH_EFFECT = 1 << 5;
  const ROOT_EFFECT = 1 << 6;
  const BOUNDARY_EFFECT = 1 << 7;
  const UNOWNED = 1 << 8;
  const DISCONNECTED = 1 << 9;
  const CLEAN = 1 << 10;
  const DIRTY = 1 << 11;
  const MAYBE_DIRTY = 1 << 12;
  const INERT = 1 << 13;
  const DESTROYED = 1 << 14;
  const EFFECT_RAN = 1 << 15;
  const EFFECT_TRANSPARENT = 1 << 16;
  const INSPECT_EFFECT = 1 << 17;
  const HEAD_EFFECT = 1 << 18;
  const EFFECT_PRESERVED = 1 << 19;
  const USER_EFFECT = 1 << 20;
  const REACTION_IS_UPDATING = 1 << 21;
  const ASYNC = 1 << 22;
  const ERROR_VALUE = 1 << 23;
  const STATE_SYMBOL = Symbol("$state");
  const LEGACY_PROPS = Symbol("legacy props");
  const LOADING_ATTR_SYMBOL = Symbol("");
  const STALE_REACTION = new class StaleReactionError extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "StaleReactionError");
      __publicField(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
    }
  }();
  function await_outside_boundary() {
    {
      throw new Error(`https://svelte.dev/e/await_outside_boundary`);
    }
  }
  function lifecycle_outside_component(name) {
    {
      throw new Error(`https://svelte.dev/e/lifecycle_outside_component`);
    }
  }
  function async_derived_orphan() {
    {
      throw new Error(`https://svelte.dev/e/async_derived_orphan`);
    }
  }
  function effect_in_teardown(rune) {
    {
      throw new Error(`https://svelte.dev/e/effect_in_teardown`);
    }
  }
  function effect_in_unowned_derived() {
    {
      throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
    }
  }
  function effect_orphan(rune) {
    {
      throw new Error(`https://svelte.dev/e/effect_orphan`);
    }
  }
  function effect_update_depth_exceeded() {
    {
      throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
    }
  }
  function props_invalid_value(key) {
    {
      throw new Error(`https://svelte.dev/e/props_invalid_value`);
    }
  }
  function state_descriptors_fixed() {
    {
      throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
    }
  }
  function state_prototype_fixed() {
    {
      throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
    }
  }
  function state_unsafe_mutation() {
    {
      throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
    }
  }
  const EACH_ITEM_REACTIVE = 1;
  const EACH_INDEX_REACTIVE = 1 << 1;
  const EACH_IS_CONTROLLED = 1 << 2;
  const EACH_IS_ANIMATED = 1 << 3;
  const EACH_ITEM_IMMUTABLE = 1 << 4;
  const PROPS_IS_IMMUTABLE = 1;
  const PROPS_IS_RUNES = 1 << 1;
  const PROPS_IS_UPDATED = 1 << 2;
  const PROPS_IS_BINDABLE = 1 << 3;
  const PROPS_IS_LAZY_INITIAL = 1 << 4;
  const TEMPLATE_FRAGMENT = 1;
  const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
  const UNINITIALIZED = Symbol();
  const NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
  let hydrating = false;
  function equals(value) {
    return value === this.v;
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
  }
  function safe_equals(value) {
    return !safe_not_equal(value, this.v);
  }
  let legacy_mode_flag = false;
  let tracing_mode_flag = false;
  function enable_legacy_mode_flag() {
    legacy_mode_flag = true;
  }
  let component_context = null;
  function set_component_context(context) {
    component_context = context;
  }
  function getContext(key) {
    const context_map = get_or_init_context_map();
    const result = (
      /** @type {T} */
      context_map.get(key)
    );
    return result;
  }
  function setContext(key, context) {
    const context_map = get_or_init_context_map();
    context_map.set(key, context);
    return context;
  }
  function push(props, runes = false, fn) {
    component_context = {
      p: component_context,
      c: null,
      e: null,
      s: props,
      x: null,
      l: legacy_mode_flag && !runes ? { s: null, u: null, $: [] } : null
    };
  }
  function pop(component2) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    var effects = context.e;
    if (effects !== null) {
      context.e = null;
      for (var fn of effects) {
        create_user_effect(fn);
      }
    }
    if (component2 !== void 0) {
      context.x = component2;
    }
    component_context = context.p;
    return component2 != null ? component2 : (
      /** @type {T} */
      {}
    );
  }
  function is_runes() {
    return !legacy_mode_flag || component_context !== null && component_context.l === null;
  }
  function get_or_init_context_map(name) {
    var _a2;
    if (component_context === null) {
      lifecycle_outside_component();
    }
    return (_a2 = component_context.c) != null ? _a2 : component_context.c = new Map(get_parent_context(component_context) || void 0);
  }
  function get_parent_context(component_context2) {
    let parent = component_context2.p;
    while (parent !== null) {
      const context_map = parent.c;
      if (context_map !== null) {
        return context_map;
      }
      parent = parent.p;
    }
    return null;
  }
  const adjustments = /* @__PURE__ */ new WeakMap();
  function handle_error(error) {
    var effect2 = active_effect;
    if (effect2 === null) {
      active_reaction.f |= ERROR_VALUE;
      return error;
    }
    if ((effect2.f & EFFECT_RAN) === 0) {
      if ((effect2.f & BOUNDARY_EFFECT) === 0) {
        if (!effect2.parent && error instanceof Error) {
          apply_adjustments(error);
        }
        throw error;
      }
      effect2.b.error(error);
    } else {
      invoke_error_boundary(error, effect2);
    }
  }
  function invoke_error_boundary(error, effect2) {
    while (effect2 !== null) {
      if ((effect2.f & BOUNDARY_EFFECT) !== 0) {
        try {
          effect2.b.error(error);
          return;
        } catch (e) {
          error = e;
        }
      }
      effect2 = effect2.parent;
    }
    if (error instanceof Error) {
      apply_adjustments(error);
    }
    throw error;
  }
  function apply_adjustments(error) {
    const adjusted = adjustments.get(error);
    if (adjusted) {
      define_property(error, "message", {
        value: adjusted.message
      });
      define_property(error, "stack", {
        value: adjusted.stack
      });
    }
  }
  let micro_tasks = [];
  let idle_tasks = [];
  function run_micro_tasks() {
    var tasks2 = micro_tasks;
    micro_tasks = [];
    run_all(tasks2);
  }
  function run_idle_tasks() {
    var tasks2 = idle_tasks;
    idle_tasks = [];
    run_all(tasks2);
  }
  function queue_micro_task(fn) {
    if (micro_tasks.length === 0) {
      queueMicrotask(run_micro_tasks);
    }
    micro_tasks.push(fn);
  }
  function flush_tasks() {
    if (micro_tasks.length > 0) {
      run_micro_tasks();
    }
    if (idle_tasks.length > 0) {
      run_idle_tasks();
    }
  }
  function get_pending_boundary() {
    var boundary = (
      /** @type {Effect} */
      active_effect.b
    );
    while (boundary !== null && !boundary.has_pending_snippet()) {
      boundary = boundary.parent;
    }
    if (boundary === null) {
      await_outside_boundary();
    }
    return boundary;
  }
  // @__NO_SIDE_EFFECTS__
  function derived$1(fn) {
    var flags = DERIVED | DIRTY;
    var parent_derived = active_reaction !== null && (active_reaction.f & DERIVED) !== 0 ? (
      /** @type {Derived} */
      active_reaction
    ) : null;
    if (active_effect === null || parent_derived !== null && (parent_derived.f & UNOWNED) !== 0) {
      flags |= UNOWNED;
    } else {
      active_effect.f |= EFFECT_PRESERVED;
    }
    const signal = {
      ctx: component_context,
      deps: null,
      effects: null,
      equals,
      f: flags,
      fn,
      reactions: null,
      rv: 0,
      v: (
        /** @type {V} */
        UNINITIALIZED
      ),
      wv: 0,
      parent: parent_derived != null ? parent_derived : active_effect,
      ac: null
    };
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function async_derived(fn, location) {
    let parent = (
      /** @type {Effect | null} */
      active_effect
    );
    if (parent === null) {
      async_derived_orphan();
    }
    var boundary = (
      /** @type {Boundary} */
      parent.b
    );
    var promise = (
      /** @type {Promise<V>} */
      /** @type {unknown} */
      void 0
    );
    var signal = source(
      /** @type {V} */
      UNINITIALIZED
    );
    var prev = null;
    var should_suspend = !active_reaction;
    async_effect(() => {
      var _a2;
      try {
        var p = fn();
      } catch (error) {
        p = Promise.reject(error);
      }
      var r2 = () => p;
      promise = (_a2 = prev == null ? void 0 : prev.then(r2, r2)) != null ? _a2 : Promise.resolve(p);
      prev = promise;
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var pending = boundary.pending;
      if (should_suspend) {
        boundary.update_pending_count(1);
        if (!pending) batch.increment();
      }
      const handler = (value, error = void 0) => {
        prev = null;
        if (!pending) batch.activate();
        if (error) {
          if (error !== STALE_REACTION) {
            signal.f |= ERROR_VALUE;
            internal_set(signal, error);
          }
        } else {
          if ((signal.f & ERROR_VALUE) !== 0) {
            signal.f ^= ERROR_VALUE;
          }
          internal_set(signal, value);
        }
        if (should_suspend) {
          boundary.update_pending_count(-1);
          if (!pending) batch.decrement();
        }
        unset_context();
      };
      promise.then(handler, (e) => handler(null, e || "unknown"));
      if (batch) {
        return () => {
          queueMicrotask(() => batch.neuter());
        };
      }
    });
    return new Promise((fulfil) => {
      function next(p) {
        function go() {
          if (p === promise) {
            fulfil(signal);
          } else {
            next(promise);
          }
        }
        p.then(go, go);
      }
      next(promise);
    });
  }
  // @__NO_SIDE_EFFECTS__
  function user_derived(fn) {
    const d = /* @__PURE__ */ derived$1(fn);
    push_reaction_value(d);
    return d;
  }
  // @__NO_SIDE_EFFECTS__
  function derived_safe_equal(fn) {
    const signal = /* @__PURE__ */ derived$1(fn);
    signal.equals = safe_equals;
    return signal;
  }
  function destroy_derived_effects(derived2) {
    var effects = derived2.effects;
    if (effects !== null) {
      derived2.effects = null;
      for (var i = 0; i < effects.length; i += 1) {
        destroy_effect(
          /** @type {Effect} */
          effects[i]
        );
      }
    }
  }
  function get_derived_parent_effect(derived2) {
    var parent = derived2.parent;
    while (parent !== null) {
      if ((parent.f & DERIVED) === 0) {
        return (
          /** @type {Effect} */
          parent
        );
      }
      parent = parent.parent;
    }
    return null;
  }
  function execute_derived(derived2) {
    var value;
    var prev_active_effect = active_effect;
    set_active_effect(get_derived_parent_effect(derived2));
    {
      try {
        destroy_derived_effects(derived2);
        value = update_reaction(derived2);
      } finally {
        set_active_effect(prev_active_effect);
      }
    }
    return value;
  }
  function update_derived(derived2) {
    var value = execute_derived(derived2);
    if (!derived2.equals(value)) {
      derived2.v = value;
      derived2.wv = increment_write_version();
    }
    if (is_destroying_effect) {
      return;
    }
    if (batch_deriveds !== null) {
      batch_deriveds.set(derived2, derived2.v);
    } else {
      var status = (skip_reaction || (derived2.f & UNOWNED) !== 0) && derived2.deps !== null ? MAYBE_DIRTY : CLEAN;
      set_signal_status(derived2, status);
    }
  }
  function flatten(sync, async, fn) {
    const d = is_runes() ? derived$1 : derived_safe_equal;
    if (async.length === 0) {
      fn(sync.map(d));
      return;
    }
    var batch = current_batch;
    var parent = (
      /** @type {Effect} */
      active_effect
    );
    var restore = capture();
    var boundary = get_pending_boundary();
    Promise.all(async.map((expression) => /* @__PURE__ */ async_derived(expression))).then((result) => {
      batch == null ? void 0 : batch.activate();
      restore();
      try {
        fn([...sync.map(d), ...result]);
      } catch (error) {
        if ((parent.f & DESTROYED) === 0) {
          invoke_error_boundary(error, parent);
        }
      }
      batch == null ? void 0 : batch.deactivate();
      unset_context();
    }).catch((error) => {
      boundary.error(error);
    });
  }
  function capture() {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_component_context = component_context;
    return function restore() {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_component_context);
    };
  }
  function unset_context() {
    set_active_effect(null);
    set_active_reaction(null);
    set_component_context(null);
  }
  const batches = /* @__PURE__ */ new Set();
  let current_batch = null;
  let batch_deriveds = null;
  let effect_pending_updates = /* @__PURE__ */ new Set();
  let tasks = [];
  function dequeue() {
    const task2 = (
      /** @type {() => void} */
      tasks.shift()
    );
    if (tasks.length > 0) {
      queueMicrotask(dequeue);
    }
    task2();
  }
  let queued_root_effects = [];
  let last_scheduled_effect = null;
  let is_flushing = false;
  let is_flushing_sync = false;
  const _Batch = class _Batch {
    constructor() {
      __privateAdd(this, _Batch_instances);
      /**
       * The current values of any sources that are updated in this batch
       * They keys of this map are identical to `this.#previous`
       * @type {Map<Source, any>}
       */
      __publicField(this, "current", /* @__PURE__ */ new Map());
      /**
       * The values of any sources that are updated in this batch _before_ those updates took place.
       * They keys of this map are identical to `this.#current`
       * @type {Map<Source, any>}
       */
      __privateAdd(this, _previous, /* @__PURE__ */ new Map());
      /**
       * When the batch is committed (and the DOM is updated), we need to remove old branches
       * and append new ones by calling the functions added inside (if/each/key/etc) blocks
       * @type {Set<() => void>}
       */
      __privateAdd(this, _callbacks, /* @__PURE__ */ new Set());
      /**
       * The number of async effects that are currently in flight
       */
      __privateAdd(this, _pending, 0);
      /**
       * A deferred that resolves when the batch is committed, used with `settled()`
       * TODO replace with Promise.withResolvers once supported widely enough
       * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
       */
      __privateAdd(this, _deferred, null);
      /**
       * True if an async effect inside this batch resolved and
       * its parent branch was already deleted
       */
      __privateAdd(this, _neutered, false);
      /**
       * Async effects (created inside `async_derived`) encountered during processing.
       * These run after the rest of the batch has updated, since they should
       * always have the latest values
       * @type {Effect[]}
       */
      __privateAdd(this, _async_effects, []);
      /**
       * The same as `#async_effects`, but for effects inside a newly-created
       * `<svelte:boundary>` — these do not prevent the batch from committing
       * @type {Effect[]}
       */
      __privateAdd(this, _boundary_async_effects, []);
      /**
       * Template effects and `$effect.pre` effects, which run when
       * a batch is committed
       * @type {Effect[]}
       */
      __privateAdd(this, _render_effects, []);
      /**
       * The same as `#render_effects`, but for `$effect` (which runs after)
       * @type {Effect[]}
       */
      __privateAdd(this, _effects, []);
      /**
       * Block effects, which may need to re-run on subsequent flushes
       * in order to update internal sources (e.g. each block items)
       * @type {Effect[]}
       */
      __privateAdd(this, _block_effects, []);
      /**
       * Deferred effects (which run after async work has completed) that are DIRTY
       * @type {Effect[]}
       */
      __privateAdd(this, _dirty_effects, []);
      /**
       * Deferred effects that are MAYBE_DIRTY
       * @type {Effect[]}
       */
      __privateAdd(this, _maybe_dirty_effects, []);
      /**
       * A set of branches that still exist, but will be destroyed when this batch
       * is committed — we skip over these during `process`
       * @type {Set<Effect>}
       */
      __publicField(this, "skipped_effects", /* @__PURE__ */ new Set());
    }
    /**
     *
     * @param {Effect[]} root_effects
     */
    process(root_effects) {
      var _a2;
      queued_root_effects = [];
      var current_values = null;
      if (batches.size > 1) {
        current_values = /* @__PURE__ */ new Map();
        batch_deriveds = /* @__PURE__ */ new Map();
        for (const [source2, current] of this.current) {
          current_values.set(source2, { v: source2.v, wv: source2.wv });
          source2.v = current;
        }
        for (const batch of batches) {
          if (batch === this) continue;
          for (const [source2, previous] of __privateGet(batch, _previous)) {
            if (!current_values.has(source2)) {
              current_values.set(source2, { v: source2.v, wv: source2.wv });
              source2.v = previous;
            }
          }
        }
      }
      for (const root2 of root_effects) {
        __privateMethod(this, _Batch_instances, traverse_effect_tree_fn).call(this, root2);
      }
      if (__privateGet(this, _async_effects).length === 0 && __privateGet(this, _pending) === 0) {
        __privateMethod(this, _Batch_instances, commit_fn).call(this);
        var render_effects = __privateGet(this, _render_effects);
        var effects = __privateGet(this, _effects);
        __privateSet(this, _render_effects, []);
        __privateSet(this, _effects, []);
        __privateSet(this, _block_effects, []);
        current_batch = null;
        flush_queued_effects(render_effects);
        flush_queued_effects(effects);
        if (current_batch === null) {
          current_batch = this;
        } else {
          batches.delete(this);
        }
        (_a2 = __privateGet(this, _deferred)) == null ? void 0 : _a2.resolve();
      } else {
        __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, __privateGet(this, _render_effects));
        __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, __privateGet(this, _effects));
        __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, __privateGet(this, _block_effects));
      }
      if (current_values) {
        for (const [source2, { v, wv }] of current_values) {
          if (source2.wv <= wv) {
            source2.v = v;
          }
        }
        batch_deriveds = null;
      }
      for (const effect2 of __privateGet(this, _async_effects)) {
        update_effect(effect2);
      }
      for (const effect2 of __privateGet(this, _boundary_async_effects)) {
        update_effect(effect2);
      }
      __privateSet(this, _async_effects, []);
      __privateSet(this, _boundary_async_effects, []);
    }
    /**
     * Associate a change to a given source with the current
     * batch, noting its previous and current values
     * @param {Source} source
     * @param {any} value
     */
    capture(source2, value) {
      if (!__privateGet(this, _previous).has(source2)) {
        __privateGet(this, _previous).set(source2, value);
      }
      this.current.set(source2, source2.v);
    }
    activate() {
      current_batch = this;
    }
    deactivate() {
      current_batch = null;
      for (const update of effect_pending_updates) {
        effect_pending_updates.delete(update);
        update();
        if (current_batch !== null) {
          break;
        }
      }
    }
    neuter() {
      __privateSet(this, _neutered, true);
    }
    flush() {
      if (queued_root_effects.length > 0) {
        flush_effects();
      } else {
        __privateMethod(this, _Batch_instances, commit_fn).call(this);
      }
      if (current_batch !== this) {
        return;
      }
      if (__privateGet(this, _pending) === 0) {
        batches.delete(this);
      }
      this.deactivate();
    }
    increment() {
      __privateSet(this, _pending, __privateGet(this, _pending) + 1);
    }
    decrement() {
      __privateSet(this, _pending, __privateGet(this, _pending) - 1);
      if (__privateGet(this, _pending) === 0) {
        for (const e of __privateGet(this, _dirty_effects)) {
          set_signal_status(e, DIRTY);
          schedule_effect(e);
        }
        for (const e of __privateGet(this, _maybe_dirty_effects)) {
          set_signal_status(e, MAYBE_DIRTY);
          schedule_effect(e);
        }
        __privateSet(this, _render_effects, []);
        __privateSet(this, _effects, []);
        this.flush();
      } else {
        this.deactivate();
      }
    }
    /** @param {() => void} fn */
    add_callback(fn) {
      __privateGet(this, _callbacks).add(fn);
    }
    settled() {
      var _a2;
      return ((_a2 = __privateGet(this, _deferred)) != null ? _a2 : __privateSet(this, _deferred, deferred())).promise;
    }
    static ensure() {
      if (current_batch === null) {
        const batch = current_batch = new _Batch();
        batches.add(current_batch);
        if (!is_flushing_sync) {
          _Batch.enqueue(() => {
            if (current_batch !== batch) {
              return;
            }
            batch.flush();
          });
        }
      }
      return current_batch;
    }
    /** @param {() => void} task */
    static enqueue(task2) {
      if (tasks.length === 0) {
        queueMicrotask(dequeue);
      }
      tasks.unshift(task2);
    }
  };
  _previous = new WeakMap();
  _callbacks = new WeakMap();
  _pending = new WeakMap();
  _deferred = new WeakMap();
  _neutered = new WeakMap();
  _async_effects = new WeakMap();
  _boundary_async_effects = new WeakMap();
  _render_effects = new WeakMap();
  _effects = new WeakMap();
  _block_effects = new WeakMap();
  _dirty_effects = new WeakMap();
  _maybe_dirty_effects = new WeakMap();
  _Batch_instances = new WeakSet();
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  traverse_effect_tree_fn = function(root2) {
    var _a2;
    root2.f ^= CLEAN;
    var effect2 = root2.first;
    while (effect2 !== null) {
      var flags = effect2.f;
      var is_branch = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags & INERT) !== 0 || this.skipped_effects.has(effect2);
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
        } else if ((flags & CLEAN) === 0) {
          if ((flags & EFFECT) !== 0) {
            __privateGet(this, _effects).push(effect2);
          } else if ((flags & ASYNC) !== 0) {
            var effects = ((_a2 = effect2.b) == null ? void 0 : _a2.pending) ? __privateGet(this, _boundary_async_effects) : __privateGet(this, _async_effects);
            effects.push(effect2);
          } else if (is_dirty(effect2)) {
            if ((effect2.f & BLOCK_EFFECT) !== 0) __privateGet(this, _block_effects).push(effect2);
            update_effect(effect2);
          }
        }
        var child2 = effect2.first;
        if (child2 !== null) {
          effect2 = child2;
          continue;
        }
      }
      var parent = effect2.parent;
      effect2 = effect2.next;
      while (effect2 === null && parent !== null) {
        effect2 = parent.next;
        parent = parent.parent;
      }
    }
  };
  /**
   * @param {Effect[]} effects
   */
  defer_effects_fn = function(effects) {
    for (const e of effects) {
      const target = (e.f & DIRTY) !== 0 ? __privateGet(this, _dirty_effects) : __privateGet(this, _maybe_dirty_effects);
      target.push(e);
      set_signal_status(e, CLEAN);
    }
    effects.length = 0;
  };
  /**
   * Append and remove branches to/from the DOM
   */
  commit_fn = function() {
    if (!__privateGet(this, _neutered)) {
      for (const fn of __privateGet(this, _callbacks)) {
        fn();
      }
    }
    __privateGet(this, _callbacks).clear();
  };
  let Batch = _Batch;
  function flushSync(fn) {
    var was_flushing_sync = is_flushing_sync;
    is_flushing_sync = true;
    try {
      var result;
      if (fn) ;
      while (true) {
        flush_tasks();
        if (queued_root_effects.length === 0) {
          current_batch == null ? void 0 : current_batch.flush();
          if (queued_root_effects.length === 0) {
            last_scheduled_effect = null;
            return (
              /** @type {T} */
              result
            );
          }
        }
        flush_effects();
      }
    } finally {
      is_flushing_sync = was_flushing_sync;
    }
  }
  function flush_effects() {
    var was_updating_effect = is_updating_effect;
    is_flushing = true;
    try {
      var flush_count = 0;
      set_is_updating_effect(true);
      while (queued_root_effects.length > 0) {
        var batch = Batch.ensure();
        if (flush_count++ > 1e3) {
          var updates, entry;
          if (DEV) ;
          infinite_loop_guard();
        }
        batch.process(queued_root_effects);
        old_values.clear();
      }
    } finally {
      is_flushing = false;
      set_is_updating_effect(was_updating_effect);
      last_scheduled_effect = null;
    }
  }
  function infinite_loop_guard() {
    try {
      effect_update_depth_exceeded();
    } catch (error) {
      invoke_error_boundary(error, last_scheduled_effect);
    }
  }
  function flush_queued_effects(effects) {
    var length = effects.length;
    if (length === 0) return;
    var i = 0;
    while (i < length) {
      var effect2 = effects[i++];
      if ((effect2.f & (DESTROYED | INERT)) === 0 && is_dirty(effect2)) {
        var n = current_batch ? current_batch.current.size : 0;
        update_effect(effect2);
        if (effect2.deps === null && effect2.first === null && effect2.nodes_start === null) {
          if (effect2.teardown === null && effect2.ac === null) {
            unlink_effect(effect2);
          } else {
            effect2.fn = null;
          }
        }
        if (current_batch !== null && current_batch.current.size > n && (effect2.f & USER_EFFECT) !== 0) {
          break;
        }
      }
    }
    while (i < length) {
      schedule_effect(effects[i++]);
    }
  }
  function schedule_effect(signal) {
    var effect2 = last_scheduled_effect = signal;
    while (effect2.parent !== null) {
      effect2 = effect2.parent;
      var flags = effect2.f;
      if (is_flushing && effect2 === active_effect && (flags & BLOCK_EFFECT) !== 0) {
        return;
      }
      if ((flags & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
        if ((flags & CLEAN) === 0) return;
        effect2.f ^= CLEAN;
      }
    }
    queued_root_effects.push(effect2);
  }
  const old_values = /* @__PURE__ */ new Map();
  function source(v, stack) {
    var signal = {
      f: 0,
      // TODO ideally we could skip this altogether, but it causes type errors
      v,
      reactions: null,
      equals,
      rv: 0,
      wv: 0
    };
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function state(v, stack) {
    const s = source(v);
    push_reaction_value(s);
    return s;
  }
  // @__NO_SIDE_EFFECTS__
  function mutable_source(initial_value, immutable = false, trackable = true) {
    var _a2, _b2;
    const s = source(initial_value);
    if (!immutable) {
      s.equals = safe_equals;
    }
    if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) {
      ((_b2 = (_a2 = component_context.l).s) != null ? _b2 : _a2.s = []).push(s);
    }
    return s;
  }
  function set(source2, value, should_proxy = false) {
    if (active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
    // to ensure we error if state is set inside an inspect effect
    (!untracking || (active_reaction.f & INSPECT_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | INSPECT_EFFECT)) !== 0 && !(current_sources == null ? void 0 : current_sources.includes(source2))) {
      state_unsafe_mutation();
    }
    let new_value = should_proxy ? proxy(value) : value;
    return internal_set(source2, new_value);
  }
  function internal_set(source2, value) {
    if (!source2.equals(value)) {
      var old_value = source2.v;
      if (is_destroying_effect) {
        old_values.set(source2, value);
      } else {
        old_values.set(source2, old_value);
      }
      source2.v = value;
      var batch = Batch.ensure();
      batch.capture(source2, old_value);
      if ((source2.f & DERIVED) !== 0) {
        if ((source2.f & DIRTY) !== 0) {
          execute_derived(
            /** @type {Derived} */
            source2
          );
        }
        set_signal_status(source2, (source2.f & UNOWNED) === 0 ? CLEAN : MAYBE_DIRTY);
      }
      source2.wv = increment_write_version();
      mark_reactions(source2, DIRTY);
      if (is_runes() && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
        if (untracked_writes === null) {
          set_untracked_writes([source2]);
        } else {
          untracked_writes.push(source2);
        }
      }
    }
    return value;
  }
  function increment(source2) {
    set(source2, source2.v + 1);
  }
  function mark_reactions(signal, status) {
    var reactions = signal.reactions;
    if (reactions === null) return;
    var runes = is_runes();
    var length = reactions.length;
    for (var i = 0; i < length; i++) {
      var reaction = reactions[i];
      var flags = reaction.f;
      if (!runes && reaction === active_effect) continue;
      var not_dirty = (flags & DIRTY) === 0;
      if (not_dirty) {
        set_signal_status(reaction, status);
      }
      if ((flags & DERIVED) !== 0) {
        mark_reactions(
          /** @type {Derived} */
          reaction,
          MAYBE_DIRTY
        );
      } else if (not_dirty) {
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
  function proxy(value) {
    if (typeof value !== "object" || value === null || STATE_SYMBOL in value) {
      return value;
    }
    const prototype = get_prototype_of(value);
    if (prototype !== object_prototype && prototype !== array_prototype) {
      return value;
    }
    var sources = /* @__PURE__ */ new Map();
    var is_proxied_array = is_array(value);
    var version = /* @__PURE__ */ state(0);
    var parent_version = update_version;
    var with_parent = (fn) => {
      if (update_version === parent_version) {
        return fn();
      }
      var reaction = active_reaction;
      var version2 = update_version;
      set_active_reaction(null);
      set_update_version(parent_version);
      var result = fn();
      set_active_reaction(reaction);
      set_update_version(version2);
      return result;
    };
    if (is_proxied_array) {
      sources.set("length", /* @__PURE__ */ state(
        /** @type {any[]} */
        value.length
      ));
    }
    return new Proxy(
      /** @type {any} */
      value,
      {
        defineProperty(_, prop2, descriptor) {
          if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
            state_descriptors_fixed();
          }
          var s = sources.get(prop2);
          if (s === void 0) {
            s = with_parent(() => {
              var s2 = /* @__PURE__ */ state(descriptor.value);
              sources.set(prop2, s2);
              return s2;
            });
          } else {
            set(s, descriptor.value, true);
          }
          return true;
        },
        deleteProperty(target, prop2) {
          var s = sources.get(prop2);
          if (s === void 0) {
            if (prop2 in target) {
              const s2 = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
              sources.set(prop2, s2);
              increment(version);
            }
          } else {
            set(s, UNINITIALIZED);
            increment(version);
          }
          return true;
        },
        get(target, prop2, receiver) {
          var _a2;
          if (prop2 === STATE_SYMBOL) {
            return value;
          }
          var s = sources.get(prop2);
          var exists = prop2 in target;
          if (s === void 0 && (!exists || ((_a2 = get_descriptor(target, prop2)) == null ? void 0 : _a2.writable))) {
            s = with_parent(() => {
              var p = proxy(exists ? target[prop2] : UNINITIALIZED);
              var s2 = /* @__PURE__ */ state(p);
              return s2;
            });
            sources.set(prop2, s);
          }
          if (s !== void 0) {
            var v = get$1(s);
            return v === UNINITIALIZED ? void 0 : v;
          }
          return Reflect.get(target, prop2, receiver);
        },
        getOwnPropertyDescriptor(target, prop2) {
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          if (descriptor && "value" in descriptor) {
            var s = sources.get(prop2);
            if (s) descriptor.value = get$1(s);
          } else if (descriptor === void 0) {
            var source2 = sources.get(prop2);
            var value2 = source2 == null ? void 0 : source2.v;
            if (source2 !== void 0 && value2 !== UNINITIALIZED) {
              return {
                enumerable: true,
                configurable: true,
                value: value2,
                writable: true
              };
            }
          }
          return descriptor;
        },
        has(target, prop2) {
          var _a2;
          if (prop2 === STATE_SYMBOL) {
            return true;
          }
          var s = sources.get(prop2);
          var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop2);
          if (s !== void 0 || active_effect !== null && (!has || ((_a2 = get_descriptor(target, prop2)) == null ? void 0 : _a2.writable))) {
            if (s === void 0) {
              s = with_parent(() => {
                var p = has ? proxy(target[prop2]) : UNINITIALIZED;
                var s2 = /* @__PURE__ */ state(p);
                return s2;
              });
              sources.set(prop2, s);
            }
            var value2 = get$1(s);
            if (value2 === UNINITIALIZED) {
              return false;
            }
          }
          return has;
        },
        set(target, prop2, value2, receiver) {
          var _a2;
          var s = sources.get(prop2);
          var has = prop2 in target;
          if (is_proxied_array && prop2 === "length") {
            for (var i = value2; i < /** @type {Source<number>} */
            s.v; i += 1) {
              var other_s = sources.get(i + "");
              if (other_s !== void 0) {
                set(other_s, UNINITIALIZED);
              } else if (i in target) {
                other_s = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
                sources.set(i + "", other_s);
              }
            }
          }
          if (s === void 0) {
            if (!has || ((_a2 = get_descriptor(target, prop2)) == null ? void 0 : _a2.writable)) {
              s = with_parent(() => /* @__PURE__ */ state(void 0));
              set(s, proxy(value2));
              sources.set(prop2, s);
            }
          } else {
            has = s.v !== UNINITIALIZED;
            var p = with_parent(() => proxy(value2));
            set(s, p);
          }
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          if (descriptor == null ? void 0 : descriptor.set) {
            descriptor.set.call(receiver, value2);
          }
          if (!has) {
            if (is_proxied_array && typeof prop2 === "string") {
              var ls = (
                /** @type {Source<number>} */
                sources.get("length")
              );
              var n = Number(prop2);
              if (Number.isInteger(n) && n >= ls.v) {
                set(ls, n + 1);
              }
            }
            increment(version);
          }
          return true;
        },
        ownKeys(target) {
          get$1(version);
          var own_keys = Reflect.ownKeys(target).filter((key2) => {
            var source3 = sources.get(key2);
            return source3 === void 0 || source3.v !== UNINITIALIZED;
          });
          for (var [key, source2] of sources) {
            if (source2.v !== UNINITIALIZED && !(key in target)) {
              own_keys.push(key);
            }
          }
          return own_keys;
        },
        setPrototypeOf() {
          state_prototype_fixed();
        }
      }
    );
  }
  var $window;
  var is_firefox;
  var first_child_getter;
  var next_sibling_getter;
  function init_operations() {
    if ($window !== void 0) {
      return;
    }
    $window = window;
    is_firefox = /Firefox/.test(navigator.userAgent);
    var element_prototype = Element.prototype;
    var node_prototype = Node.prototype;
    var text_prototype = Text.prototype;
    first_child_getter = get_descriptor(node_prototype, "firstChild").get;
    next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
    if (is_extensible(element_prototype)) {
      element_prototype.__click = void 0;
      element_prototype.__className = void 0;
      element_prototype.__attributes = null;
      element_prototype.__style = void 0;
      element_prototype.__e = void 0;
    }
    if (is_extensible(text_prototype)) {
      text_prototype.__t = void 0;
    }
  }
  function create_text(value = "") {
    return document.createTextNode(value);
  }
  // @__NO_SIDE_EFFECTS__
  function get_first_child(node) {
    return first_child_getter.call(node);
  }
  // @__NO_SIDE_EFFECTS__
  function get_next_sibling(node) {
    return next_sibling_getter.call(node);
  }
  function child(node, is_text) {
    {
      return /* @__PURE__ */ get_first_child(node);
    }
  }
  function first_child(fragment, is_text) {
    {
      var first = (
        /** @type {DocumentFragment} */
        /* @__PURE__ */ get_first_child(
          /** @type {Node} */
          fragment
        )
      );
      if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
      return first;
    }
  }
  function sibling(node, count = 1, is_text = false) {
    let next_sibling = node;
    while (count--) {
      next_sibling = /** @type {TemplateNode} */
      /* @__PURE__ */ get_next_sibling(next_sibling);
    }
    {
      return next_sibling;
    }
  }
  function clear_text_content(node) {
    node.textContent = "";
  }
  function should_defer_append() {
    return false;
  }
  function validate_effect(rune) {
    if (active_effect === null && active_reaction === null) {
      effect_orphan();
    }
    if (active_reaction !== null && (active_reaction.f & UNOWNED) !== 0 && active_effect === null) {
      effect_in_unowned_derived();
    }
    if (is_destroying_effect) {
      effect_in_teardown();
    }
  }
  function push_effect(effect2, parent_effect) {
    var parent_last = parent_effect.last;
    if (parent_last === null) {
      parent_effect.last = parent_effect.first = effect2;
    } else {
      parent_last.next = effect2;
      effect2.prev = parent_last;
      parent_effect.last = effect2;
    }
  }
  function create_effect(type, fn, sync, push2 = true) {
    var _a2;
    var parent = active_effect;
    if (parent !== null && (parent.f & INERT) !== 0) {
      type |= INERT;
    }
    var effect2 = {
      ctx: component_context,
      deps: null,
      nodes_start: null,
      nodes_end: null,
      f: type | DIRTY,
      first: null,
      fn,
      last: null,
      next: null,
      parent,
      b: parent && parent.b,
      prev: null,
      teardown: null,
      transitions: null,
      wv: 0,
      ac: null
    };
    if (sync) {
      try {
        update_effect(effect2);
        effect2.f |= EFFECT_RAN;
      } catch (e) {
        destroy_effect(effect2);
        throw e;
      }
    } else if (fn !== null) {
      schedule_effect(effect2);
    }
    var inert = sync && effect2.deps === null && effect2.first === null && effect2.nodes_start === null && effect2.teardown === null && (effect2.f & EFFECT_PRESERVED) === 0;
    if (!inert && push2) {
      if (parent !== null) {
        push_effect(effect2, parent);
      }
      if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0 && (type & ROOT_EFFECT) === 0) {
        var derived2 = (
          /** @type {Derived} */
          active_reaction
        );
        ((_a2 = derived2.effects) != null ? _a2 : derived2.effects = []).push(effect2);
      }
    }
    return effect2;
  }
  function teardown(fn) {
    const effect2 = create_effect(RENDER_EFFECT, null, false);
    set_signal_status(effect2, CLEAN);
    effect2.teardown = fn;
    return effect2;
  }
  function user_effect(fn) {
    var _a2;
    validate_effect();
    var flags = (
      /** @type {Effect} */
      active_effect.f
    );
    var defer = !active_reaction && (flags & BRANCH_EFFECT) !== 0 && (flags & EFFECT_RAN) === 0;
    if (defer) {
      var context = (
        /** @type {ComponentContext} */
        component_context
      );
      ((_a2 = context.e) != null ? _a2 : context.e = []).push(fn);
    } else {
      return create_user_effect(fn);
    }
  }
  function create_user_effect(fn) {
    return create_effect(EFFECT | USER_EFFECT, fn, false);
  }
  function user_pre_effect(fn) {
    validate_effect();
    return create_effect(RENDER_EFFECT | USER_EFFECT, fn, true);
  }
  function component_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT, fn, true);
    return (options = {}) => {
      return new Promise((fulfil) => {
        if (options.outro) {
          pause_effect(effect2, () => {
            destroy_effect(effect2);
            fulfil(void 0);
          });
        } else {
          destroy_effect(effect2);
          fulfil(void 0);
        }
      });
    };
  }
  function effect(fn) {
    return create_effect(EFFECT, fn, false);
  }
  function legacy_pre_effect(deps, fn) {
    var context = (
      /** @type {ComponentContextLegacy} */
      component_context
    );
    var token = { effect: null, ran: false, deps };
    context.l.$.push(token);
    token.effect = render_effect(() => {
      deps();
      if (token.ran) return;
      token.ran = true;
      untrack(fn);
    });
  }
  function legacy_pre_effect_reset() {
    var context = (
      /** @type {ComponentContextLegacy} */
      component_context
    );
    render_effect(() => {
      for (var token of context.l.$) {
        token.deps();
        var effect2 = token.effect;
        if ((effect2.f & CLEAN) !== 0) {
          set_signal_status(effect2, MAYBE_DIRTY);
        }
        if (is_dirty(effect2)) {
          update_effect(effect2);
        }
        token.ran = false;
      }
    });
  }
  function async_effect(fn) {
    return create_effect(ASYNC | EFFECT_PRESERVED, fn, true);
  }
  function render_effect(fn, flags = 0) {
    return create_effect(RENDER_EFFECT | flags, fn, true);
  }
  function template_effect(fn, sync = [], async = []) {
    flatten(sync, async, (values) => {
      create_effect(RENDER_EFFECT, () => fn(...values.map(get$1)), true);
    });
  }
  function block(fn, flags = 0) {
    var effect2 = create_effect(BLOCK_EFFECT | flags, fn, true);
    return effect2;
  }
  function branch(fn, push2 = true) {
    return create_effect(BRANCH_EFFECT, fn, true, push2);
  }
  function execute_effect_teardown(effect2) {
    var teardown2 = effect2.teardown;
    if (teardown2 !== null) {
      const previously_destroying_effect = is_destroying_effect;
      const previous_reaction = active_reaction;
      set_is_destroying_effect(true);
      set_active_reaction(null);
      try {
        teardown2.call(null);
      } finally {
        set_is_destroying_effect(previously_destroying_effect);
        set_active_reaction(previous_reaction);
      }
    }
  }
  function destroy_effect_children(signal, remove_dom = false) {
    var _a2;
    var effect2 = signal.first;
    signal.first = signal.last = null;
    while (effect2 !== null) {
      (_a2 = effect2.ac) == null ? void 0 : _a2.abort(STALE_REACTION);
      var next = effect2.next;
      if ((effect2.f & ROOT_EFFECT) !== 0) {
        effect2.parent = null;
      } else {
        destroy_effect(effect2, remove_dom);
      }
      effect2 = next;
    }
  }
  function destroy_block_effect_children(signal) {
    var effect2 = signal.first;
    while (effect2 !== null) {
      var next = effect2.next;
      if ((effect2.f & BRANCH_EFFECT) === 0) {
        destroy_effect(effect2);
      }
      effect2 = next;
    }
  }
  function destroy_effect(effect2, remove_dom = true) {
    var removed = false;
    if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes_start !== null && effect2.nodes_end !== null) {
      remove_effect_dom(
        effect2.nodes_start,
        /** @type {TemplateNode} */
        effect2.nodes_end
      );
      removed = true;
    }
    destroy_effect_children(effect2, remove_dom && !removed);
    remove_reactions(effect2, 0);
    set_signal_status(effect2, DESTROYED);
    var transitions = effect2.transitions;
    if (transitions !== null) {
      for (const transition of transitions) {
        transition.stop();
      }
    }
    execute_effect_teardown(effect2);
    var parent = effect2.parent;
    if (parent !== null && parent.first !== null) {
      unlink_effect(effect2);
    }
    effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes_start = effect2.nodes_end = effect2.ac = null;
  }
  function remove_effect_dom(node, end) {
    while (node !== null) {
      var next = node === end ? null : (
        /** @type {TemplateNode} */
        /* @__PURE__ */ get_next_sibling(node)
      );
      node.remove();
      node = next;
    }
  }
  function unlink_effect(effect2) {
    var parent = effect2.parent;
    var prev = effect2.prev;
    var next = effect2.next;
    if (prev !== null) prev.next = next;
    if (next !== null) next.prev = prev;
    if (parent !== null) {
      if (parent.first === effect2) parent.first = next;
      if (parent.last === effect2) parent.last = prev;
    }
  }
  function pause_effect(effect2, callback) {
    var transitions = [];
    pause_children(effect2, transitions, true);
    run_out_transitions(transitions, () => {
      destroy_effect(effect2);
      if (callback) callback();
    });
  }
  function run_out_transitions(transitions, fn) {
    var remaining = transitions.length;
    if (remaining > 0) {
      var check = () => --remaining || fn();
      for (var transition of transitions) {
        transition.out(check);
      }
    } else {
      fn();
    }
  }
  function pause_children(effect2, transitions, local) {
    if ((effect2.f & INERT) !== 0) return;
    effect2.f ^= INERT;
    if (effect2.transitions !== null) {
      for (const transition of effect2.transitions) {
        if (transition.is_global || local) {
          transitions.push(transition);
        }
      }
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
      pause_children(child2, transitions, transparent ? local : false);
      child2 = sibling2;
    }
  }
  function resume_effect(effect2) {
    resume_children(effect2, true);
  }
  function resume_children(effect2, local) {
    if ((effect2.f & INERT) === 0) return;
    effect2.f ^= INERT;
    if ((effect2.f & CLEAN) === 0) {
      set_signal_status(effect2, DIRTY);
      schedule_effect(effect2);
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
      resume_children(child2, transparent ? local : false);
      child2 = sibling2;
    }
    if (effect2.transitions !== null) {
      for (const transition of effect2.transitions) {
        if (transition.is_global || local) {
          transition.in();
        }
      }
    }
  }
  let is_updating_effect = false;
  function set_is_updating_effect(value) {
    is_updating_effect = value;
  }
  let is_destroying_effect = false;
  function set_is_destroying_effect(value) {
    is_destroying_effect = value;
  }
  let active_reaction = null;
  let untracking = false;
  function set_active_reaction(reaction) {
    active_reaction = reaction;
  }
  let active_effect = null;
  function set_active_effect(effect2) {
    active_effect = effect2;
  }
  let current_sources = null;
  function push_reaction_value(value) {
    if (active_reaction !== null && true) {
      if (current_sources === null) {
        current_sources = [value];
      } else {
        current_sources.push(value);
      }
    }
  }
  let new_deps = null;
  let skipped_deps = 0;
  let untracked_writes = null;
  function set_untracked_writes(value) {
    untracked_writes = value;
  }
  let write_version = 1;
  let read_version = 0;
  let update_version = read_version;
  function set_update_version(value) {
    update_version = value;
  }
  let skip_reaction = false;
  function increment_write_version() {
    return ++write_version;
  }
  function is_dirty(reaction) {
    var _a2, _b2;
    var flags = reaction.f;
    if ((flags & DIRTY) !== 0) {
      return true;
    }
    if ((flags & MAYBE_DIRTY) !== 0) {
      var dependencies = reaction.deps;
      var is_unowned = (flags & UNOWNED) !== 0;
      if (dependencies !== null) {
        var i;
        var dependency;
        var is_disconnected = (flags & DISCONNECTED) !== 0;
        var is_unowned_connected = is_unowned && active_effect !== null && !skip_reaction;
        var length = dependencies.length;
        if ((is_disconnected || is_unowned_connected) && (active_effect === null || (active_effect.f & DESTROYED) === 0)) {
          var derived2 = (
            /** @type {Derived} */
            reaction
          );
          var parent = derived2.parent;
          for (i = 0; i < length; i++) {
            dependency = dependencies[i];
            if (is_disconnected || !((_a2 = dependency == null ? void 0 : dependency.reactions) == null ? void 0 : _a2.includes(derived2))) {
              ((_b2 = dependency.reactions) != null ? _b2 : dependency.reactions = []).push(derived2);
            }
          }
          if (is_disconnected) {
            derived2.f ^= DISCONNECTED;
          }
          if (is_unowned_connected && parent !== null && (parent.f & UNOWNED) === 0) {
            derived2.f ^= UNOWNED;
          }
        }
        for (i = 0; i < length; i++) {
          dependency = dependencies[i];
          if (is_dirty(
            /** @type {Derived} */
            dependency
          )) {
            update_derived(
              /** @type {Derived} */
              dependency
            );
          }
          if (dependency.wv > reaction.wv) {
            return true;
          }
        }
      }
      if (!is_unowned || active_effect !== null && !skip_reaction) {
        set_signal_status(reaction, CLEAN);
      }
    }
    return false;
  }
  function schedule_possible_effect_self_invalidation(signal, effect2, root2 = true) {
    var reactions = signal.reactions;
    if (reactions === null) return;
    if (current_sources == null ? void 0 : current_sources.includes(signal)) {
      return;
    }
    for (var i = 0; i < reactions.length; i++) {
      var reaction = reactions[i];
      if ((reaction.f & DERIVED) !== 0) {
        schedule_possible_effect_self_invalidation(
          /** @type {Derived} */
          reaction,
          effect2,
          false
        );
      } else if (effect2 === reaction) {
        if (root2) {
          set_signal_status(reaction, DIRTY);
        } else if ((reaction.f & CLEAN) !== 0) {
          set_signal_status(reaction, MAYBE_DIRTY);
        }
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
  function update_reaction(reaction) {
    var _a2, _b2;
    var previous_deps = new_deps;
    var previous_skipped_deps = skipped_deps;
    var previous_untracked_writes = untracked_writes;
    var previous_reaction = active_reaction;
    var previous_skip_reaction = skip_reaction;
    var previous_sources = current_sources;
    var previous_component_context = component_context;
    var previous_untracking = untracking;
    var previous_update_version = update_version;
    var flags = reaction.f;
    new_deps = /** @type {null | Value[]} */
    null;
    skipped_deps = 0;
    untracked_writes = null;
    skip_reaction = (flags & UNOWNED) !== 0 && (untracking || !is_updating_effect || active_reaction === null);
    active_reaction = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
    current_sources = null;
    set_component_context(reaction.ctx);
    untracking = false;
    update_version = ++read_version;
    if (reaction.ac !== null) {
      reaction.ac.abort(STALE_REACTION);
      reaction.ac = null;
    }
    try {
      reaction.f |= REACTION_IS_UPDATING;
      var result = (
        /** @type {Function} */
        (0, reaction.fn)()
      );
      var deps = reaction.deps;
      if (new_deps !== null) {
        var i;
        remove_reactions(reaction, skipped_deps);
        if (deps !== null && skipped_deps > 0) {
          deps.length = skipped_deps + new_deps.length;
          for (i = 0; i < new_deps.length; i++) {
            deps[skipped_deps + i] = new_deps[i];
          }
        } else {
          reaction.deps = deps = new_deps;
        }
        if (!skip_reaction || // Deriveds that already have reactions can cleanup, so we still add them as reactions
        (flags & DERIVED) !== 0 && /** @type {import('#client').Derived} */
        reaction.reactions !== null) {
          for (i = skipped_deps; i < deps.length; i++) {
            ((_b2 = (_a2 = deps[i]).reactions) != null ? _b2 : _a2.reactions = []).push(reaction);
          }
        }
      } else if (deps !== null && skipped_deps < deps.length) {
        remove_reactions(reaction, skipped_deps);
        deps.length = skipped_deps;
      }
      if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
        for (i = 0; i < /** @type {Source[]} */
        untracked_writes.length; i++) {
          schedule_possible_effect_self_invalidation(
            untracked_writes[i],
            /** @type {Effect} */
            reaction
          );
        }
      }
      if (previous_reaction !== null && previous_reaction !== reaction) {
        read_version++;
        if (untracked_writes !== null) {
          if (previous_untracked_writes === null) {
            previous_untracked_writes = untracked_writes;
          } else {
            previous_untracked_writes.push(.../** @type {Source[]} */
            untracked_writes);
          }
        }
      }
      if ((reaction.f & ERROR_VALUE) !== 0) {
        reaction.f ^= ERROR_VALUE;
      }
      return result;
    } catch (error) {
      return handle_error(error);
    } finally {
      reaction.f ^= REACTION_IS_UPDATING;
      new_deps = previous_deps;
      skipped_deps = previous_skipped_deps;
      untracked_writes = previous_untracked_writes;
      active_reaction = previous_reaction;
      skip_reaction = previous_skip_reaction;
      current_sources = previous_sources;
      set_component_context(previous_component_context);
      untracking = previous_untracking;
      update_version = previous_update_version;
    }
  }
  function remove_reaction(signal, dependency) {
    let reactions = dependency.reactions;
    if (reactions !== null) {
      var index2 = index_of.call(reactions, signal);
      if (index2 !== -1) {
        var new_length = reactions.length - 1;
        if (new_length === 0) {
          reactions = dependency.reactions = null;
        } else {
          reactions[index2] = reactions[new_length];
          reactions.pop();
        }
      }
    }
    if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
    // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
    // allows us to skip the expensive work of disconnecting and immediately reconnecting it
    (new_deps === null || !new_deps.includes(dependency))) {
      set_signal_status(dependency, MAYBE_DIRTY);
      if ((dependency.f & (UNOWNED | DISCONNECTED)) === 0) {
        dependency.f ^= DISCONNECTED;
      }
      destroy_derived_effects(
        /** @type {Derived} **/
        dependency
      );
      remove_reactions(
        /** @type {Derived} **/
        dependency,
        0
      );
    }
  }
  function remove_reactions(signal, start_index) {
    var dependencies = signal.deps;
    if (dependencies === null) return;
    for (var i = start_index; i < dependencies.length; i++) {
      remove_reaction(signal, dependencies[i]);
    }
  }
  function update_effect(effect2) {
    var flags = effect2.f;
    if ((flags & DESTROYED) !== 0) {
      return;
    }
    set_signal_status(effect2, CLEAN);
    var previous_effect = active_effect;
    var was_updating_effect = is_updating_effect;
    active_effect = effect2;
    is_updating_effect = true;
    try {
      if ((flags & BLOCK_EFFECT) !== 0) {
        destroy_block_effect_children(effect2);
      } else {
        destroy_effect_children(effect2);
      }
      execute_effect_teardown(effect2);
      var teardown2 = update_reaction(effect2);
      effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
      effect2.wv = write_version;
      var dep;
      if (DEV && tracing_mode_flag && (effect2.f & DIRTY) !== 0 && effect2.deps !== null) ;
    } finally {
      is_updating_effect = was_updating_effect;
      active_effect = previous_effect;
    }
  }
  async function tick() {
    await Promise.resolve();
    flushSync();
  }
  function get$1(signal) {
    var _a2;
    var flags = signal.f;
    var is_derived = (flags & DERIVED) !== 0;
    if (active_reaction !== null && !untracking) {
      var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
      if (!destroyed && !(current_sources == null ? void 0 : current_sources.includes(signal))) {
        var deps = active_reaction.deps;
        if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
          if (signal.rv < read_version) {
            signal.rv = read_version;
            if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
              skipped_deps++;
            } else if (new_deps === null) {
              new_deps = [signal];
            } else if (!skip_reaction || !new_deps.includes(signal)) {
              new_deps.push(signal);
            }
          }
        } else {
          ((_a2 = active_reaction.deps) != null ? _a2 : active_reaction.deps = []).push(signal);
          var reactions = signal.reactions;
          if (reactions === null) {
            signal.reactions = [active_reaction];
          } else if (!reactions.includes(active_reaction)) {
            reactions.push(active_reaction);
          }
        }
      }
    } else if (is_derived && /** @type {Derived} */
    signal.deps === null && /** @type {Derived} */
    signal.effects === null) {
      var derived2 = (
        /** @type {Derived} */
        signal
      );
      var parent = derived2.parent;
      if (parent !== null && (parent.f & UNOWNED) === 0) {
        derived2.f ^= UNOWNED;
      }
    }
    if (is_destroying_effect) {
      if (old_values.has(signal)) {
        return old_values.get(signal);
      }
      if (is_derived) {
        derived2 = /** @type {Derived} */
        signal;
        var value = derived2.v;
        if ((derived2.f & CLEAN) === 0 && derived2.reactions !== null || depends_on_old_values(derived2)) {
          value = execute_derived(derived2);
        }
        old_values.set(derived2, value);
        return value;
      }
    } else if (is_derived) {
      derived2 = /** @type {Derived} */
      signal;
      if (batch_deriveds == null ? void 0 : batch_deriveds.has(derived2)) {
        return batch_deriveds.get(derived2);
      }
      if (is_dirty(derived2)) {
        update_derived(derived2);
      }
    }
    if ((signal.f & ERROR_VALUE) !== 0) {
      throw signal.v;
    }
    return signal.v;
  }
  function depends_on_old_values(derived2) {
    if (derived2.v === UNINITIALIZED) return true;
    if (derived2.deps === null) return false;
    for (const dep of derived2.deps) {
      if (old_values.has(dep)) {
        return true;
      }
      if ((dep.f & DERIVED) !== 0 && depends_on_old_values(
        /** @type {Derived} */
        dep
      )) {
        return true;
      }
    }
    return false;
  }
  function untrack(fn) {
    var previous_untracking = untracking;
    try {
      untracking = true;
      return fn();
    } finally {
      untracking = previous_untracking;
    }
  }
  const STATUS_MASK = -7169;
  function set_signal_status(signal, status) {
    signal.f = signal.f & STATUS_MASK | status;
  }
  function deep_read_state(value) {
    if (typeof value !== "object" || !value || value instanceof EventTarget) {
      return;
    }
    if (STATE_SYMBOL in value) {
      deep_read(value);
    } else if (!Array.isArray(value)) {
      for (let key in value) {
        const prop2 = value[key];
        if (typeof prop2 === "object" && prop2 && STATE_SYMBOL in prop2) {
          deep_read(prop2);
        }
      }
    }
  }
  function deep_read(value, visited = /* @__PURE__ */ new Set()) {
    if (typeof value === "object" && value !== null && // We don't want to traverse DOM elements
    !(value instanceof EventTarget) && !visited.has(value)) {
      visited.add(value);
      if (value instanceof Date) {
        value.getTime();
      }
      for (let key in value) {
        try {
          deep_read(value[key], visited);
        } catch (e) {
        }
      }
      const proto = get_prototype_of(value);
      if (proto !== Object.prototype && proto !== Array.prototype && proto !== Map.prototype && proto !== Set.prototype && proto !== Date.prototype) {
        const descriptors = get_descriptors(proto);
        for (let key in descriptors) {
          const get2 = descriptors[key].get;
          if (get2) {
            try {
              get2.call(value);
            } catch (e) {
            }
          }
        }
      }
    }
  }
  const PASSIVE_EVENTS = ["touchstart", "touchmove"];
  function is_passive_event(name) {
    return PASSIVE_EVENTS.includes(name);
  }
  function without_reactive_context(fn) {
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      return fn();
    } finally {
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  const all_registered_events = /* @__PURE__ */ new Set();
  const root_event_handles = /* @__PURE__ */ new Set();
  function create_event(event_name, dom, handler, options = {}) {
    function target_handler(event2) {
      if (!options.capture) {
        handle_event_propagation.call(dom, event2);
      }
      if (!event2.cancelBubble) {
        return without_reactive_context(() => {
          return handler == null ? void 0 : handler.call(this, event2);
        });
      }
    }
    if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
      queue_micro_task(() => {
        dom.addEventListener(event_name, target_handler, options);
      });
    } else {
      dom.addEventListener(event_name, target_handler, options);
    }
    return target_handler;
  }
  function event(event_name, dom, handler, capture2, passive) {
    var options = { capture: capture2, passive };
    var target_handler = create_event(event_name, dom, handler, options);
    if (dom === document.body || // @ts-ignore
    dom === window || // @ts-ignore
    dom === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
    dom instanceof HTMLMediaElement) {
      teardown(() => {
        dom.removeEventListener(event_name, target_handler, options);
      });
    }
  }
  function delegate(events2) {
    for (var i = 0; i < events2.length; i++) {
      all_registered_events.add(events2[i]);
    }
    for (var fn of root_event_handles) {
      fn(events2);
    }
  }
  let last_propagated_event = null;
  function handle_event_propagation(event2) {
    var _a2;
    var handler_element = this;
    var owner_document = (
      /** @type {Node} */
      handler_element.ownerDocument
    );
    var event_name = event2.type;
    var path = ((_a2 = event2.composedPath) == null ? void 0 : _a2.call(event2)) || [];
    var current_target = (
      /** @type {null | Element} */
      path[0] || event2.target
    );
    last_propagated_event = event2;
    var path_idx = 0;
    var handled_at = last_propagated_event === event2 && event2.__root;
    if (handled_at) {
      var at_idx = path.indexOf(handled_at);
      if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
      window)) {
        event2.__root = handler_element;
        return;
      }
      var handler_idx = path.indexOf(handler_element);
      if (handler_idx === -1) {
        return;
      }
      if (at_idx <= handler_idx) {
        path_idx = at_idx;
      }
    }
    current_target = /** @type {Element} */
    path[path_idx] || event2.target;
    if (current_target === handler_element) return;
    define_property(event2, "currentTarget", {
      configurable: true,
      get() {
        return current_target || owner_document;
      }
    });
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      var throw_error;
      var other_errors = [];
      while (current_target !== null) {
        var parent_element = current_target.assignedSlot || current_target.parentNode || /** @type {any} */
        current_target.host || null;
        try {
          var delegated = current_target["__" + event_name];
          if (delegated != null && (!/** @type {any} */
          current_target.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          event2.target === current_target)) {
            if (is_array(delegated)) {
              var [fn, ...data] = delegated;
              fn.apply(current_target, [event2, ...data]);
            } else {
              delegated.call(current_target, event2);
            }
          }
        } catch (error) {
          if (throw_error) {
            other_errors.push(error);
          } else {
            throw_error = error;
          }
        }
        if (event2.cancelBubble || parent_element === handler_element || parent_element === null) {
          break;
        }
        current_target = parent_element;
      }
      if (throw_error) {
        for (let error of other_errors) {
          queueMicrotask(() => {
            throw error;
          });
        }
        throw throw_error;
      }
    } finally {
      event2.__root = handler_element;
      delete event2.currentTarget;
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  function create_fragment_from_html(html) {
    var elem = document.createElement("template");
    elem.innerHTML = html.replaceAll("<!>", "<!---->");
    return elem.content;
  }
  function assign_nodes(start, end) {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    if (effect2.nodes_start === null) {
      effect2.nodes_start = start;
      effect2.nodes_end = end;
    }
  }
  // @__NO_SIDE_EFFECTS__
  function from_html(content, flags) {
    var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
    var use_import_node = (flags & TEMPLATE_USE_IMPORT_NODE) !== 0;
    var node;
    var has_start = !content.startsWith("<!>");
    return () => {
      if (node === void 0) {
        node = create_fragment_from_html(has_start ? content : "<!>" + content);
        if (!is_fragment) node = /** @type {Node} */
        /* @__PURE__ */ get_first_child(node);
      }
      var clone = (
        /** @type {TemplateNode} */
        use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
      );
      if (is_fragment) {
        var start = (
          /** @type {TemplateNode} */
          /* @__PURE__ */ get_first_child(clone)
        );
        var end = (
          /** @type {TemplateNode} */
          clone.lastChild
        );
        assign_nodes(start, end);
      } else {
        assign_nodes(clone, clone);
      }
      return clone;
    };
  }
  function text(value = "") {
    {
      var t = create_text(value + "");
      assign_nodes(t, t);
      return t;
    }
  }
  function comment() {
    var frag = document.createDocumentFragment();
    var start = document.createComment("");
    var anchor = create_text();
    frag.append(start, anchor);
    assign_nodes(start, anchor);
    return frag;
  }
  function append(anchor, dom) {
    if (anchor === null) {
      return;
    }
    anchor.before(
      /** @type {Node} */
      dom
    );
  }
  function set_text(text2, value) {
    var _a2;
    var str = value == null ? "" : typeof value === "object" ? value + "" : value;
    if (str !== ((_a2 = text2.__t) != null ? _a2 : text2.__t = text2.nodeValue)) {
      text2.__t = str;
      text2.nodeValue = str + "";
    }
  }
  function mount(component2, options) {
    return _mount(component2, options);
  }
  const document_listeners = /* @__PURE__ */ new Map();
  function _mount(Component, { target, anchor, props = {}, events: events2, context, intro = true }) {
    init_operations();
    var registered_events = /* @__PURE__ */ new Set();
    var event_handle = (events3) => {
      for (var i = 0; i < events3.length; i++) {
        var event_name = events3[i];
        if (registered_events.has(event_name)) continue;
        registered_events.add(event_name);
        var passive = is_passive_event(event_name);
        target.addEventListener(event_name, handle_event_propagation, { passive });
        var n = document_listeners.get(event_name);
        if (n === void 0) {
          document.addEventListener(event_name, handle_event_propagation, { passive });
          document_listeners.set(event_name, 1);
        } else {
          document_listeners.set(event_name, n + 1);
        }
      }
    };
    event_handle(array_from(all_registered_events));
    root_event_handles.add(event_handle);
    var component2 = void 0;
    var unmount2 = component_root(() => {
      var anchor_node = anchor != null ? anchor : target.appendChild(create_text());
      branch(() => {
        if (context) {
          push({});
          var ctx = (
            /** @type {ComponentContext} */
            component_context
          );
          ctx.c = context;
        }
        if (events2) {
          props.$$events = events2;
        }
        component2 = Component(anchor_node, props) || {};
        if (context) {
          pop();
        }
      });
      return () => {
        var _a2;
        for (var event_name of registered_events) {
          target.removeEventListener(event_name, handle_event_propagation);
          var n = (
            /** @type {number} */
            document_listeners.get(event_name)
          );
          if (--n === 0) {
            document.removeEventListener(event_name, handle_event_propagation);
            document_listeners.delete(event_name);
          } else {
            document_listeners.set(event_name, n);
          }
        }
        root_event_handles.delete(event_handle);
        if (anchor_node !== anchor) {
          (_a2 = anchor_node.parentNode) == null ? void 0 : _a2.removeChild(anchor_node);
        }
      };
    });
    mounted_components.set(component2, unmount2);
    return component2;
  }
  let mounted_components = /* @__PURE__ */ new WeakMap();
  function unmount(component2, options) {
    const fn = mounted_components.get(component2);
    if (fn) {
      mounted_components.delete(component2);
      return fn(options);
    }
    return Promise.resolve();
  }
  function if_block(node, fn, elseif = false) {
    var anchor = node;
    var consequent_effect = null;
    var alternate_effect = null;
    var condition = UNINITIALIZED;
    var flags = elseif ? EFFECT_TRANSPARENT : 0;
    var has_branch = false;
    const set_branch = (fn2, flag = true) => {
      has_branch = true;
      update_branch(flag, fn2);
    };
    var offscreen_fragment = null;
    function commit() {
      if (offscreen_fragment !== null) {
        offscreen_fragment.lastChild.remove();
        anchor.before(offscreen_fragment);
        offscreen_fragment = null;
      }
      var active = condition ? consequent_effect : alternate_effect;
      var inactive = condition ? alternate_effect : consequent_effect;
      if (active) {
        resume_effect(active);
      }
      if (inactive) {
        pause_effect(inactive, () => {
          if (condition) {
            alternate_effect = null;
          } else {
            consequent_effect = null;
          }
        });
      }
    }
    const update_branch = (new_condition, fn2) => {
      if (condition === (condition = new_condition)) return;
      var defer = should_defer_append();
      var target = anchor;
      if (defer) {
        offscreen_fragment = document.createDocumentFragment();
        offscreen_fragment.append(target = create_text());
      }
      if (condition) {
        consequent_effect != null ? consequent_effect : consequent_effect = fn2 && branch(() => fn2(target));
      } else {
        alternate_effect != null ? alternate_effect : alternate_effect = fn2 && branch(() => fn2(target));
      }
      if (defer) {
        var batch = (
          /** @type {Batch} */
          current_batch
        );
        var active = condition ? consequent_effect : alternate_effect;
        var inactive = condition ? alternate_effect : consequent_effect;
        if (active) batch.skipped_effects.delete(active);
        if (inactive) batch.skipped_effects.add(inactive);
        batch.add_callback(commit);
      } else {
        commit();
      }
    };
    block(() => {
      has_branch = false;
      fn(set_branch);
      if (!has_branch) {
        update_branch(null, null);
      }
    }, flags);
  }
  function index(_, i) {
    return i;
  }
  function pause_effects(state2, items, controlled_anchor) {
    var items_map = state2.items;
    var transitions = [];
    var length = items.length;
    for (var i = 0; i < length; i++) {
      pause_children(items[i].e, transitions, true);
    }
    var is_controlled = length > 0 && transitions.length === 0 && controlled_anchor !== null;
    if (is_controlled) {
      var parent_node = (
        /** @type {Element} */
        /** @type {Element} */
        controlled_anchor.parentNode
      );
      clear_text_content(parent_node);
      parent_node.append(
        /** @type {Element} */
        controlled_anchor
      );
      items_map.clear();
      link(state2, items[0].prev, items[length - 1].next);
    }
    run_out_transitions(transitions, () => {
      for (var i2 = 0; i2 < length; i2++) {
        var item = items[i2];
        if (!is_controlled) {
          items_map.delete(item.k);
          link(state2, item.prev, item.next);
        }
        destroy_effect(item.e, !is_controlled);
      }
    });
  }
  function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
    var anchor = node;
    var state2 = { flags, items: /* @__PURE__ */ new Map(), first: null };
    var is_controlled = (flags & EACH_IS_CONTROLLED) !== 0;
    if (is_controlled) {
      var parent_node = (
        /** @type {Element} */
        node
      );
      anchor = parent_node.appendChild(create_text());
    }
    var fallback = null;
    var was_empty = false;
    var offscreen_items = /* @__PURE__ */ new Map();
    var each_array = /* @__PURE__ */ derived_safe_equal(() => {
      var collection = get_collection();
      return is_array(collection) ? collection : collection == null ? [] : array_from(collection);
    });
    var array;
    var each_effect;
    function commit() {
      reconcile(
        each_effect,
        array,
        state2,
        offscreen_items,
        anchor,
        render_fn,
        flags,
        get_key,
        get_collection
      );
      if (fallback_fn !== null) {
        if (array.length === 0) {
          if (fallback) {
            resume_effect(fallback);
          } else {
            fallback = branch(() => fallback_fn(anchor));
          }
        } else if (fallback !== null) {
          pause_effect(fallback, () => {
            fallback = null;
          });
        }
      }
    }
    block(() => {
      var _a2;
      each_effect != null ? each_effect : each_effect = /** @type {Effect} */
      active_effect;
      array = get$1(each_array);
      var length = array.length;
      if (was_empty && length === 0) {
        return;
      }
      was_empty = length === 0;
      var item, i, value, key;
      {
        if (should_defer_append()) {
          var keys2 = /* @__PURE__ */ new Set();
          var batch = (
            /** @type {Batch} */
            current_batch
          );
          for (i = 0; i < length; i += 1) {
            value = array[i];
            key = get_key(value, i);
            var existing = (_a2 = state2.items.get(key)) != null ? _a2 : offscreen_items.get(key);
            if (existing) {
              if ((flags & (EACH_ITEM_REACTIVE | EACH_INDEX_REACTIVE)) !== 0) {
                update_item(existing, value, i, flags);
              }
            } else {
              item = create_item(
                null,
                state2,
                null,
                null,
                value,
                key,
                i,
                render_fn,
                flags,
                get_collection,
                true
              );
              offscreen_items.set(key, item);
            }
            keys2.add(key);
          }
          for (const [key2, item2] of state2.items) {
            if (!keys2.has(key2)) {
              batch.skipped_effects.add(item2.e);
            }
          }
          batch.add_callback(commit);
        } else {
          commit();
        }
      }
      get$1(each_array);
    });
  }
  function reconcile(each_effect, array, state2, offscreen_items, anchor, render_fn, flags, get_key, get_collection) {
    var _a2, _b2, _c2, _d;
    var is_animated = (flags & EACH_IS_ANIMATED) !== 0;
    var should_update = (flags & (EACH_ITEM_REACTIVE | EACH_INDEX_REACTIVE)) !== 0;
    var length = array.length;
    var items = state2.items;
    var first = state2.first;
    var current = first;
    var seen;
    var prev = null;
    var to_animate;
    var matched = [];
    var stashed = [];
    var value;
    var key;
    var item;
    var i;
    if (is_animated) {
      for (i = 0; i < length; i += 1) {
        value = array[i];
        key = get_key(value, i);
        item = items.get(key);
        if (item !== void 0) {
          (_a2 = item.a) == null ? void 0 : _a2.measure();
          (to_animate != null ? to_animate : to_animate = /* @__PURE__ */ new Set()).add(item);
        }
      }
    }
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key = get_key(value, i);
      item = items.get(key);
      if (item === void 0) {
        var pending = offscreen_items.get(key);
        if (pending !== void 0) {
          offscreen_items.delete(key);
          items.set(key, pending);
          var next = prev ? prev.next : current;
          link(state2, prev, pending);
          link(state2, pending, next);
          move(pending, next, anchor);
          prev = pending;
        } else {
          var child_anchor = current ? (
            /** @type {TemplateNode} */
            current.e.nodes_start
          ) : anchor;
          prev = create_item(
            child_anchor,
            state2,
            prev,
            prev === null ? state2.first : prev.next,
            value,
            key,
            i,
            render_fn,
            flags,
            get_collection
          );
        }
        items.set(key, prev);
        matched = [];
        stashed = [];
        current = prev.next;
        continue;
      }
      if (should_update) {
        update_item(item, value, i, flags);
      }
      if ((item.e.f & INERT) !== 0) {
        resume_effect(item.e);
        if (is_animated) {
          (_b2 = item.a) == null ? void 0 : _b2.unfix();
          (to_animate != null ? to_animate : to_animate = /* @__PURE__ */ new Set()).delete(item);
        }
      }
      if (item !== current) {
        if (seen !== void 0 && seen.has(item)) {
          if (matched.length < stashed.length) {
            var start = stashed[0];
            var j;
            prev = start.prev;
            var a = matched[0];
            var b = matched[matched.length - 1];
            for (j = 0; j < matched.length; j += 1) {
              move(matched[j], start, anchor);
            }
            for (j = 0; j < stashed.length; j += 1) {
              seen.delete(stashed[j]);
            }
            link(state2, a.prev, b.next);
            link(state2, prev, a);
            link(state2, b, start);
            current = start;
            prev = b;
            i -= 1;
            matched = [];
            stashed = [];
          } else {
            seen.delete(item);
            move(item, current, anchor);
            link(state2, item.prev, item.next);
            link(state2, item, prev === null ? state2.first : prev.next);
            link(state2, prev, item);
            prev = item;
          }
          continue;
        }
        matched = [];
        stashed = [];
        while (current !== null && current.k !== key) {
          if ((current.e.f & INERT) === 0) {
            (seen != null ? seen : seen = /* @__PURE__ */ new Set()).add(current);
          }
          stashed.push(current);
          current = current.next;
        }
        if (current === null) {
          continue;
        }
        item = current;
      }
      matched.push(item);
      prev = item;
      current = item.next;
    }
    if (current !== null || seen !== void 0) {
      var to_destroy = seen === void 0 ? [] : array_from(seen);
      while (current !== null) {
        if ((current.e.f & INERT) === 0) {
          to_destroy.push(current);
        }
        current = current.next;
      }
      var destroy_length = to_destroy.length;
      if (destroy_length > 0) {
        var controlled_anchor = (flags & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
        if (is_animated) {
          for (i = 0; i < destroy_length; i += 1) {
            (_c2 = to_destroy[i].a) == null ? void 0 : _c2.measure();
          }
          for (i = 0; i < destroy_length; i += 1) {
            (_d = to_destroy[i].a) == null ? void 0 : _d.fix();
          }
        }
        pause_effects(state2, to_destroy, controlled_anchor);
      }
    }
    if (is_animated) {
      queue_micro_task(() => {
        var _a3;
        if (to_animate === void 0) return;
        for (item of to_animate) {
          (_a3 = item.a) == null ? void 0 : _a3.apply();
        }
      });
    }
    each_effect.first = state2.first && state2.first.e;
    each_effect.last = prev && prev.e;
    for (var unused of offscreen_items.values()) {
      destroy_effect(unused.e);
    }
    offscreen_items.clear();
  }
  function update_item(item, value, index2, type) {
    if ((type & EACH_ITEM_REACTIVE) !== 0) {
      internal_set(item.v, value);
    }
    if ((type & EACH_INDEX_REACTIVE) !== 0) {
      internal_set(
        /** @type {Value<number>} */
        item.i,
        index2
      );
    } else {
      item.i = index2;
    }
  }
  function create_item(anchor, state2, prev, next, value, key, index2, render_fn, flags, get_collection, deferred2) {
    var reactive = (flags & EACH_ITEM_REACTIVE) !== 0;
    var mutable = (flags & EACH_ITEM_IMMUTABLE) === 0;
    var v = reactive ? mutable ? /* @__PURE__ */ mutable_source(value, false, false) : source(value) : value;
    var i = (flags & EACH_INDEX_REACTIVE) === 0 ? index2 : source(index2);
    var item = {
      i,
      v,
      k: key,
      a: null,
      // @ts-expect-error
      e: null,
      prev,
      next
    };
    try {
      if (anchor === null) {
        var fragment = document.createDocumentFragment();
        fragment.append(anchor = create_text());
      }
      item.e = branch(() => render_fn(
        /** @type {Node} */
        anchor,
        v,
        i,
        get_collection
      ), hydrating);
      item.e.prev = prev && prev.e;
      item.e.next = next && next.e;
      if (prev === null) {
        if (!deferred2) {
          state2.first = item;
        }
      } else {
        prev.next = item;
        prev.e.next = item.e;
      }
      if (next !== null) {
        next.prev = item;
        next.e.prev = item.e;
      }
      return item;
    } finally {
    }
  }
  function move(item, next, anchor) {
    var end = item.next ? (
      /** @type {TemplateNode} */
      item.next.e.nodes_start
    ) : anchor;
    var dest = next ? (
      /** @type {TemplateNode} */
      next.e.nodes_start
    ) : anchor;
    var node = (
      /** @type {TemplateNode} */
      item.e.nodes_start
    );
    while (node !== null && node !== end) {
      var next_node = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ get_next_sibling(node)
      );
      dest.before(node);
      node = next_node;
    }
  }
  function link(state2, prev, next) {
    if (prev === null) {
      state2.first = next;
    } else {
      prev.next = next;
      prev.e.next = next && next.e;
    }
    if (next !== null) {
      next.prev = prev;
      next.e.prev = prev && prev.e;
    }
  }
  function snippet(node, get_snippet, ...args) {
    var anchor = node;
    var snippet2 = noop$1;
    var snippet_effect;
    block(() => {
      if (snippet2 === (snippet2 = get_snippet())) return;
      if (snippet_effect) {
        destroy_effect(snippet_effect);
        snippet_effect = null;
      }
      snippet_effect = branch(() => (
        /** @type {SnippetFn} */
        snippet2(anchor, ...args)
      ));
    }, EFFECT_TRANSPARENT);
  }
  function component(node, get_component, render_fn) {
    var anchor = node;
    var component2;
    var effect2;
    var offscreen_fragment = null;
    var pending_effect = null;
    function commit() {
      if (effect2) {
        pause_effect(effect2);
        effect2 = null;
      }
      if (offscreen_fragment) {
        offscreen_fragment.lastChild.remove();
        anchor.before(offscreen_fragment);
        offscreen_fragment = null;
      }
      effect2 = pending_effect;
      pending_effect = null;
    }
    block(() => {
      if (component2 === (component2 = get_component())) return;
      var defer = should_defer_append();
      if (component2) {
        var target = anchor;
        if (defer) {
          offscreen_fragment = document.createDocumentFragment();
          offscreen_fragment.append(target = create_text());
        }
        pending_effect = branch(() => render_fn(target, component2));
      }
      if (defer) {
        current_batch.add_callback(commit);
      } else {
        commit();
      }
    }, EFFECT_TRANSPARENT);
  }
  function action(dom, action2, get_value) {
    effect(() => {
      var payload = untrack(() => action2(dom, get_value == null ? void 0 : get_value()) || {});
      if (get_value && (payload == null ? void 0 : payload.update)) {
        var inited2 = false;
        var prev = (
          /** @type {any} */
          {}
        );
        render_effect(() => {
          var value = get_value();
          deep_read_state(value);
          if (inited2 && safe_not_equal(prev, value)) {
            prev = value;
            payload.update(value);
          }
        });
        inited2 = true;
      }
      if (payload == null ? void 0 : payload.destroy) {
        return () => (
          /** @type {Function} */
          payload.destroy()
        );
      }
    });
  }
  function r(e) {
    var t, f, n = "";
    if ("string" == typeof e || "number" == typeof e) n += e;
    else if ("object" == typeof e) if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    } else for (f in e) e[f] && (n && (n += " "), n += f);
    return n;
  }
  function clsx$1() {
    for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
    return n;
  }
  function clsx(value) {
    if (typeof value === "object") {
      return clsx$1(value);
    } else {
      return value != null ? value : "";
    }
  }
  function to_class(value, hash, directives) {
    var classname = value == null ? "" : "" + value;
    return classname === "" ? null : classname;
  }
  function append_styles(styles, important = false) {
    var separator = important ? " !important;" : ";";
    var css = "";
    for (var key in styles) {
      var value = styles[key];
      if (value != null && value !== "") {
        css += " " + key + ": " + value + separator;
      }
    }
    return css;
  }
  function to_css_name(name) {
    if (name[0] !== "-" || name[1] !== "-") {
      return name.toLowerCase();
    }
    return name;
  }
  function to_style(value, styles) {
    if (styles) {
      var new_style = "";
      var normal_styles;
      var important_styles;
      if (Array.isArray(styles)) {
        normal_styles = styles[0];
        important_styles = styles[1];
      } else {
        normal_styles = styles;
      }
      if (value) {
        value = String(value).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
        var in_str = false;
        var in_apo = 0;
        var in_comment = false;
        var reserved_names = [];
        if (normal_styles) {
          reserved_names.push(...Object.keys(normal_styles).map(to_css_name));
        }
        if (important_styles) {
          reserved_names.push(...Object.keys(important_styles).map(to_css_name));
        }
        var start_index = 0;
        var name_index = -1;
        const len = value.length;
        for (var i = 0; i < len; i++) {
          var c = value[i];
          if (in_comment) {
            if (c === "/" && value[i - 1] === "*") {
              in_comment = false;
            }
          } else if (in_str) {
            if (in_str === c) {
              in_str = false;
            }
          } else if (c === "/" && value[i + 1] === "*") {
            in_comment = true;
          } else if (c === '"' || c === "'") {
            in_str = c;
          } else if (c === "(") {
            in_apo++;
          } else if (c === ")") {
            in_apo--;
          }
          if (!in_comment && in_str === false && in_apo === 0) {
            if (c === ":" && name_index === -1) {
              name_index = i;
            } else if (c === ";" || i === len - 1) {
              if (name_index !== -1) {
                var name = to_css_name(value.substring(start_index, name_index).trim());
                if (!reserved_names.includes(name)) {
                  if (c !== ";") {
                    i++;
                  }
                  var property = value.substring(start_index, i).trim();
                  new_style += " " + property + ";";
                }
              }
              start_index = i + 1;
              name_index = -1;
            }
          }
        }
      }
      if (normal_styles) {
        new_style += append_styles(normal_styles);
      }
      if (important_styles) {
        new_style += append_styles(important_styles, true);
      }
      new_style = new_style.trim();
      return new_style === "" ? null : new_style;
    }
    return value == null ? null : String(value);
  }
  function set_class(dom, is_html, value, hash, prev_classes, next_classes) {
    var prev = dom.__className;
    if (prev !== value || prev === void 0) {
      var next_class_name = to_class(value);
      {
        if (next_class_name == null) {
          dom.removeAttribute("class");
        } else {
          dom.className = next_class_name;
        }
      }
      dom.__className = value;
    }
    return next_classes;
  }
  function update_styles(dom, prev = {}, next, priority) {
    for (var key in next) {
      var value = next[key];
      if (prev[key] !== value) {
        if (next[key] == null) {
          dom.style.removeProperty(key);
        } else {
          dom.style.setProperty(key, value, priority);
        }
      }
    }
  }
  function set_style(dom, value, prev_styles, next_styles) {
    var prev = dom.__style;
    if (prev !== value) {
      var next_style_attr = to_style(value, next_styles);
      {
        if (next_style_attr == null) {
          dom.removeAttribute("style");
        } else {
          dom.style.cssText = next_style_attr;
        }
      }
      dom.__style = value;
    } else if (next_styles) {
      if (Array.isArray(next_styles)) {
        update_styles(dom, prev_styles == null ? void 0 : prev_styles[0], next_styles[0]);
        update_styles(dom, prev_styles == null ? void 0 : prev_styles[1], next_styles[1], "important");
      } else {
        update_styles(dom, prev_styles, next_styles);
      }
    }
    return next_styles;
  }
  const IS_CUSTOM_ELEMENT = Symbol("is custom element");
  const IS_HTML = Symbol("is html");
  function set_attribute(element, attribute, value, skip_warning) {
    var attributes = get_attributes(element);
    if (attributes[attribute] === (attributes[attribute] = value)) return;
    if (attribute === "loading") {
      element[LOADING_ATTR_SYMBOL] = value;
    }
    if (value == null) {
      element.removeAttribute(attribute);
    } else if (typeof value !== "string" && get_setters(element).includes(attribute)) {
      element[attribute] = value;
    } else {
      element.setAttribute(attribute, value);
    }
  }
  function get_attributes(element) {
    var _a2;
    return (
      /** @type {Record<string | symbol, unknown>} **/
      // @ts-expect-error
      (_a2 = element.__attributes) != null ? _a2 : element.__attributes = {
        [IS_CUSTOM_ELEMENT]: element.nodeName.includes("-"),
        [IS_HTML]: element.namespaceURI === NAMESPACE_HTML
      }
    );
  }
  var setters_cache = /* @__PURE__ */ new Map();
  function get_setters(element) {
    var setters = setters_cache.get(element.nodeName);
    if (setters) return setters;
    setters_cache.set(element.nodeName, setters = []);
    var descriptors;
    var proto = element;
    var element_proto = Element.prototype;
    while (element_proto !== proto) {
      descriptors = get_descriptors(proto);
      for (var key in descriptors) {
        if (descriptors[key].set) {
          setters.push(key);
        }
      }
      proto = get_prototype_of(proto);
    }
    return setters;
  }
  function bind_prop(props, prop2, value) {
    var desc = get_descriptor(props, prop2);
    if (desc && desc.set) {
      props[prop2] = value;
      teardown(() => {
        props[prop2] = null;
      });
    }
  }
  function is_bound_this(bound_value, element_or_component) {
    return bound_value === element_or_component || (bound_value == null ? void 0 : bound_value[STATE_SYMBOL]) === element_or_component;
  }
  function bind_this(element_or_component = {}, update, get_value, get_parts) {
    effect(() => {
      var old_parts;
      var parts;
      render_effect(() => {
        old_parts = parts;
        parts = (get_parts == null ? void 0 : get_parts()) || [];
        untrack(() => {
          if (element_or_component !== get_value(...parts)) {
            update(element_or_component, ...parts);
            if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
              update(null, ...old_parts);
            }
          }
        });
      });
      return () => {
        queue_micro_task(() => {
          if (parts && is_bound_this(get_value(...parts), element_or_component)) {
            update(null, ...parts);
          }
        });
      };
    });
    return element_or_component;
  }
  function init(immutable = false) {
    const context = (
      /** @type {ComponentContextLegacy} */
      component_context
    );
    const callbacks = context.l.u;
    if (!callbacks) return;
    let props = () => deep_read_state(context.s);
    if (immutable) {
      let version = 0;
      let prev = (
        /** @type {Record<string, any>} */
        {}
      );
      const d = /* @__PURE__ */ derived$1(() => {
        let changed = false;
        const props2 = context.s;
        for (const key in props2) {
          if (props2[key] !== prev[key]) {
            prev[key] = props2[key];
            changed = true;
          }
        }
        if (changed) version++;
        return version;
      });
      props = () => get$1(d);
    }
    if (callbacks.b.length) {
      user_pre_effect(() => {
        observe_all(context, props);
        run_all(callbacks.b);
      });
    }
    user_effect(() => {
      const fns = untrack(() => callbacks.m.map(run$1));
      return () => {
        for (const fn of fns) {
          if (typeof fn === "function") {
            fn();
          }
        }
      };
    });
    if (callbacks.a.length) {
      user_effect(() => {
        observe_all(context, props);
        run_all(callbacks.a);
      });
    }
  }
  function observe_all(context, props) {
    if (context.l.s) {
      for (const signal of context.l.s) get$1(signal);
    }
    props();
  }
  function subscribe_to_store(store, run2, invalidate) {
    if (store == null) {
      run2(void 0);
      if (invalidate) invalidate(void 0);
      return noop$1;
    }
    const unsub = untrack(
      () => store.subscribe(
        run2,
        // @ts-expect-error
        invalidate
      )
    );
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  const subscriber_queue = [];
  function readable(value, start) {
    return {
      subscribe: writable(value, start).subscribe
    };
  }
  function writable(value, start = noop$1) {
    let stop = null;
    const subscribers = /* @__PURE__ */ new Set();
    function set2(new_value) {
      if (safe_not_equal(value, new_value)) {
        value = new_value;
        if (stop) {
          const run_queue = !subscriber_queue.length;
          for (const subscriber of subscribers) {
            subscriber[1]();
            subscriber_queue.push(subscriber, value);
          }
          if (run_queue) {
            for (let i = 0; i < subscriber_queue.length; i += 2) {
              subscriber_queue[i][0](subscriber_queue[i + 1]);
            }
            subscriber_queue.length = 0;
          }
        }
      }
    }
    function update(fn) {
      set2(fn(
        /** @type {T} */
        value
      ));
    }
    function subscribe(run2, invalidate = noop$1) {
      const subscriber = [run2, invalidate];
      subscribers.add(subscriber);
      if (subscribers.size === 1) {
        stop = start(set2, update) || noop$1;
      }
      run2(
        /** @type {T} */
        value
      );
      return () => {
        subscribers.delete(subscriber);
        if (subscribers.size === 0 && stop) {
          stop();
          stop = null;
        }
      };
    }
    return { set: set2, update, subscribe };
  }
  function derived(stores, fn, initial_value) {
    const single = !Array.isArray(stores);
    const stores_array = single ? [stores] : stores;
    if (!stores_array.every(Boolean)) {
      throw new Error("derived() expects stores as input, got a falsy value");
    }
    const auto = fn.length < 2;
    return readable(initial_value, (set2, update) => {
      let started = false;
      const values = [];
      let pending = 0;
      let cleanup = noop$1;
      const sync = () => {
        if (pending) {
          return;
        }
        cleanup();
        const result = fn(single ? values[0] : values, set2, update);
        if (auto) {
          set2(result);
        } else {
          cleanup = typeof result === "function" ? result : noop$1;
        }
      };
      const unsubscribers = stores_array.map(
        (store, i) => subscribe_to_store(
          store,
          (value) => {
            values[i] = value;
            pending &= ~(1 << i);
            if (started) {
              sync();
            }
          },
          () => {
            pending |= 1 << i;
          }
        )
      );
      started = true;
      sync();
      return function stop() {
        run_all(unsubscribers);
        cleanup();
        started = false;
      };
    });
  }
  function get(store) {
    let value;
    subscribe_to_store(store, (_) => value = _)();
    return value;
  }
  let is_store_binding = false;
  let IS_UNMOUNTED = Symbol();
  function store_get(store, store_name, stores) {
    var _a2;
    const entry = (_a2 = stores[store_name]) != null ? _a2 : stores[store_name] = {
      store: null,
      source: /* @__PURE__ */ mutable_source(void 0),
      unsubscribe: noop$1
    };
    if (entry.store !== store && !(IS_UNMOUNTED in stores)) {
      entry.unsubscribe();
      entry.store = store != null ? store : null;
      if (store == null) {
        entry.source.v = void 0;
        entry.unsubscribe = noop$1;
      } else {
        var is_synchronous_callback = true;
        entry.unsubscribe = subscribe_to_store(store, (v) => {
          if (is_synchronous_callback) {
            entry.source.v = v;
          } else {
            set(entry.source, v);
          }
        });
        is_synchronous_callback = false;
      }
    }
    if (store && IS_UNMOUNTED in stores) {
      return get(store);
    }
    return get$1(entry.source);
  }
  function store_set(store, value) {
    store.set(value);
    return value;
  }
  function setup_stores() {
    const stores = {};
    function cleanup() {
      teardown(() => {
        for (var store_name in stores) {
          const ref = stores[store_name];
          ref.unsubscribe();
        }
        define_property(stores, IS_UNMOUNTED, {
          enumerable: false,
          value: true
        });
      });
    }
    return [stores, cleanup];
  }
  function store_mutate(store, expression, new_value) {
    store.set(new_value);
    return expression;
  }
  function capture_store_binding(fn) {
    var previous_is_store_binding = is_store_binding;
    try {
      is_store_binding = false;
      return [fn(), is_store_binding];
    } finally {
      is_store_binding = previous_is_store_binding;
    }
  }
  function prop(props, key, flags, fallback) {
    var _a2, _b2;
    var runes = !legacy_mode_flag || (flags & PROPS_IS_RUNES) !== 0;
    var bindable = (flags & PROPS_IS_BINDABLE) !== 0;
    var lazy = (flags & PROPS_IS_LAZY_INITIAL) !== 0;
    var fallback_value = (
      /** @type {V} */
      fallback
    );
    var fallback_dirty = true;
    var get_fallback = () => {
      if (fallback_dirty) {
        fallback_dirty = false;
        fallback_value = lazy ? untrack(
          /** @type {() => V} */
          fallback
        ) : (
          /** @type {V} */
          fallback
        );
      }
      return fallback_value;
    };
    var setter;
    if (bindable) {
      var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
      setter = (_b2 = (_a2 = get_descriptor(props, key)) == null ? void 0 : _a2.set) != null ? _b2 : is_entry_props && key in props ? (v) => props[key] = v : void 0;
    }
    var initial_value;
    var is_store_sub = false;
    if (bindable) {
      [initial_value, is_store_sub] = capture_store_binding(() => (
        /** @type {V} */
        props[key]
      ));
    } else {
      initial_value = /** @type {V} */
      props[key];
    }
    if (initial_value === void 0 && fallback !== void 0) {
      initial_value = get_fallback();
      if (setter) {
        if (runes) props_invalid_value();
        setter(initial_value);
      }
    }
    var getter;
    if (runes) {
      getter = () => {
        var value = (
          /** @type {V} */
          props[key]
        );
        if (value === void 0) return get_fallback();
        fallback_dirty = true;
        return value;
      };
    } else {
      getter = () => {
        var value = (
          /** @type {V} */
          props[key]
        );
        if (value !== void 0) {
          fallback_value = /** @type {V} */
          void 0;
        }
        return value === void 0 ? fallback_value : value;
      };
    }
    if (runes && (flags & PROPS_IS_UPDATED) === 0) {
      return getter;
    }
    if (setter) {
      var legacy_parent = props.$$legacy;
      return function(value, mutation) {
        if (arguments.length > 0) {
          if (!runes || !mutation || legacy_parent || is_store_sub) {
            setter(mutation ? getter() : value);
          }
          return value;
        }
        return getter();
      };
    }
    var overridden = false;
    var d = ((flags & PROPS_IS_IMMUTABLE) !== 0 ? derived$1 : derived_safe_equal)(() => {
      overridden = false;
      return getter();
    });
    if (bindable) get$1(d);
    var parent_effect = (
      /** @type {Effect} */
      active_effect
    );
    return function(value, mutation) {
      if (arguments.length > 0) {
        const new_value = mutation ? get$1(d) : runes && bindable ? proxy(value) : value;
        set(d, new_value);
        overridden = true;
        if (fallback_value !== void 0) {
          fallback_value = new_value;
        }
        return value;
      }
      if (is_destroying_effect && overridden || (parent_effect.f & DESTROYED) !== 0) {
        return d.v;
      }
      return get$1(d);
    };
  }
  function onMount(fn) {
    if (component_context === null) {
      lifecycle_outside_component();
    }
    if (legacy_mode_flag && component_context.l !== null) {
      init_update_callbacks(component_context).m.push(fn);
    } else {
      user_effect(() => {
        const cleanup = untrack(fn);
        if (typeof cleanup === "function") return (
          /** @type {() => void} */
          cleanup
        );
      });
    }
  }
  function init_update_callbacks(context) {
    var _a2;
    var l = (
      /** @type {ComponentContextLegacy} */
      context.l
    );
    return (_a2 = l.u) != null ? _a2 : l.u = { a: [], b: [], m: [] };
  }
  const PUBLIC_VERSION = "5";
  if (typeof window !== "undefined") {
    ((_c = (_b = (_a = window.__svelte) != null ? _a : window.__svelte = {}).v) != null ? _c : _b.v = /* @__PURE__ */ new Set()).add(PUBLIC_VERSION);
  }
  function keyEnter(fn) {
    return function(e) {
      return e.key === "Enter" || e.key === " " && !e.preventDefault() ? fn.call(this, e) : void 0;
    };
  }
  function setContent(node, content) {
    let actions = {
      update(content2) {
        if (typeof content2 == "string") {
          node.innerText = content2;
        } else if (content2 == null ? void 0 : content2.domNodes) {
          node.replaceChildren(...content2.domNodes);
        } else if (content2 == null ? void 0 : content2.html) {
          node.innerHTML = content2.html;
        }
      }
    };
    actions.update(content);
    return actions;
  }
  function outsideEvent(node, type) {
    const handlePointerDown = (jsEvent) => {
      if (node && !node.contains(jsEvent.target)) {
        node.dispatchEvent(
          new CustomEvent(type + "outside", { detail: { jsEvent } })
        );
      }
    };
    document.addEventListener(type, handlePointerDown, true);
    return {
      destroy() {
        document.removeEventListener(type, handlePointerDown, true);
      }
    };
  }
  function observeResize(node, callback) {
    let resizeObserver = new ResizeObserver((entries2) => {
      for (let entry of entries2) {
        callback(entry);
      }
    });
    resizeObserver.observe(node);
    return {
      destroy() {
        resizeObserver.unobserve(node);
      }
    };
  }
  const DAY_IN_SECONDS = 86400;
  function createDate(input = void 0) {
    if (input !== void 0) {
      return input instanceof Date ? _fromLocalDate(input) : _fromISOString(input);
    }
    return _fromLocalDate(/* @__PURE__ */ new Date());
  }
  function createDuration(input) {
    if (typeof input === "number") {
      input = { seconds: input };
    } else if (typeof input === "string") {
      let seconds = 0, exp = 2;
      for (let part of input.split(":", 3)) {
        seconds += parseInt(part, 10) * Math.pow(60, exp--);
      }
      input = { seconds };
    } else if (input instanceof Date) {
      input = { hours: input.getUTCHours(), minutes: input.getUTCMinutes(), seconds: input.getUTCSeconds() };
    }
    let weeks = input.weeks || input.week || 0;
    return {
      years: input.years || input.year || 0,
      months: input.months || input.month || 0,
      days: weeks * 7 + (input.days || input.day || 0),
      seconds: (input.hours || input.hour || 0) * 60 * 60 + (input.minutes || input.minute || 0) * 60 + (input.seconds || input.second || 0),
      inWeeks: !!weeks
    };
  }
  function cloneDate(date) {
    return new Date(date.getTime());
  }
  function addDuration(date, duration, x = 1) {
    date.setUTCFullYear(date.getUTCFullYear() + x * duration.years);
    let month = date.getUTCMonth() + x * duration.months;
    date.setUTCMonth(month);
    month %= 12;
    if (month < 0) {
      month += 12;
    }
    while (date.getUTCMonth() !== month) {
      subtractDay(date);
    }
    date.setUTCDate(date.getUTCDate() + x * duration.days);
    date.setUTCSeconds(date.getUTCSeconds() + x * duration.seconds);
    return date;
  }
  function subtractDuration(date, duration, x = 1) {
    return addDuration(date, duration, -x);
  }
  function addDay(date, x = 1) {
    date.setUTCDate(date.getUTCDate() + x);
    return date;
  }
  function subtractDay(date, x = 1) {
    return addDay(date, -x);
  }
  function setMidnight(date) {
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }
  function toLocalDate(date) {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }
  function toISOString(date, len = 19) {
    return date.toISOString().substring(0, len);
  }
  function datesEqual(date1, ...dates2) {
    return dates2.every((date2) => date1.getTime() === date2.getTime());
  }
  function nextClosestDay(date, day) {
    let diff2 = day - date.getUTCDay();
    date.setUTCDate(date.getUTCDate() + (diff2 >= 0 ? diff2 : diff2 + 7));
    return date;
  }
  function prevClosestDay(date, day) {
    let diff2 = day - date.getUTCDay();
    date.setUTCDate(date.getUTCDate() + (diff2 <= 0 ? diff2 : diff2 - 7));
    return date;
  }
  function noTimePart(date) {
    return typeof date === "string" && date.length <= 10;
  }
  function copyTime(toDate, fromDate) {
    toDate.setUTCHours(fromDate.getUTCHours(), fromDate.getUTCMinutes(), fromDate.getUTCSeconds(), 0);
    return toDate;
  }
  function toSeconds(duration) {
    return duration.seconds;
  }
  function nextDate(date, duration) {
    addDuration(date, duration);
    return date;
  }
  function prevDate(date, duration, hiddenDays) {
    subtractDuration(date, duration);
    if (hiddenDays.length && hiddenDays.length < 7) {
      while (hiddenDays.includes(date.getUTCDay())) {
        subtractDay(date);
      }
    }
    return date;
  }
  function getWeekNumber(date, firstDay) {
    date = cloneDate(date);
    if (firstDay == 0) {
      date.setUTCDate(date.getUTCDate() + 6 - date.getUTCDay());
    } else {
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    }
    let yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date - yearStart) / 1e3 / DAY_IN_SECONDS + 1) / 7);
  }
  function _fromLocalDate(date) {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    ));
  }
  function _fromISOString(str) {
    const parts = str.match(/\d+/g);
    return new Date(Date.UTC(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
      Number(parts[3] || 0),
      Number(parts[4] || 0),
      Number(parts[5] || 0)
    ));
  }
  function assign(...args) {
    return Object.assign(...args);
  }
  function keys(object) {
    return Object.keys(object);
  }
  function entries(object) {
    return Object.entries(object);
  }
  function floor(value) {
    return Math.floor(value);
  }
  function ceil(value) {
    return Math.ceil(value);
  }
  function min(...args) {
    return Math.min(...args);
  }
  function max(...args) {
    return Math.max(...args);
  }
  function symbol() {
    return Symbol("ec");
  }
  function isArray(value) {
    return Array.isArray(value);
  }
  function isFunction(value) {
    return typeof value === "function";
  }
  function run(fn) {
    return fn();
  }
  function runAll(fns) {
    fns.forEach(run);
  }
  function noop() {
  }
  const identity = (x) => x;
  function stopPropagation(fn) {
    return function(event2) {
      event2.stopPropagation();
      if (fn) {
        fn.call(this, event2);
      }
    };
  }
  function debounce(fn, handle, queueStore) {
    queueStore.update((queue) => queue.set(handle, fn));
  }
  function flushDebounce(queue) {
    runAll(queue);
    queue.clear();
  }
  function task(fn, handle, tasks2) {
    handle != null ? handle : handle = fn;
    if (!tasks2.has(handle)) {
      tasks2.set(handle, setTimeout(() => {
        tasks2.delete(handle);
        fn();
      }));
    }
  }
  let payloadProp = symbol();
  function setPayload(obj, payload) {
    obj[payloadProp] = payload;
  }
  function hasPayload(obj) {
    return !!(obj == null ? void 0 : obj[payloadProp]);
  }
  function getPayload(obj) {
    return obj[payloadProp];
  }
  function createElement(tag, className, content, attrs = []) {
    let el = document.createElement(tag);
    el.className = className;
    if (typeof content == "string") {
      el.innerText = content;
    } else if (content.domNodes) {
      el.replaceChildren(...content.domNodes);
    } else if (content.html) {
      el.innerHTML = content.html;
    }
    for (let attr of attrs) {
      el.setAttribute(...attr);
    }
    return el;
  }
  function hasYScroll(el) {
    return el.scrollHeight > el.clientHeight;
  }
  function rect(el) {
    return el.getBoundingClientRect();
  }
  function ancestor(el, up) {
    while (up--) {
      el = el.parentElement;
    }
    return el;
  }
  function height(el) {
    return rect(el).height;
  }
  function getElementWithPayload(x, y, root2 = document, processed = []) {
    processed.push(root2);
    for (let el of root2.elementsFromPoint(x, y)) {
      if (hasPayload(el)) {
        return el;
      }
      if (el.shadowRoot && !processed.includes(el.shadowRoot)) {
        let shadowEl = getElementWithPayload(x, y, el.shadowRoot, processed);
        if (shadowEl) {
          return shadowEl;
        }
      }
    }
    return null;
  }
  function listen(node, event2, handler, options) {
    node.addEventListener(event2, handler, options);
    return () => node.removeEventListener(event2, handler, options);
  }
  function createView(view2, _viewTitle, _currentRange, _activeRange) {
    return {
      type: view2,
      title: _viewTitle,
      currentStart: _currentRange.start,
      currentEnd: _currentRange.end,
      activeStart: _activeRange.start,
      activeEnd: _activeRange.end,
      calendar: void 0
    };
  }
  function toViewWithLocalDates(view2) {
    view2 = assign({}, view2);
    view2.currentStart = toLocalDate(view2.currentStart);
    view2.currentEnd = toLocalDate(view2.currentEnd);
    view2.activeStart = toLocalDate(view2.activeStart);
    view2.activeEnd = toLocalDate(view2.activeEnd);
    return view2;
  }
  function listView(view2) {
    return view2.startsWith("list");
  }
  function timelineView(view2) {
    return view2.includes("Timeline");
  }
  let eventId = 1;
  function createEvents(input) {
    return input.map((event2) => {
      var _a2, _b2, _c2, _d, _e;
      let result = {
        id: "id" in event2 ? String(event2.id) : `{generated-${eventId++}}`,
        resourceIds: toArrayProp(event2, "resourceId").map(String),
        allDay: (_a2 = event2.allDay) != null ? _a2 : noTimePart(event2.start) && noTimePart(event2.end),
        start: createDate(event2.start),
        end: createDate(event2.end),
        title: (_b2 = event2.title) != null ? _b2 : "",
        editable: event2.editable,
        startEditable: event2.startEditable,
        durationEditable: event2.durationEditable,
        display: (_c2 = event2.display) != null ? _c2 : "auto",
        extendedProps: (_d = event2.extendedProps) != null ? _d : {},
        backgroundColor: (_e = event2.backgroundColor) != null ? _e : event2.color,
        textColor: event2.textColor,
        classNames: toArrayProp(event2, "className"),
        styles: toArrayProp(event2, "style")
      };
      if (result.allDay) {
        setMidnight(result.start);
        let end = cloneDate(result.end);
        setMidnight(result.end);
        if (!datesEqual(result.end, end) || datesEqual(result.end, result.start)) {
          addDay(result.end);
        }
      }
      return result;
    });
  }
  function toArrayProp(input, propName) {
    var _a2, _b2;
    let result = (_b2 = (_a2 = input[propName + "s"]) != null ? _a2 : input[propName]) != null ? _b2 : [];
    return isArray(result) ? result : [result];
  }
  function createEventSources(input) {
    return input.map((source2) => ({
      events: source2.events,
      url: source2.url && source2.url.trimEnd("&") || "",
      method: source2.method && source2.method.toUpperCase() || "GET",
      extraParams: source2.extraParams || {}
    }));
  }
  function createEventChunk(event2, start, end) {
    let chunk = {
      start: event2.start > start ? event2.start : start,
      end: event2.end < end ? event2.end : end,
      event: event2
    };
    chunk.zeroDuration = datesEqual(chunk.start, chunk.end);
    return chunk;
  }
  function sortEventChunks(chunks) {
    chunks.sort((a, b) => a.start - b.start || b.event.allDay - a.event.allDay);
  }
  function createEventContent(chunk, displayEventEnd, eventContent, theme, _intlEventTime, _view) {
    let timeText = _intlEventTime.formatRange(
      chunk.start,
      displayEventEnd && chunk.event.display !== "pointer" && !chunk.zeroDuration ? copyTime(cloneDate(chunk.start), chunk.end) : chunk.start
    );
    let content;
    if (eventContent) {
      content = isFunction(eventContent) ? eventContent({
        event: toEventWithLocalDates(chunk.event),
        timeText,
        view: toViewWithLocalDates(_view)
      }) : eventContent;
    }
    if (content === void 0) {
      let domNodes;
      switch (chunk.event.display) {
        case "background":
          domNodes = [];
          break;
        case "pointer":
          domNodes = [createTimeElement(timeText, chunk, theme)];
          break;
        default:
          domNodes = [
            ...chunk.event.allDay ? [] : [createTimeElement(timeText, chunk, theme)],
            createElement("h4", theme.eventTitle, chunk.event.title)
          ];
      }
      content = { domNodes };
    }
    return [timeText, content];
  }
  function createTimeElement(timeText, chunk, theme) {
    return createElement(
      "time",
      theme.eventTime,
      timeText,
      [["datetime", toISOString(chunk.start)]]
    );
  }
  function createEventClasses(eventClassNames, event2, _view) {
    let result = event2.classNames;
    if (eventClassNames) {
      if (isFunction(eventClassNames)) {
        eventClassNames = eventClassNames({
          event: toEventWithLocalDates(event2),
          view: toViewWithLocalDates(_view)
        });
      }
      result = [
        ...isArray(eventClassNames) ? eventClassNames : [eventClassNames],
        ...result
      ];
    }
    return result;
  }
  function toEventWithLocalDates(event2) {
    return _cloneEvent(event2, toLocalDate);
  }
  function cloneEvent(event2) {
    return _cloneEvent(event2, cloneDate);
  }
  function _cloneEvent(event2, dateFn) {
    event2 = assign({}, event2);
    event2.start = dateFn(event2.start);
    event2.end = dateFn(event2.end);
    return event2;
  }
  function prepareEventChunks$1(chunks, hiddenDays) {
    let longChunks = {};
    if (chunks.length) {
      sortEventChunks(chunks);
      let prevChunk;
      for (let chunk of chunks) {
        let dates = [];
        let date = setMidnight(cloneDate(chunk.start));
        while (chunk.end > date) {
          if (!hiddenDays.includes(date.getUTCDay())) {
            dates.push(cloneDate(date));
            if (dates.length > 1) {
              let key = date.getTime();
              if (longChunks[key]) {
                longChunks[key].chunks.push(chunk);
              } else {
                longChunks[key] = {
                  sorted: false,
                  chunks: [chunk]
                };
              }
            }
          }
          addDay(date);
        }
        if (dates.length) {
          chunk.date = dates[0];
          chunk.days = dates.length;
          chunk.dates = dates;
          if (chunk.start < dates[0]) {
            chunk.start = dates[0];
          }
          let maxEnd = addDay(cloneDate(dates.at(-1)));
          if (chunk.end > maxEnd) {
            chunk.end = maxEnd;
          }
        } else {
          chunk.date = setMidnight(cloneDate(chunk.start));
          chunk.days = 1;
          chunk.dates = [chunk.date];
        }
        if (prevChunk && datesEqual(prevChunk.date, chunk.date)) {
          chunk.prev = prevChunk;
        }
        prevChunk = chunk;
      }
    }
    return longChunks;
  }
  function repositionEvent$1(chunk, longChunks, height2) {
    chunk.top = 0;
    if (chunk.prev) {
      chunk.top = chunk.prev.bottom + 1;
    }
    chunk.bottom = chunk.top + height2;
    let margin = 1;
    let key = chunk.date.getTime();
    if (longChunks[key]) {
      if (!longChunks[key].sorted) {
        longChunks[key].chunks.sort((a, b) => a.top - b.top);
        longChunks[key].sorted = true;
      }
      for (let longChunk of longChunks[key].chunks) {
        if (chunk.top < longChunk.bottom && chunk.bottom > longChunk.top) {
          let offset = longChunk.bottom - chunk.top + 1;
          margin += offset;
          chunk.top += offset;
          chunk.bottom += offset;
        }
      }
    }
    return margin;
  }
  function runReposition(refs, data) {
    var _a2;
    refs.length = data.length;
    let result = [];
    for (let ref of refs) {
      result.push((_a2 = ref == null ? void 0 : ref.reposition) == null ? void 0 : _a2.call(ref));
    }
    return result;
  }
  function eventIntersects(event2, start, end, resources) {
    if (event2.start < end && event2.end > start) {
      if (resources) {
        if (!isArray(resources)) {
          resources = [resources];
        }
        return resources.some((resource) => event2.resourceIds.includes(resource.id));
      }
      return true;
    }
    return false;
  }
  function helperEvent(display) {
    return previewEvent(display) || ghostEvent(display) || pointerEvent(display);
  }
  function bgEvent(display) {
    return display === "background";
  }
  function previewEvent(display) {
    return display === "preview";
  }
  function ghostEvent(display) {
    return display === "ghost";
  }
  function pointerEvent(display) {
    return display === "pointer";
  }
  function btnTextDay(text2) {
    return btnText(text2, "day");
  }
  function btnTextWeek(text2) {
    return btnText(text2, "week");
  }
  function btnTextMonth(text2) {
    return btnText(text2, "month");
  }
  function btnTextYear(text2) {
    return btnText(text2, "year");
  }
  function btnText(text2, period) {
    return {
      ...text2,
      next: "Next " + period,
      prev: "Previous " + period
    };
  }
  function themeView(view2) {
    return (theme) => ({ ...theme, view: view2 });
  }
  function createDateRange(input) {
    let start, end;
    if (input) {
      ({ start, end } = input);
      if (start) {
        start = setMidnight(createDate(start));
      }
      if (end) {
        end = setMidnight(createDate(end));
      }
    }
    return { start, end };
  }
  function outsideRange(date, range) {
    return range.start && date < range.start || range.end && date > range.end;
  }
  function limitToRange(date, range) {
    if (range.start && date < range.start) {
      date = range.start;
    }
    if (range.end && date > range.end) {
      date = range.end;
    }
    return date;
  }
  function createResources(input) {
    let result = [];
    _createResources(input, 0, result);
    return result;
  }
  function _createResources(input, level, flat) {
    let result = [];
    for (let item of input) {
      let resource = createResource(item);
      result.push(resource);
      flat.push(resource);
      let payload = {
        level,
        children: [],
        expanded: true,
        hidden: false
      };
      setPayload(resource, payload);
      if (item.children) {
        payload.children = _createResources(item.children, level + 1, flat);
      }
    }
    return result;
  }
  function createResource(input) {
    var _a2;
    return {
      id: String(input.id),
      title: input.title || "",
      eventBackgroundColor: input.eventBackgroundColor,
      eventTextColor: input.eventTextColor,
      extendedProps: (_a2 = input.extendedProps) != null ? _a2 : {}
    };
  }
  function resourceBackgroundColor(event2, resources) {
    var _a2;
    return (_a2 = findResource(event2, resources)) == null ? void 0 : _a2.eventBackgroundColor;
  }
  function resourceTextColor(event2, resources) {
    var _a2;
    return (_a2 = findResource(event2, resources)) == null ? void 0 : _a2.eventTextColor;
  }
  function findResource(event2, resources) {
    return resources.find((resource) => event2.resourceIds.includes(resource.id));
  }
  function intl(locale, format) {
    return derived([locale, format], ([$locale, $format]) => {
      let intl2 = isFunction($format) ? { format: $format } : new Intl.DateTimeFormat($locale, $format);
      return {
        format: (date) => intl2.format(toLocalDate(date))
      };
    });
  }
  function intlRange(locale, format) {
    return derived([locale, format], ([$locale, $format]) => {
      let formatRange;
      if (isFunction($format)) {
        formatRange = $format;
      } else {
        let intl2 = new Intl.DateTimeFormat($locale, $format);
        formatRange = (start, end) => {
          if (start <= end) {
            return intl2.formatRange(start, end);
          } else {
            let parts = intl2.formatRangeToParts(end, start);
            let result = "";
            let sources = ["startRange", "endRange"];
            let processed = [false, false];
            for (let part of parts) {
              let i = sources.indexOf(part.source);
              if (i >= 0) {
                if (!processed[i]) {
                  result += _getParts(sources[1 - i], parts);
                  processed[i] = true;
                }
              } else {
                result += part.value;
              }
            }
            return result;
          }
        };
      }
      return {
        formatRange: (start, end) => formatRange(toLocalDate(start), toLocalDate(end))
      };
    });
  }
  function _getParts(source2, parts) {
    let result = "";
    for (let part of parts) {
      if (part.source == source2) {
        result += part.value;
      }
    }
    return result;
  }
  function viewResources(state2) {
    return derived(
      [state2.resources, state2.filterResourcesWithEvents, state2._filteredEvents, state2._activeRange],
      ([$resources, $filterResourcesWithEvents, $_filteredEvents, $_activeRange]) => {
        let result = $resources.filter((resource) => !getPayload(resource).hidden);
        if ($filterResourcesWithEvents) {
          result = $resources.filter((resource) => {
            for (let event2 of $_filteredEvents) {
              if (event2.display !== "background" && event2.resourceIds.includes(resource.id) && event2.start < $_activeRange.end && event2.end > $_activeRange.start) {
                return true;
              }
            }
            return false;
          });
        }
        if (!result.length) {
          result = createResources([{}]);
        }
        return result;
      }
    );
  }
  function createTimes(date, $slotDuration, $slotLabelInterval, $_slotTimeLimits, $_intlSlotLabel) {
    date = cloneDate(date);
    let times2 = [];
    let end = cloneDate(date);
    addDuration(date, $_slotTimeLimits.min);
    addDuration(end, $_slotTimeLimits.max);
    if ($slotLabelInterval === void 0) {
      $slotLabelInterval = $slotDuration.seconds < 3600 ? createDuration($slotDuration.seconds * 2) : $slotDuration;
    }
    let label = cloneDate(date);
    while (date < end) {
      times2.push([
        toISOString(date),
        $_intlSlotLabel.format(date),
        date >= label
      ]);
      while ($slotLabelInterval.seconds && date >= label) {
        addDuration(label, $slotLabelInterval);
      }
      addDuration(date, $slotDuration);
    }
    return times2;
  }
  function createSlotTimeLimits($slotMinTime, $slotMaxTime, $flexibleSlotTimeLimits, $_viewDates, $_filteredEvents) {
    let min$1 = createDuration($slotMinTime);
    let max$1 = createDuration($slotMaxTime);
    if ($flexibleSlotTimeLimits) {
      let minMin = createDuration(min(toSeconds(min$1), max(0, toSeconds(max$1) - DAY_IN_SECONDS)));
      let maxMax = createDuration(max(toSeconds(max$1), toSeconds(minMin) + DAY_IN_SECONDS));
      let filter = isFunction($flexibleSlotTimeLimits == null ? void 0 : $flexibleSlotTimeLimits.eventFilter) ? $flexibleSlotTimeLimits.eventFilter : (event2) => !bgEvent(event2.display);
      loop: for (let date of $_viewDates) {
        let start = addDuration(cloneDate(date), min$1);
        let end = addDuration(cloneDate(date), max$1);
        let minStart = addDuration(cloneDate(date), minMin);
        let maxEnd = addDuration(cloneDate(date), maxMax);
        for (let event2 of $_filteredEvents) {
          if (!event2.allDay && filter(event2) && event2.start < maxEnd && event2.end > minStart) {
            if (event2.start < start) {
              let seconds = max((event2.start - date) / 1e3, toSeconds(minMin));
              if (seconds < toSeconds(min$1)) {
                min$1.seconds = seconds;
              }
            }
            if (event2.end > end) {
              let seconds = min((event2.end - date) / 1e3, toSeconds(maxMax));
              if (seconds > toSeconds(max$1)) {
                max$1.seconds = seconds;
              }
            }
            if (toSeconds(min$1) === toSeconds(minMin) && toSeconds(max$1) === toSeconds(maxMax)) {
              break loop;
            }
          }
        }
      }
    }
    return { min: min$1, max: max$1 };
  }
  function createOptions(plugins) {
    var _a2;
    let options = {
      allDayContent: void 0,
      allDaySlot: true,
      buttonText: {
        today: "today"
      },
      customButtons: {},
      date: /* @__PURE__ */ new Date(),
      datesSet: void 0,
      dayHeaderFormat: {
        weekday: "short",
        month: "numeric",
        day: "numeric"
      },
      dayHeaderAriaLabelFormat: {
        dateStyle: "full"
      },
      displayEventEnd: true,
      duration: { weeks: 1 },
      events: [],
      eventAllUpdated: void 0,
      eventBackgroundColor: void 0,
      eventClassNames: void 0,
      eventClick: void 0,
      eventColor: void 0,
      eventContent: void 0,
      eventDidMount: void 0,
      eventFilter: void 0,
      // ec option
      eventMouseEnter: void 0,
      eventMouseLeave: void 0,
      eventSources: [],
      eventTextColor: void 0,
      eventTimeFormat: {
        hour: "numeric",
        minute: "2-digit"
      },
      filterEventsWithResources: false,
      filterResourcesWithEvents: false,
      firstDay: 0,
      flexibleSlotTimeLimits: false,
      // ec option
      headerToolbar: {
        start: "title",
        center: "",
        end: "today prev,next"
      },
      height: void 0,
      hiddenDays: [],
      highlightedDates: [],
      // ec option
      lazyFetching: true,
      loading: void 0,
      locale: void 0,
      nowIndicator: false,
      resourceLabelContent: void 0,
      resourceLabelDidMount: void 0,
      resources: [],
      selectable: false,
      scrollTime: "06:00:00",
      slotDuration: "00:30:00",
      slotEventOverlap: true,
      slotHeight: 24,
      // ec option
      slotLabelInterval: void 0,
      slotLabelFormat: {
        hour: "numeric",
        minute: "2-digit"
      },
      slotMaxTime: "24:00:00",
      slotMinTime: "00:00:00",
      slotWidth: 72,
      theme: {
        allDay: "ec-all-day",
        active: "ec-active",
        bgEvent: "ec-bg-event",
        bgEvents: "ec-bg-events",
        body: "ec-body",
        button: "ec-button",
        buttonGroup: "ec-button-group",
        calendar: "ec",
        content: "ec-content",
        day: "ec-day",
        dayHead: "ec-day-head",
        days: "ec-days",
        disabled: "ec-disabled",
        event: "ec-event",
        eventBody: "ec-event-body",
        eventTime: "ec-event-time",
        eventTitle: "ec-event-title",
        events: "ec-events",
        extra: "ec-extra",
        handle: "ec-handle",
        header: "ec-header",
        hiddenScroll: "ec-hidden-scroll",
        highlight: "ec-highlight",
        icon: "ec-icon",
        line: "ec-line",
        lines: "ec-lines",
        minor: "ec-minor",
        nowIndicator: "ec-now-indicator",
        otherMonth: "ec-other-month",
        resource: "ec-resource",
        sidebar: "ec-sidebar",
        sidebarTitle: "ec-sidebar-title",
        today: "ec-today",
        time: "ec-time",
        title: "ec-title",
        toolbar: "ec-toolbar",
        view: "",
        weekdays: ["ec-sun", "ec-mon", "ec-tue", "ec-wed", "ec-thu", "ec-fri", "ec-sat"],
        withScroll: "ec-with-scroll"
      },
      titleFormat: {
        year: "numeric",
        month: "short",
        day: "numeric"
      },
      validRange: void 0,
      view: void 0,
      viewDidMount: void 0,
      views: {}
    };
    for (let plugin of plugins) {
      (_a2 = plugin.createOptions) == null ? void 0 : _a2.call(plugin, options);
    }
    return options;
  }
  function createParsers(plugins) {
    var _a2;
    let parsers = {
      date: (date) => setMidnight(createDate(date)),
      duration: createDuration,
      events: createEvents,
      eventSources: createEventSources,
      hiddenDays: (days2) => [...new Set(days2)],
      highlightedDates: (dates) => dates.map((date) => setMidnight(createDate(date))),
      resources: createResources,
      scrollTime: createDuration,
      slotDuration: createDuration,
      slotLabelInterval: (input) => input !== void 0 ? createDuration(input) : void 0,
      slotMaxTime: createDuration,
      slotMinTime: createDuration,
      validRange: createDateRange
    };
    for (let plugin of plugins) {
      (_a2 = plugin.createParsers) == null ? void 0 : _a2.call(plugin, parsers);
    }
    return parsers;
  }
  function diff(options, prevOptions) {
    let diff2 = [];
    for (let key of keys(options)) {
      if (options[key] !== prevOptions[key]) {
        diff2.push([key, options[key]]);
      }
    }
    return diff2;
  }
  function dayGrid(state2) {
    return derived(state2.view, ($view) => $view == null ? void 0 : $view.startsWith("dayGrid"));
  }
  function activeRange(state2) {
    return derived(
      [state2._currentRange, state2.firstDay, state2.slotMaxTime, state2._dayGrid],
      ([$_currentRange, $firstDay, $slotMaxTime, $_dayGrid]) => {
        let start = cloneDate($_currentRange.start);
        let end = cloneDate($_currentRange.end);
        if ($_dayGrid) {
          prevClosestDay(start, $firstDay);
          nextClosestDay(end, $firstDay);
        } else if ($slotMaxTime.days || $slotMaxTime.seconds > DAY_IN_SECONDS) {
          addDuration(subtractDay(end), $slotMaxTime);
          let start2 = subtractDay(cloneDate(end));
          if (start2 < start) {
            start = start2;
          }
        }
        return { start, end };
      }
    );
  }
  function currentRange(state2) {
    return derived(
      [state2.date, state2.duration, state2.firstDay],
      ([$date, $duration, $firstDay]) => {
        let start = cloneDate($date), end;
        if ($duration.months) {
          start.setUTCDate(1);
        } else if ($duration.inWeeks) {
          prevClosestDay(start, $firstDay);
        }
        end = addDuration(cloneDate(start), $duration);
        return { start, end };
      }
    );
  }
  function viewDates(state2) {
    return derived([state2._activeRange, state2.hiddenDays], ([$_activeRange, $hiddenDays]) => {
      let dates = [];
      let date = setMidnight(cloneDate($_activeRange.start));
      let end = setMidnight(cloneDate($_activeRange.end));
      while (date < end) {
        if (!$hiddenDays.includes(date.getUTCDay())) {
          dates.push(cloneDate(date));
        }
        addDay(date);
      }
      if (!dates.length && $hiddenDays.length && $hiddenDays.length < 7) {
        state2.date.update((date2) => {
          while ($hiddenDays.includes(date2.getUTCDay())) {
            addDay(date2);
          }
          return date2;
        });
        dates = get(state2._viewDates);
      }
      return dates;
    });
  }
  function viewTitle(state2) {
    return derived(
      [state2.date, state2._activeRange, state2._intlTitle, state2._dayGrid],
      ([$date, $_activeRange, $_intlTitle, $_dayGrid]) => {
        return $_dayGrid ? $_intlTitle.formatRange($date, $date) : $_intlTitle.formatRange($_activeRange.start, subtractDay(cloneDate($_activeRange.end)));
      }
    );
  }
  function view(state2) {
    return derived([state2.view, state2._viewTitle, state2._currentRange, state2._activeRange], (args) => createView(...args));
  }
  function events(state2) {
    let _events = writable([]);
    let abortController;
    let fetching = 0;
    let debounceHandle = {};
    derived(
      [state2.events, state2.eventSources, state2._activeRange, state2._fetchedRange, state2.lazyFetching, state2.loading],
      (values, set2) => debounce(() => {
        let [$events, $eventSources, $_activeRange, $_fetchedRange, $lazyFetching, $loading] = values;
        if (!$eventSources.length) {
          set2($events);
          return;
        }
        if (!$_fetchedRange.start || $_fetchedRange.start > $_activeRange.start || $_fetchedRange.end < $_activeRange.end || !$lazyFetching) {
          if (abortController) {
            abortController.abort();
          }
          abortController = new AbortController();
          if (isFunction($loading) && !fetching) {
            $loading(true);
          }
          let stopLoading = () => {
            if (--fetching === 0 && isFunction($loading)) {
              $loading(false);
            }
          };
          let events2 = [];
          let failure = (e) => stopLoading();
          let success = (data) => {
            events2 = events2.concat(createEvents(data));
            set2(events2);
            stopLoading();
          };
          let startStr = toISOString($_activeRange.start);
          let endStr = toISOString($_activeRange.end);
          for (let source2 of $eventSources) {
            if (isFunction(source2.events)) {
              let result = source2.events({
                start: toLocalDate($_activeRange.start),
                end: toLocalDate($_activeRange.end),
                startStr,
                endStr
              }, success, failure);
              if (result !== void 0) {
                Promise.resolve(result).then(success, failure);
              }
            } else {
              let params = isFunction(source2.extraParams) ? source2.extraParams() : assign({}, source2.extraParams);
              params.start = startStr;
              params.end = endStr;
              params = new URLSearchParams(params);
              let url = source2.url, headers = {}, body;
              if (["GET", "HEAD"].includes(source2.method)) {
                url += (url.includes("?") ? "&" : "?") + params;
              } else {
                headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
                body = String(params);
              }
              fetch(url, { method: source2.method, headers, body, signal: abortController.signal, credentials: "same-origin" }).then((response) => response.json()).then(success).catch(failure);
            }
            ++fetching;
          }
          $_fetchedRange.start = $_activeRange.start;
          $_fetchedRange.end = $_activeRange.end;
        }
      }, debounceHandle, state2._queue),
      []
    ).subscribe(_events.set);
    return _events;
  }
  function filteredEvents(state2) {
    let view2;
    state2._view.subscribe(($_view) => view2 = $_view);
    let debounceHandle = {};
    return derived(
      [state2._events, state2.eventFilter],
      (values, set2) => debounce(() => {
        let [$_events, $eventFilter] = values;
        set2(
          isFunction($eventFilter) ? $_events.filter((event2, index2, events2) => $eventFilter({
            event: event2,
            index: index2,
            events: events2,
            view: view2
          })) : $_events
        );
      }, debounceHandle, state2._queue),
      []
    );
  }
  function now() {
    return readable(createDate(), (set2) => {
      let interval = setInterval(() => {
        set2(createDate());
      }, 1e3);
      return () => clearInterval(interval);
    });
  }
  function today(state2) {
    return derived(state2._now, ($_now) => setMidnight(cloneDate($_now)));
  }
  class State {
    constructor(plugins, input) {
      var _a2, _b2, _c2, _d, _e;
      plugins = plugins || [];
      let options = createOptions(plugins);
      let parsers = createParsers(plugins);
      options = parseOpts(options, parsers);
      input = parseOpts(input, parsers);
      for (let [option, value] of Object.entries(options)) {
        this[option] = writable(value);
      }
      this._queue = writable(/* @__PURE__ */ new Map());
      this._tasks = /* @__PURE__ */ new Map();
      this._auxiliary = writable([]);
      this._dayGrid = dayGrid(this);
      this._currentRange = currentRange(this);
      this._activeRange = activeRange(this);
      this._fetchedRange = writable({ start: void 0, end: void 0 });
      this._events = events(this);
      this._now = now();
      this._today = today(this);
      this._intlEventTime = intlRange(this.locale, this.eventTimeFormat);
      this._intlSlotLabel = intl(this.locale, this.slotLabelFormat);
      this._intlDayHeader = intl(this.locale, this.dayHeaderFormat);
      this._intlDayHeaderAL = intl(this.locale, this.dayHeaderAriaLabelFormat);
      this._intlTitle = intlRange(this.locale, this.titleFormat);
      this._bodyEl = writable(void 0);
      this._scrollable = writable(false);
      this._recheckScrollable = writable(false);
      this._viewTitle = viewTitle(this);
      this._viewDates = viewDates(this);
      this._view = view(this);
      this._viewComponent = writable(void 0);
      this._filteredEvents = filteredEvents(this);
      this._interaction = writable({});
      this._iEvents = writable([null, null]);
      this._iClasses = writable(identity);
      this._iClass = writable(void 0);
      this._set = (key, value) => {
        if (validKey(key, this)) {
          if (parsers[key]) {
            value = parsers[key](value);
          }
          this[key].set(value);
        }
      };
      this._get = (key) => validKey(key, this) ? get(this[key]) : void 0;
      for (let plugin of plugins) {
        (_a2 = plugin.createStores) == null ? void 0 : _a2.call(plugin, this);
      }
      if (input.view) {
        this.view.set(input.view);
      }
      let views = /* @__PURE__ */ new Set([...keys(options.views), ...keys((_b2 = input.views) != null ? _b2 : {})]);
      for (let view2 of views) {
        let defOpts = mergeOpts(options, (_c2 = options.views[view2]) != null ? _c2 : {});
        let opts = mergeOpts(defOpts, input, (_e = (_d = input.views) == null ? void 0 : _d[view2]) != null ? _e : {});
        let component2 = opts.component;
        filterOpts(opts, this);
        for (let key of keys(opts)) {
          let { set: set2, _set = set2, ...rest } = this[key];
          this[key] = {
            // Set value in all views
            set: ["buttonText", "theme"].includes(key) ? (value) => {
              if (isFunction(value)) {
                let result = value(defOpts[key]);
                opts[key] = result;
                set2(set2 === _set ? result : value);
              } else {
                opts[key] = value;
                set2(value);
              }
            } : (value) => {
              opts[key] = value;
              set2(value);
            },
            _set,
            ...rest
          };
        }
        this.view.subscribe((newView) => {
          if (newView === view2) {
            this._viewComponent.set(component2);
            if (isFunction(opts.viewDidMount)) {
              tick().then(() => opts.viewDidMount({
                view: toViewWithLocalDates(get(this._view))
              }));
            }
            for (let key of keys(opts)) {
              this[key]._set(opts[key]);
            }
          }
        });
      }
    }
  }
  function parseOpts(opts, parsers) {
    let result = { ...opts };
    for (let key of keys(parsers)) {
      if (key in result) {
        result[key] = parsers[key](result[key]);
      }
    }
    if (opts.views) {
      result.views = {};
      for (let view2 of keys(opts.views)) {
        result.views[view2] = parseOpts(opts.views[view2], parsers);
      }
    }
    return result;
  }
  function mergeOpts(...args) {
    let result = {};
    for (let opts of args) {
      let override = {};
      for (let key of ["buttonText", "theme"]) {
        if (isFunction(opts[key])) {
          override[key] = opts[key](result[key]);
        }
      }
      result = {
        ...result,
        ...opts,
        ...override
      };
    }
    return result;
  }
  function filterOpts(opts, state2) {
    keys(opts).filter((key) => !validKey(key, state2) || key === "view").forEach((key) => delete opts[key]);
  }
  function validKey(key, state2) {
    return state2.hasOwnProperty(key) && key[0] !== "_";
  }
  enable_legacy_mode_flag();
  var root_2$7 = /* @__PURE__ */ from_html(`<h2></h2>`);
  var root_4$3 = /* @__PURE__ */ from_html(`<button><i></i></button>`);
  var root_6$1 = /* @__PURE__ */ from_html(`<button><i></i></button>`);
  var root_8$1 = /* @__PURE__ */ from_html(`<button> </button>`);
  var root_10$1 = /* @__PURE__ */ from_html(`<button></button>`);
  var root_12$1 = /* @__PURE__ */ from_html(`<button> </button>`);
  function Buttons($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $date = () => store_get(date, "$date", $$stores);
    const $duration = () => store_get(duration, "$duration", $$stores);
    const $hiddenDays = () => store_get(hiddenDays, "$hiddenDays", $$stores);
    const $_currentRange = () => store_get(_currentRange, "$_currentRange", $$stores);
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_viewTitle = () => store_get(_viewTitle, "$_viewTitle", $$stores);
    const $buttonText = () => store_get(buttonText, "$buttonText", $$stores);
    const $customButtons = () => store_get(customButtons, "$customButtons", $$stores);
    const $view = () => store_get(view2, "$view", $$stores);
    let buttons = prop($$props, "buttons", 8);
    let {
      _currentRange,
      _viewTitle,
      _viewDates,
      buttonText,
      customButtons,
      date,
      duration,
      hiddenDays,
      theme,
      validRange,
      view: view2
    } = getContext("state");
    let today2 = setMidnight(createDate());
    let prevDisabled = /* @__PURE__ */ mutable_source(), nextDisabled = /* @__PURE__ */ mutable_source(), todayDisabled = /* @__PURE__ */ mutable_source();
    let running = /* @__PURE__ */ mutable_source(false);
    function isRunning() {
      return get$1(running);
    }
    function test() {
      return $_viewDates().every((date2) => outsideRange(date2, $validRange()));
    }
    function prev() {
      store_set(date, prevDate($date(), $duration(), $hiddenDays()));
    }
    function next() {
      store_set(date, nextDate($date(), $duration()));
    }
    legacy_pre_effect(
      () => ($validRange(), $date(), $duration(), $hiddenDays(), get$1(todayDisabled), $_currentRange(), tick),
      () => {
        if (!isRunning()) {
          set(running, true);
          set(prevDisabled, false);
          set(nextDisabled, false);
          if ($validRange().start) {
            let currentDate = cloneDate($date());
            store_set(date, prevDate($date(), $duration(), $hiddenDays()));
            set(prevDisabled, test());
            store_set(date, currentDate);
          }
          if ($validRange().end) {
            let currentDate = cloneDate($date());
            store_set(date, nextDate($date(), $duration()));
            set(nextDisabled, test());
            store_set(date, currentDate);
          }
          set(todayDisabled, today2 >= $_currentRange().start && today2 < $_currentRange().end);
          if (!get$1(todayDisabled) && ($validRange().start || $validRange().end)) {
            let currentDate = cloneDate($date());
            store_set(date, cloneDate(today2));
            set(todayDisabled, test());
            store_set(date, currentDate);
          }
          tick().then(() => set(running, false));
        }
      }
    );
    legacy_pre_effect_reset();
    init();
    var fragment = comment();
    var node = first_child(fragment);
    each(node, 1, buttons, index, ($$anchor2, button) => {
      var fragment_1 = comment();
      var node_1 = first_child(fragment_1);
      {
        var consequent = ($$anchor3) => {
          var h2 = root_2$7();
          action(h2, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), $_viewTitle);
          template_effect(() => set_class(h2, 1, ($theme(), untrack(() => $theme().title))));
          append($$anchor3, h2);
        };
        var alternate_4 = ($$anchor3) => {
          var fragment_2 = comment();
          var node_2 = first_child(fragment_2);
          {
            var consequent_1 = ($$anchor4) => {
              var button_1 = root_4$3();
              var i = child(button_1);
              template_effect(() => {
                var _a2, _b2, _c2, _d;
                set_class(button_1, 1, `${(_a2 = ($theme(), untrack(() => $theme().button))) != null ? _a2 : ""} ec-${(_b2 = get$1(button)) != null ? _b2 : ""}`);
                set_attribute(button_1, "aria-label", ($buttonText(), untrack(() => $buttonText().prev)));
                set_attribute(button_1, "title", ($buttonText(), untrack(() => $buttonText().prev)));
                button_1.disabled = get$1(prevDisabled);
                set_class(i, 1, `${(_c2 = ($theme(), untrack(() => $theme().icon))) != null ? _c2 : ""} ec-${(_d = get$1(button)) != null ? _d : ""}`);
              });
              event("click", button_1, prev);
              append($$anchor4, button_1);
            };
            var alternate_3 = ($$anchor4) => {
              var fragment_3 = comment();
              var node_3 = first_child(fragment_3);
              {
                var consequent_2 = ($$anchor5) => {
                  var button_2 = root_6$1();
                  var i_1 = child(button_2);
                  template_effect(() => {
                    var _a2, _b2, _c2, _d;
                    set_class(button_2, 1, `${(_a2 = ($theme(), untrack(() => $theme().button))) != null ? _a2 : ""} ec-${(_b2 = get$1(button)) != null ? _b2 : ""}`);
                    set_attribute(button_2, "aria-label", ($buttonText(), untrack(() => $buttonText().next)));
                    set_attribute(button_2, "title", ($buttonText(), untrack(() => $buttonText().next)));
                    button_2.disabled = get$1(nextDisabled);
                    set_class(i_1, 1, `${(_c2 = ($theme(), untrack(() => $theme().icon))) != null ? _c2 : ""} ec-${(_d = get$1(button)) != null ? _d : ""}`);
                  });
                  event("click", button_2, next);
                  append($$anchor5, button_2);
                };
                var alternate_2 = ($$anchor5) => {
                  var fragment_4 = comment();
                  var node_4 = first_child(fragment_4);
                  {
                    var consequent_3 = ($$anchor6) => {
                      var button_3 = root_8$1();
                      var text2 = child(button_3);
                      template_effect(() => {
                        var _a2, _b2;
                        set_class(button_3, 1, `${(_a2 = ($theme(), untrack(() => $theme().button))) != null ? _a2 : ""} ec-${(_b2 = get$1(button)) != null ? _b2 : ""}`);
                        button_3.disabled = get$1(todayDisabled);
                        set_text(text2, ($buttonText(), get$1(button), untrack(() => $buttonText()[get$1(button)])));
                      });
                      event("click", button_3, () => store_set(date, cloneDate(today2)));
                      append($$anchor6, button_3);
                    };
                    var alternate_1 = ($$anchor6) => {
                      var fragment_5 = comment();
                      var node_5 = first_child(fragment_5);
                      {
                        var consequent_4 = ($$anchor7) => {
                          var button_4 = root_10$1();
                          effect(() => event("click", button_4, function(...$$args) {
                            var _a2;
                            (_a2 = $customButtons()[get$1(button)].click) == null ? void 0 : _a2.apply(this, $$args);
                          }));
                          action(button_4, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $customButtons()[get$1(button)].text);
                          template_effect(() => {
                            var _a2, _b2, _c2;
                            return set_class(button_4, 1, `${(_a2 = ($theme(), untrack(() => $theme().button))) != null ? _a2 : ""} ec-${(_b2 = get$1(button)) != null ? _b2 : ""}${(_c2 = ($customButtons(), get$1(button), $theme(), untrack(() => $customButtons()[get$1(button)].active ? " " + $theme().active : ""))) != null ? _c2 : ""}`);
                          });
                          append($$anchor7, button_4);
                        };
                        var alternate = ($$anchor7) => {
                          var fragment_6 = comment();
                          var node_6 = first_child(fragment_6);
                          {
                            var consequent_5 = ($$anchor8) => {
                              var button_5 = root_12$1();
                              var text_1 = child(button_5);
                              template_effect(() => {
                                var _a2, _b2, _c2;
                                set_class(button_5, 1, `${(_a2 = ($theme(), untrack(() => $theme().button))) != null ? _a2 : ""}${(_b2 = ($view(), get$1(button), $theme(), untrack(() => $view() === get$1(button) ? " " + $theme().active : ""))) != null ? _b2 : ""} ec-${(_c2 = get$1(button)) != null ? _c2 : ""}`);
                                set_text(text_1, ($buttonText(), get$1(button), untrack(() => $buttonText()[get$1(button)])));
                              });
                              event("click", button_5, () => store_set(view2, get$1(button)));
                              append($$anchor8, button_5);
                            };
                            if_block(
                              node_6,
                              ($$render) => {
                                if (get$1(button) != "") $$render(consequent_5);
                              },
                              true
                            );
                          }
                          append($$anchor7, fragment_6);
                        };
                        if_block(
                          node_5,
                          ($$render) => {
                            if ($customButtons(), get$1(button), untrack(() => $customButtons()[get$1(button)])) $$render(consequent_4);
                            else $$render(alternate, false);
                          },
                          true
                        );
                      }
                      append($$anchor6, fragment_5);
                    };
                    if_block(
                      node_4,
                      ($$render) => {
                        if (get$1(button) == "today") $$render(consequent_3);
                        else $$render(alternate_1, false);
                      },
                      true
                    );
                  }
                  append($$anchor5, fragment_4);
                };
                if_block(
                  node_3,
                  ($$render) => {
                    if (get$1(button) == "next") $$render(consequent_2);
                    else $$render(alternate_2, false);
                  },
                  true
                );
              }
              append($$anchor4, fragment_3);
            };
            if_block(
              node_2,
              ($$render) => {
                if (get$1(button) == "prev") $$render(consequent_1);
                else $$render(alternate_3, false);
              },
              true
            );
          }
          append($$anchor3, fragment_2);
        };
        if_block(node_1, ($$render) => {
          if (get$1(button) == "title") $$render(consequent);
          else $$render(alternate_4, false);
        });
      }
      append($$anchor2, fragment_1);
    });
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  var root_3$5 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root_1$d = /* @__PURE__ */ from_html(`<div></div>`);
  var root$r = /* @__PURE__ */ from_html(`<nav></nav>`);
  function Toolbar($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $headerToolbar = () => store_get(headerToolbar, "$headerToolbar", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let { headerToolbar, theme } = getContext("state");
    let sections = /* @__PURE__ */ user_derived(() => {
      var _a2, _b2;
      let sections2 = {};
      for (let key of ["start", "center", "end"]) {
        sections2[key] = (_b2 = (_a2 = $headerToolbar()[key]) == null ? void 0 : _a2.split(" ").map((group) => group.split(","))) != null ? _b2 : [];
      }
      return sections2;
    });
    var nav = root$r();
    each(nav, 21, () => keys(get$1(sections)), index, ($$anchor2, key) => {
      var div = root_1$d();
      each(div, 21, () => get$1(sections)[get$1(key)], index, ($$anchor3, buttons) => {
        var fragment = comment();
        var node = first_child(fragment);
        {
          var consequent = ($$anchor4) => {
            var div_1 = root_3$5();
            var node_1 = child(div_1);
            Buttons(node_1, {
              get buttons() {
                return get$1(buttons);
              }
            });
            template_effect(() => set_class(div_1, 1, $theme().buttonGroup));
            append($$anchor4, div_1);
          };
          var alternate = ($$anchor4) => {
            Buttons($$anchor4, {
              get buttons() {
                return get$1(buttons);
              }
            });
          };
          if_block(node, ($$render) => {
            if (get$1(buttons).length > 1) $$render(consequent);
            else $$render(alternate, false);
          });
        }
        append($$anchor3, fragment);
      });
      template_effect(() => {
        var _a2;
        return set_class(div, 1, `ec-${(_a2 = get$1(key)) != null ? _a2 : ""}`);
      });
      append($$anchor2, div);
    });
    template_effect(() => set_class(nav, 1, $theme().toolbar));
    append($$anchor, nav);
    pop();
    $$cleanup();
  }
  function Auxiliary$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_activeRange = () => store_get(_activeRange, "$_activeRange", $$stores);
    const $datesSet = () => store_get(datesSet, "$datesSet", $$stores);
    const $_view = () => store_get(_view, "$_view", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $eventAllUpdated = () => store_get(eventAllUpdated, "$eventAllUpdated", $$stores);
    const $_queue = () => store_get(_queue, "$_queue", $$stores);
    const $_recheckScrollable = () => store_get(_recheckScrollable, "$_recheckScrollable", $$stores);
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $_auxiliary = () => store_get(_auxiliary, "$_auxiliary", $$stores);
    let {
      datesSet,
      eventAllUpdated,
      _auxiliary,
      _activeRange,
      _filteredEvents,
      _scrollable,
      _bodyEl,
      _tasks,
      _recheckScrollable,
      _queue,
      _view
    } = getContext("state");
    user_effect(() => {
      $_activeRange();
      untrack(() => {
        if (isFunction($datesSet())) {
          $datesSet()({
            start: toLocalDate($_activeRange().start),
            end: toLocalDate($_activeRange().end),
            startStr: toISOString($_activeRange().start),
            endStr: toISOString($_activeRange().end),
            view: toViewWithLocalDates($_view())
          });
        }
      });
    });
    user_effect(() => {
      $_filteredEvents();
      untrack(() => {
        if (isFunction($eventAllUpdated())) {
          task(() => $eventAllUpdated()({ view: toViewWithLocalDates($_view()) }), "eau", _tasks);
        }
      });
    });
    user_effect(() => {
      $_queue();
      untrack(() => {
        flushDebounce($_queue());
      });
    });
    user_effect(() => {
      $_recheckScrollable();
      untrack(() => {
        if ($_bodyEl()) {
          store_set(_scrollable, hasYScroll($_bodyEl()));
        }
        store_set(_recheckScrollable, false);
      });
    });
    var fragment = comment();
    var node = first_child(fragment);
    each(node, 1, $_auxiliary, index, ($$anchor2, Component) => {
      var fragment_1 = comment();
      var node_1 = first_child(fragment_1);
      component(node_1, () => get$1(Component), ($$anchor3, Component_1) => {
        Component_1($$anchor3, {});
      });
      append($$anchor2, fragment_1);
    });
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  var root$q = /* @__PURE__ */ from_html(`<div><!> <!></div> <!>`, 1);
  function Calendar($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_events = () => store_get(_events, "$_events", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $date = () => store_get(date, "$date", $$stores);
    const $duration = () => store_get(duration, "$duration", $$stores);
    const $hiddenDays = () => store_get(hiddenDays, "$hiddenDays", $$stores);
    const $_viewComponent = () => store_get(_viewComponent, "$_viewComponent", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_scrollable = () => store_get(_scrollable, "$_scrollable", $$stores);
    const $_iClass = () => store_get(_iClass, "$_iClass", $$stores);
    const $height = () => store_get(height2, "$height", $$stores);
    const $view = () => store_get(view2, "$view", $$stores);
    let plugins = prop($$props, "plugins", 19, () => []), options = prop($$props, "options", 19, () => ({}));
    let state2 = new State(plugins(), options());
    setContext("state", state2);
    let {
      _viewComponent,
      _interaction,
      _iClass,
      _events,
      _scrollable,
      date,
      duration,
      hiddenDays,
      height: height2,
      theme,
      view: view2
    } = state2;
    let prevOptions = { ...options() };
    user_effect(() => {
      for (let [name, value] of diff(options(), prevOptions)) {
        untrack(() => {
          setOption(name, value);
        });
      }
      assign(prevOptions, options());
    });
    function setOption(name, value) {
      state2._set(name, value);
      return this;
    }
    function getOption(name) {
      let value = state2._get(name);
      return value instanceof Date ? toLocalDate(value) : value;
    }
    function refetchEvents() {
      state2._fetchedRange.set({ start: void 0, end: void 0 });
      return this;
    }
    function getEvents() {
      return $_events().map(toEventWithLocalDates);
    }
    function getEventById(id) {
      for (let event2 of $_events()) {
        if (event2.id == id) {
          return toEventWithLocalDates(event2);
        }
      }
      return null;
    }
    function addEvent(event2) {
      event2 = createEvents([event2])[0];
      $_events().push(event2);
      store_set(_events, $_events());
      return toEventWithLocalDates(event2);
    }
    function updateEvent(event2) {
      let id = String(event2.id);
      let idx = $_events().findIndex((event3) => event3.id === id);
      if (idx >= 0) {
        event2 = createEvents([event2])[0];
        store_mutate(_events, untrack($_events)[idx] = event2, untrack($_events));
        return toEventWithLocalDates(event2);
      }
      return null;
    }
    function removeEventById(id) {
      id = String(id);
      let idx = $_events().findIndex((event2) => event2.id === id);
      if (idx >= 0) {
        $_events().splice(idx, 1);
        store_set(_events, $_events());
      }
      return this;
    }
    function getView() {
      return toViewWithLocalDates(get(state2._view));
    }
    function unselect() {
      var _a2;
      (_a2 = $_interaction().action) == null ? void 0 : _a2.unselect();
      return this;
    }
    function dateFromPoint(x, y) {
      let dayEl = getElementWithPayload(x, y);
      if (dayEl) {
        let info = getPayload(dayEl)(x, y);
        info.date = toLocalDate(info.date);
        return info;
      }
      return null;
    }
    function next() {
      store_set(date, nextDate($date(), $duration()));
      return this;
    }
    function prev() {
      store_set(date, prevDate($date(), $duration(), $hiddenDays()));
      return this;
    }
    let View2 = /* @__PURE__ */ user_derived($_viewComponent);
    var fragment = root$q();
    var div = first_child(fragment);
    let styles;
    var node = child(div);
    Toolbar(node, {});
    var node_1 = sibling(node, 2);
    component(node_1, () => get$1(View2), ($$anchor2, View_1) => {
      View_1($$anchor2, {});
    });
    var node_2 = sibling(div, 2);
    Auxiliary$1(node_2, {});
    template_effect(
      ($0, $1) => {
        var _a2, _b2;
        set_class(div, 1, `${(_a2 = $theme().calendar) != null ? _a2 : ""} ${(_b2 = $theme().view) != null ? _b2 : ""}${$_scrollable() ? " " + $theme().withScroll : ""}${$_iClass() ? " " + $theme()[$_iClass()] : ""}`);
        set_attribute(div, "role", $0);
        styles = set_style(div, "", styles, $1);
      },
      [
        () => listView($view()) ? "list" : "table",
        () => ({ height: $height() })
      ]
    );
    append($$anchor, fragment);
    var $$pop = pop({
      setOption,
      getOption,
      refetchEvents,
      getEvents,
      getEventById,
      addEvent,
      updateEvent,
      removeEventById,
      getView,
      unselect,
      dateFromPoint,
      next,
      prev
    });
    $$cleanup();
    return $$pop;
  }
  function days(state2) {
    return derived([state2.date, state2.firstDay, state2.hiddenDays], ([$date, $firstDay, $hiddenDays]) => {
      let days2 = [];
      let day = cloneDate($date);
      let max2 = 7;
      while (day.getUTCDay() !== $firstDay && max2) {
        subtractDay(day);
        --max2;
      }
      for (let i = 0; i < 7; ++i) {
        if (!$hiddenDays.includes(day.getUTCDay())) {
          days2.push(cloneDate(day));
        }
        addDay(day);
      }
      return days2;
    });
  }
  var root_1$c = /* @__PURE__ */ from_html(`<div role="columnheader"><span></span></div>`);
  var root$p = /* @__PURE__ */ from_html(`<div><div role="row"></div> <div></div></div>`);
  function Header$1($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_days = () => store_get(_days, "$_days", $$stores);
    const $_intlDayHeaderAL = () => store_get(_intlDayHeaderAL, "$_intlDayHeaderAL", $$stores);
    const $_intlDayHeader = () => store_get(_intlDayHeader, "$_intlDayHeader", $$stores);
    let { theme, _intlDayHeader, _intlDayHeaderAL, _days } = getContext("state");
    init();
    var div = root$p();
    var div_1 = child(div);
    each(div_1, 5, $_days, index, ($$anchor2, day) => {
      var div_2 = root_1$c();
      var span = child(div_2);
      action(span, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayHeader().format(get$1(day)));
      template_effect(
        ($0, $1) => {
          var _a2;
          set_class(div_2, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}`);
          set_attribute(span, "aria-label", $1);
        },
        [
          () => {
            var _a2;
            return (_a2 = $theme().weekdays) == null ? void 0 : _a2[get$1(day).getUTCDay()];
          },
          () => $_intlDayHeaderAL().format(get$1(day))
        ]
      );
      append($$anchor2, div_2);
    });
    var div_3 = sibling(div_1, 2);
    template_effect(() => {
      set_class(div, 1, $theme().header);
      set_class(div_1, 1, $theme().days);
      set_class(div_3, 1, $theme().hiddenScroll);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  var read_methods = ["forEach", "isDisjointFrom", "isSubsetOf", "isSupersetOf"];
  var set_like_methods = ["difference", "intersection", "symmetricDifference", "union"];
  var inited = false;
  const _SvelteSet = class _SvelteSet extends Set {
    /**
     * @param {Iterable<T> | null | undefined} [value]
     */
    constructor(value) {
      super();
      __privateAdd(this, _SvelteSet_instances);
      /** @type {Map<T, Source<boolean>>} */
      __privateAdd(this, _sources, /* @__PURE__ */ new Map());
      __privateAdd(this, _version, /* @__PURE__ */ state(0));
      __privateAdd(this, _size, /* @__PURE__ */ state(0));
      __privateAdd(this, _update_version, update_version || -1);
      if (value) {
        for (var element of value) {
          super.add(element);
        }
        __privateGet(this, _size).v = super.size;
      }
      if (!inited) __privateMethod(this, _SvelteSet_instances, init_fn).call(this);
    }
    /** @param {T} value */
    has(value) {
      var has = super.has(value);
      var sources = __privateGet(this, _sources);
      var s = sources.get(value);
      if (s === void 0) {
        if (!has) {
          get$1(__privateGet(this, _version));
          return false;
        }
        s = __privateMethod(this, _SvelteSet_instances, source_fn).call(this, true);
        sources.set(value, s);
      }
      get$1(s);
      return has;
    }
    /** @param {T} value */
    add(value) {
      if (!super.has(value)) {
        super.add(value);
        set(__privateGet(this, _size), super.size);
        increment(__privateGet(this, _version));
      }
      return this;
    }
    /** @param {T} value */
    delete(value) {
      var deleted = super.delete(value);
      var sources = __privateGet(this, _sources);
      var s = sources.get(value);
      if (s !== void 0) {
        sources.delete(value);
        set(s, false);
      }
      if (deleted) {
        set(__privateGet(this, _size), super.size);
        increment(__privateGet(this, _version));
      }
      return deleted;
    }
    clear() {
      if (super.size === 0) {
        return;
      }
      super.clear();
      var sources = __privateGet(this, _sources);
      for (var s of sources.values()) {
        set(s, false);
      }
      sources.clear();
      set(__privateGet(this, _size), 0);
      increment(__privateGet(this, _version));
    }
    keys() {
      return this.values();
    }
    values() {
      get$1(__privateGet(this, _version));
      return super.values();
    }
    entries() {
      get$1(__privateGet(this, _version));
      return super.entries();
    }
    [Symbol.iterator]() {
      return this.keys();
    }
    get size() {
      return get$1(__privateGet(this, _size));
    }
  };
  _sources = new WeakMap();
  _version = new WeakMap();
  _size = new WeakMap();
  _update_version = new WeakMap();
  _SvelteSet_instances = new WeakSet();
  /**
   * If the source is being created inside the same reaction as the SvelteSet instance,
   * we use `state` so that it will not be a dependency of the reaction. Otherwise we
   * use `source` so it will be.
   *
   * @template T
   * @param {T} value
   * @returns {Source<T>}
   */
  source_fn = function(value) {
    return update_version === __privateGet(this, _update_version) ? /* @__PURE__ */ state(value) : source(value);
  };
  // We init as part of the first instance so that we can treeshake this class
  init_fn = function() {
    inited = true;
    var proto = _SvelteSet.prototype;
    var set_proto = Set.prototype;
    for (const method of read_methods) {
      proto[method] = function(...v) {
        get$1(__privateGet(this, _version));
        return set_proto[method].apply(this, v);
      };
    }
    for (const method of set_like_methods) {
      proto[method] = function(...v) {
        get$1(__privateGet(this, _version));
        var set2 = (
          /** @type {Set<T>} */
          set_proto[method].apply(this, v)
        );
        return new _SvelteSet(set2);
      };
    }
  };
  let SvelteSet = _SvelteSet;
  var root_1$b = /* @__PURE__ */ from_html(`<div></div>`);
  var root$o = /* @__PURE__ */ from_html(`<article><!></article>`);
  function BaseEvent($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $resources = () => store_get(resources, "$resources", $$stores);
    const $eventBackgroundColor = () => store_get(eventBackgroundColor, "$eventBackgroundColor", $$stores);
    const $eventColor = () => store_get(eventColor, "$eventColor", $$stores);
    const $eventTextColor = () => store_get(eventTextColor, "$eventTextColor", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $eventClassNames = () => store_get(eventClassNames, "$eventClassNames", $$stores);
    const $_view = () => store_get(_view, "$_view", $$stores);
    const $displayEventEnd = () => store_get(displayEventEnd, "$displayEventEnd", $$stores);
    const $eventContent = () => store_get(eventContent, "$eventContent", $$stores);
    const $_intlEventTime = () => store_get(_intlEventTime, "$_intlEventTime", $$stores);
    const $eventDidMount = () => store_get(eventDidMount, "$eventDidMount", $$stores);
    const $eventClick = () => store_get(eventClick, "$eventClick", $$stores);
    const $eventMouseEnter = () => store_get(eventMouseEnter, "$eventMouseEnter", $$stores);
    const $eventMouseLeave = () => store_get(eventMouseLeave, "$eventMouseLeave", $$stores);
    let el = prop($$props, "el", 15), classes = prop($$props, "classes", 3, identity), styles = prop($$props, "styles", 3, identity);
    let {
      displayEventEnd,
      eventBackgroundColor,
      eventColor,
      eventContent,
      eventClick,
      eventDidMount,
      eventClassNames,
      eventMouseEnter,
      eventMouseLeave,
      eventTextColor,
      resources,
      theme,
      _view,
      _intlEventTime
    } = getContext("state");
    let event$1 = /* @__PURE__ */ user_derived(() => $$props.chunk.event);
    let display = /* @__PURE__ */ user_derived(() => $$props.chunk.event.display);
    let bgColor = /* @__PURE__ */ user_derived(() => {
      var _a2, _b2, _c2;
      return (_c2 = (_b2 = (_a2 = get$1(event$1).backgroundColor) != null ? _a2 : resourceBackgroundColor(get$1(event$1), $resources())) != null ? _b2 : $eventBackgroundColor()) != null ? _c2 : $eventColor();
    });
    let txtColor = /* @__PURE__ */ user_derived(() => {
      var _a2, _b2;
      return (_b2 = (_a2 = get$1(event$1).textColor) != null ? _a2 : resourceTextColor(get$1(event$1), $resources())) != null ? _b2 : $eventTextColor();
    });
    let style = /* @__PURE__ */ user_derived(() => entries(styles()({ "background-color": get$1(bgColor), "color": get$1(txtColor) })).map((entry) => `${entry[0]}:${entry[1]}`).concat(get$1(event$1).styles).join(";"));
    let classNames = /* @__PURE__ */ user_derived(() => classes()([
      bgEvent(get$1(display)) ? $theme().bgEvent : $theme().event,
      ...createEventClasses($eventClassNames(), get$1(event$1), $_view())
    ]).join(" "));
    let $$d = /* @__PURE__ */ user_derived(() => createEventContent($$props.chunk, $displayEventEnd(), $eventContent(), $theme(), $_intlEventTime(), $_view())), $$array = /* @__PURE__ */ user_derived(() => to_array(get$1($$d), 2)), timeText = /* @__PURE__ */ user_derived(() => get$1($$array)[0]), content = /* @__PURE__ */ user_derived(() => get$1($$array)[1]);
    onMount(() => {
      if (isFunction($eventDidMount())) {
        $eventDidMount()({
          event: toEventWithLocalDates(get$1(event$1)),
          timeText: get$1(timeText),
          el: el(),
          view: toViewWithLocalDates($_view())
        });
      }
    });
    function createHandler(fn, display2) {
      return !helperEvent(display2) && isFunction(fn) ? (jsEvent) => fn({
        event: toEventWithLocalDates(get$1(event$1)),
        el: el(),
        jsEvent,
        view: toViewWithLocalDates($_view())
      }) : void 0;
    }
    let onclick2 = /* @__PURE__ */ user_derived(() => !bgEvent(get$1(display)) && createHandler($eventClick(), get$1(display)) || void 0);
    let onkeydown = /* @__PURE__ */ user_derived(() => get$1(onclick2) && keyEnter(get$1(onclick2)));
    let onmouseenter = /* @__PURE__ */ user_derived(() => createHandler($eventMouseEnter(), get$1(display)));
    let onmouseleave = /* @__PURE__ */ user_derived(() => createHandler($eventMouseLeave(), get$1(display)));
    var article = root$o();
    article.__click = function(...$$args) {
      var _a2;
      (_a2 = get$1(onclick2)) == null ? void 0 : _a2.apply(this, $$args);
    };
    article.__keydown = function(...$$args) {
      var _a2;
      (_a2 = get$1(onkeydown)) == null ? void 0 : _a2.apply(this, $$args);
    };
    article.__pointerdown = function(...$$args) {
      var _a2;
      (_a2 = $$props.onpointerdown) == null ? void 0 : _a2.apply(this, $$args);
    };
    {
      const defaultBody = ($$anchor2) => {
        var div = root_1$b();
        action(div, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(content));
        template_effect(() => set_class(div, 1, clsx($theme().eventBody)));
        append($$anchor2, div);
      };
      var node = child(article);
      {
        var consequent = ($$anchor2) => {
          var fragment = comment();
          var node_1 = first_child(fragment);
          snippet(node_1, () => $$props.body, () => defaultBody, () => get$1(bgColor), () => get$1(txtColor));
          append($$anchor2, fragment);
        };
        var alternate = ($$anchor2) => {
          defaultBody($$anchor2);
        };
        if_block(node, ($$render) => {
          if ($$props.body) $$render(consequent);
          else $$render(alternate, false);
        });
      }
      bind_this(article, ($$value) => el($$value), () => el());
    }
    template_effect(() => {
      set_class(article, 1, clsx(get$1(classNames)));
      set_style(article, get$1(style));
      set_attribute(article, "role", get$1(onclick2) ? "button" : void 0);
      set_attribute(article, "tabindex", get$1(onclick2) ? 0 : void 0);
    });
    event("mouseenter", article, function(...$$args) {
      var _a2;
      (_a2 = get$1(onmouseenter)) == null ? void 0 : _a2.apply(this, $$args);
    });
    event("mouseleave", article, function(...$$args) {
      var _a2;
      (_a2 = get$1(onmouseleave)) == null ? void 0 : _a2.apply(this, $$args);
    });
    append($$anchor, article);
    pop();
    $$cleanup();
  }
  delegate(["click", "keydown", "pointerdown"]);
  function InteractableEvent($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_iClasses = () => store_get(_iClasses, "$_iClasses", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    let el = prop($$props, "el", 15);
    let { _interaction, _iClasses } = getContext("state");
    let event2 = /* @__PURE__ */ user_derived(() => $$props.chunk.event);
    let display = /* @__PURE__ */ user_derived(() => $$props.chunk.event.display);
    let classes = /* @__PURE__ */ user_derived(() => (classNames) => $_iClasses()(classNames, get$1(event2)));
    function createDragHandler(event3) {
      var _a2, _b2;
      return ((_a2 = $_interaction().action) == null ? void 0 : _a2.draggable(event3)) ? (jsEvent) => {
        var _a3, _b3;
        return $_interaction().action.drag(event3, jsEvent, (_a3 = $$props.forceDate) == null ? void 0 : _a3.call($$props), (_b3 = $$props.forceMargin) == null ? void 0 : _b3.call($$props));
      } : (_b2 = $_interaction().action) == null ? void 0 : _b2.noAction;
    }
    let onpointerdown = /* @__PURE__ */ user_derived(() => !bgEvent(get$1(display)) && !helperEvent(get$1(display)) ? createDragHandler(get$1(event2)) : void 0);
    let Resizer2 = /* @__PURE__ */ user_derived(() => $_interaction().resizer);
    {
      const body = ($$anchor2, defaultBody = noop$1) => {
        var fragment_1 = comment();
        var node = first_child(fragment_1);
        {
          var consequent = ($$anchor3) => {
            var fragment_2 = comment();
            var node_1 = first_child(fragment_2);
            component(node_1, () => get$1(Resizer2), ($$anchor4, Resizer_1) => {
              Resizer_1($$anchor4, {
                get chunk() {
                  return $$props.chunk;
                },
                get axis() {
                  return $$props.axis;
                },
                get forceDate() {
                  return $$props.forceDate;
                },
                get forceMargin() {
                  return $$props.forceMargin;
                },
                children: ($$anchor5, $$slotProps) => {
                  var fragment_3 = comment();
                  var node_2 = first_child(fragment_3);
                  snippet(node_2, defaultBody);
                  append($$anchor5, fragment_3);
                },
                $$slots: { default: true }
              });
            });
            append($$anchor3, fragment_2);
          };
          var alternate = ($$anchor3) => {
            var fragment_4 = comment();
            var node_3 = first_child(fragment_4);
            snippet(node_3, defaultBody);
            append($$anchor3, fragment_4);
          };
          if_block(node, ($$render) => {
            if (get$1(Resizer2)) $$render(consequent);
            else $$render(alternate, false);
          });
        }
        append($$anchor2, fragment_1);
      };
      BaseEvent($$anchor, {
        get chunk() {
          return $$props.chunk;
        },
        get classes() {
          return get$1(classes);
        },
        get styles() {
          return $$props.styles;
        },
        get onpointerdown() {
          return get$1(onpointerdown);
        },
        get el() {
          return el();
        },
        set el($$value) {
          el($$value);
        },
        body,
        $$slots: { body: true }
      });
    }
    pop();
    $$cleanup();
  }
  function Event$4($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $dayMaxEvents = () => store_get(dayMaxEvents, "$dayMaxEvents", $$stores);
    const $_hiddenEvents = () => store_get(_hiddenEvents, "$_hiddenEvents", $$stores);
    const $_popupDate = () => store_get(_popupDate, "$_popupDate", $$stores);
    let longChunks = prop($$props, "longChunks", 19, () => ({})), inPopup = prop($$props, "inPopup", 3, false), dates = prop($$props, "dates", 19, () => []);
    let { dayMaxEvents, _hiddenEvents, _popupDate } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let margin = /* @__PURE__ */ state(1);
    let hidden = /* @__PURE__ */ state(false);
    let event2 = /* @__PURE__ */ user_derived(() => $$props.chunk.event);
    let display = /* @__PURE__ */ user_derived(() => $$props.chunk.event.display);
    let styles = /* @__PURE__ */ user_derived(() => (style) => {
      if (bgEvent(get$1(display))) {
        style["width"] = `calc(${$$props.chunk.days * 100}% + ${$$props.chunk.days - 1}px)`;
      } else {
        let marginTop = get$1(margin);
        if (get$1(event2)._margin) {
          let [_margin, _dates] = get$1(event2)._margin;
          if ($$props.chunk.date >= _dates[0] && $$props.chunk.date <= _dates.at(-1)) {
            marginTop = _margin;
          }
        }
        style["width"] = `calc(${$$props.chunk.days * 100}% + ${($$props.chunk.days - 1) * 7}px)`;
        style["margin-top"] = `${marginTop}px`;
      }
      if (get$1(hidden)) {
        style["visibility"] = "hidden";
      }
      return style;
    });
    function reposition() {
      set(margin, repositionEvent$1($$props.chunk, longChunks(), height(get$1(el))), true);
      if ($dayMaxEvents() === true) {
        hide();
      } else {
        set(hidden, false);
      }
    }
    function hide() {
      let dayEl = ancestor(get$1(el), 2);
      let h = height(dayEl) - height(dayEl.firstElementChild) - footHeight(dayEl);
      set(hidden, $$props.chunk.bottom > h);
      let update = false;
      for (let date of $$props.chunk.dates) {
        let hiddenEvents = $_hiddenEvents()[date.getTime()];
        if (hiddenEvents) {
          let size = hiddenEvents.size;
          if (get$1(hidden)) {
            hiddenEvents.add($$props.chunk.event);
          } else {
            hiddenEvents.delete($$props.chunk.event);
          }
          if (size !== hiddenEvents.size) {
            update = true;
          }
        }
      }
      if (update) {
        store_set(_hiddenEvents, $_hiddenEvents());
      }
    }
    function footHeight(dayEl) {
      let h = 0;
      for (let i = 0; i < $$props.chunk.days; ++i) {
        h = max(h, height(dayEl.lastElementChild));
        dayEl = dayEl.nextElementSibling;
        if (!dayEl) {
          break;
        }
      }
      return h;
    }
    InteractableEvent($$anchor, {
      get chunk() {
        return $$props.chunk;
      },
      get styles() {
        return get$1(styles);
      },
      axis: "x",
      forceDate: () => inPopup() ? $_popupDate() : void 0,
      forceMargin: () => [
        rect(get$1(el)).top - rect(ancestor(get$1(el), 1)).top,
        dates()
      ],
      get el() {
        return get$1(el);
      },
      set el($$value) {
        set(el, $$value, true);
      }
    });
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  var root$n = /* @__PURE__ */ from_html(`<div><div><time></time> <a role="button" tabindex="0">&times;</a></div> <div></div></div>`);
  function Popup($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_popupChunks = () => store_get(_popupChunks, "$_popupChunks", $$stores);
    const $_popupDate = () => store_get(_popupDate, "$_popupDate", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_intlDayPopover = () => store_get(_intlDayPopover, "$_intlDayPopover", $$stores);
    const $buttonText = () => store_get(buttonText, "$buttonText", $$stores);
    let {
      buttonText,
      theme,
      _interaction,
      _intlDayPopover,
      _popupDate,
      _popupChunks
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let style = /* @__PURE__ */ state("");
    function position() {
      let dayEl = ancestor(get$1(el), 1);
      let bodyEl = ancestor(dayEl, 3);
      let popupRect = rect(get$1(el));
      let dayRect = rect(dayEl);
      let bodyRect = rect(bodyEl);
      set(style, "");
      let left;
      if (popupRect.width >= bodyRect.width) {
        left = bodyRect.left - dayRect.left;
        let right = dayRect.right - bodyRect.right;
        set(style, get$1(style) + `right:${right}px;`);
      } else {
        left = (dayRect.width - popupRect.width) / 2;
        if (dayRect.left + left < bodyRect.left) {
          left = bodyRect.left - dayRect.left;
        } else if (dayRect.left + left + popupRect.width > bodyRect.right) {
          left = bodyRect.right - dayRect.left - popupRect.width;
        }
      }
      set(style, get$1(style) + `left:${left}px;`);
      let top;
      if (popupRect.height >= bodyRect.height) {
        top = bodyRect.top - dayRect.top;
        let bottom = dayRect.bottom - bodyRect.bottom;
        set(style, get$1(style) + `bottom:${bottom}px;`);
      } else {
        top = (dayRect.height - popupRect.height) / 2;
        if (dayRect.top + top < bodyRect.top) {
          top = bodyRect.top - dayRect.top;
        } else if (dayRect.top + top + popupRect.height > bodyRect.bottom) {
          top = bodyRect.bottom - dayRect.top - popupRect.height;
        }
      }
      set(style, get$1(style) + `top:${top}px;`);
    }
    user_effect(() => {
      $_popupChunks();
      tick().then(reposition);
    });
    function reposition() {
      if ($_popupChunks().length) {
        position();
      } else {
        close();
      }
    }
    function close() {
      store_set(_popupDate, null);
      store_set(_popupChunks, []);
    }
    function handlePointerDownOutside() {
      var _a2;
      close();
      (_a2 = $_interaction().action) == null ? void 0 : _a2.noClick();
    }
    var div = root$n();
    var event_handler = /* @__PURE__ */ user_derived(stopPropagation);
    div.__pointerdown = function(...$$args) {
      var _a2;
      (_a2 = get$1(event_handler)) == null ? void 0 : _a2.apply(this, $$args);
    };
    var div_1 = child(div);
    var time = child(div_1);
    action(time, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayPopover().format($_popupDate()));
    var a = sibling(time, 2);
    var event_handler_1 = /* @__PURE__ */ user_derived(() => stopPropagation(close));
    a.__click = function(...$$args) {
      var _a2;
      (_a2 = get$1(event_handler_1)) == null ? void 0 : _a2.apply(this, $$args);
    };
    var event_handler_2 = /* @__PURE__ */ user_derived(() => keyEnter(close));
    a.__keydown = function(...$$args) {
      var _a2;
      (_a2 = get$1(event_handler_2)) == null ? void 0 : _a2.apply(this, $$args);
    };
    var div_2 = sibling(div_1, 2);
    each(div_2, 5, $_popupChunks, (chunk) => chunk.event, ($$anchor2, chunk) => {
      Event$4($$anchor2, {
        get chunk() {
          return get$1(chunk);
        },
        inPopup: true
      });
    });
    bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
    action(div, ($$node, $$action_arg) => outsideEvent == null ? void 0 : outsideEvent($$node, $$action_arg), () => "pointerdown");
    template_effect(
      ($0) => {
        set_class(div, 1, $theme().popup);
        set_style(div, get$1(style));
        set_class(div_1, 1, $theme().dayHead);
        set_attribute(time, "datetime", $0);
        set_attribute(a, "aria-label", $buttonText().close);
        set_class(div_2, 1, $theme().events);
      },
      [() => toISOString($_popupDate(), 10)]
    );
    event("pointerdownoutside", div, handlePointerDownOutside);
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  delegate(["pointerdown", "click", "keydown"]);
  var root_1$a = /* @__PURE__ */ from_html(`<span></span>`);
  var root_5$1 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root_6 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root_4$2 = /* @__PURE__ */ from_html(`<!> <!>`, 1);
  var root_10 = /* @__PURE__ */ from_html(`<a role="button" tabindex="0" aria-haspopup="true"></a>`);
  var root$m = /* @__PURE__ */ from_html(`<div role="cell"><div><time></time> <!></div> <div><!></div> <!> <div><!></div> <!> <div><!></div></div>`);
  function Day$4($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_hiddenEvents = () => store_get(_hiddenEvents, "$_hiddenEvents", $$stores);
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $currentDate = () => store_get(currentDate, "$currentDate", $$stores);
    const $highlightedDates = () => store_get(highlightedDates, "$highlightedDates", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $moreLinkContent = () => store_get(moreLinkContent, "$moreLinkContent", $$stores);
    const $_popupDate = () => store_get(_popupDate, "$_popupDate", $$stores);
    const $weekNumbers = () => store_get(weekNumbers, "$weekNumbers", $$stores);
    const $firstDay = () => store_get(firstDay, "$firstDay", $$stores);
    const $weekNumberContent = () => store_get(weekNumberContent, "$weekNumberContent", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $_intlDayCell = () => store_get(_intlDayCell, "$_intlDayCell", $$stores);
    let iChunks = prop($$props, "iChunks", 19, () => []);
    let {
      date: currentDate,
      dayMaxEvents,
      highlightedDates,
      firstDay,
      moreLinkContent,
      theme,
      validRange,
      weekNumbers,
      weekNumberContent,
      _hiddenEvents,
      _intlDayCell,
      _popupDate,
      _popupChunks,
      _today,
      _interaction
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let hiddenEvents = new SvelteSet();
    user_pre_effect(() => {
      store_mutate(_hiddenEvents, untrack($_hiddenEvents)[$$props.date.getTime()] = untrack(() => hiddenEvents), untrack($_hiddenEvents));
    });
    let refs = [];
    let isToday = /* @__PURE__ */ user_derived(() => datesEqual($$props.date, $_today()));
    let otherMonth = /* @__PURE__ */ user_derived(() => $$props.date.getUTCMonth() !== $currentDate().getUTCMonth());
    let highlight = /* @__PURE__ */ user_derived(() => $highlightedDates().some((d) => datesEqual(d, $$props.date)));
    let disabled = /* @__PURE__ */ user_derived(() => outsideRange($$props.date, $validRange()));
    let dayBgChunks = /* @__PURE__ */ user_derived(() => !get$1(disabled) ? $$props.bgChunks.filter((bgChunk) => datesEqual(bgChunk.date, $$props.date)) : []);
    let dayChunks = /* @__PURE__ */ user_derived(() => {
      let dayChunks2 = [];
      if (!get$1(disabled)) {
        for (let chunk of $$props.chunks) {
          if (datesEqual(chunk.date, $$props.date)) {
            dayChunks2.push(chunk);
          }
        }
      }
      return dayChunks2;
    });
    user_pre_effect(() => {
      get$1(dayChunks);
      hiddenEvents.clear();
    });
    let moreLink = /* @__PURE__ */ user_derived(() => {
      let moreLink2 = "";
      if (!get$1(disabled) && hiddenEvents.size) {
        let text2 = "+" + hiddenEvents.size + " more";
        if ($moreLinkContent()) {
          moreLink2 = isFunction($moreLinkContent()) ? $moreLinkContent()({ num: hiddenEvents.size, text: text2 }) : $moreLinkContent();
        } else {
          moreLink2 = text2;
        }
      }
      return moreLink2;
    });
    onMount(() => {
      setPayload(get$1(el), () => ({
        allDay: true,
        date: $$props.date,
        resource: void 0,
        dayEl: get$1(el),
        disabled: get$1(disabled)
      }));
    });
    function showMore() {
      store_set(_popupDate, $$props.date);
    }
    let showPopup = /* @__PURE__ */ user_derived(() => $_popupDate() && datesEqual($$props.date, $_popupDate()));
    user_pre_effect(() => {
      get$1(dayChunks);
      $$props.longChunks;
      if (get$1(showPopup)) {
        tick().then(setPopupChunks);
      }
    });
    function setPopupChunks() {
      var _a2;
      let nextDay = addDay(cloneDate($$props.date));
      let chunks = get$1(dayChunks).concat(((_a2 = $$props.longChunks[$$props.date.getTime()]) == null ? void 0 : _a2.chunks) || []);
      store_set(_popupChunks, chunks.map((chunk) => assign({}, chunk, createEventChunk(chunk.event, $$props.date, nextDay), { days: 1, dates: [$$props.date] })).sort((a, b) => a.top - b.top));
    }
    let showWeekNumber = /* @__PURE__ */ user_derived(() => $weekNumbers() && $$props.date.getUTCDay() == ($firstDay() ? 1 : 0));
    let weekNumber = /* @__PURE__ */ user_derived(() => {
      let weekNumber2;
      if (get$1(showWeekNumber)) {
        let week = getWeekNumber($$props.date, $firstDay());
        if ($weekNumberContent()) {
          weekNumber2 = isFunction($weekNumberContent()) ? $weekNumberContent()({ date: toLocalDate($$props.date), week }) : $weekNumberContent();
        } else {
          weekNumber2 = "W" + String(week).padStart(2, "0");
        }
      }
      return weekNumber2;
    });
    function reposition() {
      if (!get$1(disabled)) {
        runReposition(refs, get$1(dayChunks));
      }
    }
    var div = root$m();
    div.__pointerdown = function(...$$args) {
      var _a2, _b2;
      (_b2 = (_a2 = $_interaction().action) == null ? void 0 : _a2.select) == null ? void 0 : _b2.apply(this, $$args);
    };
    var div_1 = child(div);
    var time = child(div_1);
    action(time, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayCell().format($$props.date));
    var node = sibling(time, 2);
    {
      var consequent = ($$anchor2) => {
        var span = root_1$a();
        action(span, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(weekNumber));
        template_effect(() => set_class(span, 1, $theme().weekNumber));
        append($$anchor2, span);
      };
      if_block(node, ($$render) => {
        if (get$1(showWeekNumber)) $$render(consequent);
      });
    }
    var div_2 = sibling(div_1, 2);
    var node_1 = child(div_2);
    {
      var consequent_1 = ($$anchor2) => {
        var fragment = comment();
        var node_2 = first_child(fragment);
        each(node_2, 17, () => get$1(dayBgChunks), (chunk) => chunk.event, ($$anchor3, chunk) => {
          Event$4($$anchor3, {
            get chunk() {
              return get$1(chunk);
            }
          });
        });
        append($$anchor2, fragment);
      };
      if_block(node_1, ($$render) => {
        if (!get$1(disabled)) $$render(consequent_1);
      });
    }
    var node_3 = sibling(div_2, 2);
    {
      var consequent_4 = ($$anchor2) => {
        var fragment_2 = root_4$2();
        var node_4 = first_child(fragment_2);
        {
          var consequent_2 = ($$anchor3) => {
            var div_3 = root_5$1();
            var node_5 = child(div_3);
            Event$4(node_5, {
              get chunk() {
                return iChunks()[2];
              }
            });
            template_effect(() => set_class(div_3, 1, $theme().events));
            append($$anchor3, div_3);
          };
          if_block(node_4, ($$render) => {
            if (iChunks()[2] && datesEqual(iChunks()[2].date, $$props.date)) $$render(consequent_2);
          });
        }
        var node_6 = sibling(node_4, 2);
        {
          var consequent_3 = ($$anchor3) => {
            var div_4 = root_6();
            var node_7 = child(div_4);
            Event$4(node_7, {
              get chunk() {
                return iChunks()[0];
              }
            });
            template_effect(() => {
              var _a2, _b2;
              return set_class(div_4, 1, `${(_a2 = $theme().events) != null ? _a2 : ""} ${(_b2 = $theme().preview) != null ? _b2 : ""}`);
            });
            append($$anchor3, div_4);
          };
          if_block(node_6, ($$render) => {
            if (iChunks()[0] && datesEqual(iChunks()[0].date, $$props.date)) $$render(consequent_3);
          });
        }
        append($$anchor2, fragment_2);
      };
      if_block(node_3, ($$render) => {
        if (!get$1(disabled)) $$render(consequent_4);
      });
    }
    var div_5 = sibling(node_3, 2);
    var node_8 = child(div_5);
    {
      var consequent_5 = ($$anchor2) => {
        var fragment_3 = comment();
        var node_9 = first_child(fragment_3);
        each(node_9, 19, () => get$1(dayChunks), (chunk) => chunk.event, ($$anchor3, chunk, i) => {
          bind_this(
            Event$4($$anchor3, {
              get chunk() {
                return get$1(chunk);
              },
              get longChunks() {
                return $$props.longChunks;
              },
              get dates() {
                return $$props.dates;
              }
            }),
            ($$value, i2) => refs[i2] = $$value,
            (i2) => refs == null ? void 0 : refs[i2],
            () => [get$1(i)]
          );
        });
        append($$anchor2, fragment_3);
      };
      if_block(node_8, ($$render) => {
        if (!get$1(disabled)) $$render(consequent_5);
      });
    }
    var node_10 = sibling(div_5, 2);
    {
      var consequent_6 = ($$anchor2) => {
        Popup($$anchor2, {});
      };
      if_block(node_10, ($$render) => {
        if (get$1(showPopup)) $$render(consequent_6);
      });
    }
    var div_6 = sibling(node_10, 2);
    var node_11 = child(div_6);
    {
      var consequent_7 = ($$anchor2) => {
        var a_1 = root_10();
        var event_handler = /* @__PURE__ */ user_derived(() => stopPropagation(showMore));
        a_1.__click = function(...$$args) {
          var _a2;
          (_a2 = get$1(event_handler)) == null ? void 0 : _a2.apply(this, $$args);
        };
        var event_handler_1 = /* @__PURE__ */ user_derived(() => keyEnter(showMore));
        a_1.__keydown = function(...$$args) {
          var _a2;
          (_a2 = get$1(event_handler_1)) == null ? void 0 : _a2.apply(this, $$args);
        };
        var event_handler_2 = /* @__PURE__ */ user_derived(stopPropagation);
        a_1.__pointerdown = function(...$$args) {
          var _a2;
          (_a2 = get$1(event_handler_2)) == null ? void 0 : _a2.apply(this, $$args);
        };
        action(a_1, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(moreLink));
        append($$anchor2, a_1);
      };
      if_block(node_11, ($$render) => {
        if (!get$1(disabled) && hiddenEvents.size) $$render(consequent_7);
      });
    }
    bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
    template_effect(
      ($0, $1) => {
        var _a2;
        set_class(div, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${get$1(isToday) ? " " + $theme().today : ""}${get$1(otherMonth) ? " " + $theme().otherMonth : ""}${get$1(highlight) ? " " + $theme().highlight : ""}${get$1(disabled) ? " " + $theme().disabled : ""}`);
        set_class(div_1, 1, $theme().dayHead);
        set_attribute(time, "datetime", $1);
        set_class(div_2, 1, $theme().bgEvents);
        set_class(div_5, 1, $theme().events);
        set_class(div_6, 1, $theme().dayFoot);
      },
      [
        () => {
          var _a2;
          return (_a2 = $theme().weekdays) == null ? void 0 : _a2[$$props.date.getUTCDay()];
        },
        () => toISOString($$props.date, 10)
      ]
    );
    append($$anchor, div);
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  delegate(["pointerdown", "click", "keydown"]);
  var root$l = /* @__PURE__ */ from_html(`<div role="row"></div>`);
  function Week$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $filterEventsWithResources = () => store_get(filterEventsWithResources, "$filterEventsWithResources", $$stores);
    const $resources = () => store_get(resources, "$resources", $$stores);
    const $hiddenDays = () => store_get(hiddenDays, "$hiddenDays", $$stores);
    const $_iEvents = () => store_get(_iEvents, "$_iEvents", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let {
      _filteredEvents,
      _iEvents,
      resources,
      filterEventsWithResources,
      hiddenDays,
      theme,
      validRange
    } = getContext("state");
    let refs = [];
    let start = /* @__PURE__ */ user_derived(() => limitToRange($$props.dates[0], $validRange()));
    let end = /* @__PURE__ */ user_derived(() => addDay(cloneDate(limitToRange($$props.dates.at(-1), $validRange()))));
    let $$d = /* @__PURE__ */ user_derived(() => {
      let chunks2 = [];
      let bgChunks2 = [];
      for (let event2 of $_filteredEvents()) {
        if (eventIntersects(event2, get$1(start), get$1(end), $filterEventsWithResources() ? $resources() : void 0)) {
          let chunk = createEventChunk(event2, get$1(start), get$1(end));
          if (bgEvent(event2.display)) {
            if (event2.allDay) {
              bgChunks2.push(chunk);
            }
          } else {
            chunks2.push(chunk);
          }
        }
      }
      prepareEventChunks$1(bgChunks2, $hiddenDays());
      let longChunks2 = prepareEventChunks$1(chunks2, $hiddenDays());
      return [chunks2, bgChunks2, longChunks2];
    }), $$array = /* @__PURE__ */ user_derived(() => to_array(get$1($$d), 3)), chunks = /* @__PURE__ */ user_derived(() => get$1($$array)[0]), bgChunks = /* @__PURE__ */ user_derived(() => get$1($$array)[1]), longChunks = /* @__PURE__ */ user_derived(() => get$1($$array)[2]);
    let iChunks = /* @__PURE__ */ user_derived(() => $_iEvents().map((event2) => {
      let chunk;
      if (event2 && eventIntersects(event2, get$1(start), get$1(end))) {
        chunk = createEventChunk(event2, get$1(start), get$1(end));
        prepareEventChunks$1([chunk], $hiddenDays());
      } else {
        chunk = null;
      }
      return chunk;
    }));
    function reposition() {
      runReposition(refs, $$props.dates);
    }
    var div = root$l();
    each(div, 21, () => $$props.dates, index, ($$anchor2, date, i) => {
      bind_this(
        Day$4($$anchor2, {
          get date() {
            return get$1(date);
          },
          get chunks() {
            return get$1(chunks);
          },
          get bgChunks() {
            return get$1(bgChunks);
          },
          get longChunks() {
            return get$1(longChunks);
          },
          get iChunks() {
            return get$1(iChunks);
          },
          get dates() {
            return $$props.dates;
          }
        }),
        ($$value, i2) => refs[i2] = $$value,
        (i2) => refs == null ? void 0 : refs[i2],
        () => [i]
      );
    });
    template_effect(() => set_class(div, 1, $theme().days));
    append($$anchor, div);
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  var root$k = /* @__PURE__ */ from_html(`<div><div></div></div>`);
  function Body$3($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $hiddenDays = () => store_get(hiddenDays, "$hiddenDays", $$stores);
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $dayMaxEvents = () => store_get(dayMaxEvents, "$dayMaxEvents", $$stores);
    const $_hiddenEvents = () => store_get(_hiddenEvents, "$_hiddenEvents", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let {
      _bodyEl,
      _viewDates,
      _filteredEvents,
      _hiddenEvents,
      _recheckScrollable,
      dayMaxEvents,
      hiddenDays,
      theme
    } = getContext("state");
    let refs = [];
    let days2 = /* @__PURE__ */ user_derived(() => 7 - $hiddenDays().length);
    let weeks = /* @__PURE__ */ user_derived(() => {
      let weeks2 = [];
      for (let i = 0; i < $_viewDates().length / get$1(days2); ++i) {
        let dates = [];
        for (let j = 0; j < get$1(days2); ++j) {
          dates.push($_viewDates()[i * get$1(days2) + j]);
        }
        weeks2.push(dates);
      }
      return weeks2;
    });
    user_pre_effect(() => {
      get$1(weeks);
      $dayMaxEvents();
      store_set(_hiddenEvents, {});
    });
    function reposition() {
      runReposition(refs, get$1(weeks));
    }
    user_effect(() => {
      $_filteredEvents();
      $_hiddenEvents();
      $dayMaxEvents();
      untrack(reposition);
    });
    var div = root$k();
    event("resize", $window, reposition);
    var div_1 = child(div);
    each(div_1, 21, () => get$1(weeks), index, ($$anchor2, dates, i) => {
      bind_this(
        Week$1($$anchor2, {
          get dates() {
            return get$1(dates);
          }
        }),
        ($$value, i2) => refs[i2] = $$value,
        (i2) => refs == null ? void 0 : refs[i2],
        () => [i]
      );
    });
    bind_this(div, ($$value) => store_set(_bodyEl, $$value), () => $_bodyEl());
    action(div, ($$node, $$action_arg) => observeResize == null ? void 0 : observeResize($$node, $$action_arg), () => () => store_set(_recheckScrollable, true));
    template_effect(() => {
      var _a2;
      set_class(div, 1, `${(_a2 = $theme().body) != null ? _a2 : ""}${$dayMaxEvents() === true ? " " + $theme().uniform : ""}`);
      set_class(div_1, 1, $theme().content);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  var root$j = /* @__PURE__ */ from_html(`<!> <!>`, 1);
  function View$4($$anchor) {
    var fragment = root$j();
    var node = first_child(fragment);
    Header$1(node, {});
    var node_1 = sibling(node, 2);
    Body$3(node_1, {});
    append($$anchor, fragment);
  }
  const DayGrid = {
    createOptions(options) {
      options.dayMaxEvents = false;
      options.dayCellFormat = { day: "numeric" };
      options.dayPopoverFormat = { month: "long", day: "numeric", year: "numeric" };
      options.moreLinkContent = void 0;
      options.weekNumbers = false;
      options.weekNumberContent = void 0;
      options.buttonText.dayGridMonth = "month";
      options.buttonText.close = "Close";
      options.theme.uniform = "ec-uniform";
      options.theme.dayFoot = "ec-day-foot";
      options.theme.popup = "ec-popup";
      options.theme.weekNumber = "ec-week-number";
      options.view = "dayGridMonth";
      options.views.dayGridMonth = {
        buttonText: btnTextMonth,
        component: View$4,
        dayHeaderFormat: { weekday: "short" },
        dayHeaderAriaLabelFormat: { weekday: "long" },
        displayEventEnd: false,
        duration: { months: 1 },
        theme: themeView("ec-day-grid ec-month-view"),
        titleFormat: { year: "numeric", month: "long" }
      };
    },
    createStores(state2) {
      state2._days = days(state2);
      state2._intlDayCell = intl(state2.locale, state2.dayCellFormat);
      state2._intlDayPopover = intl(state2.locale, state2.dayPopoverFormat);
      state2._hiddenEvents = writable({});
      state2._popupDate = writable(null);
      state2._popupChunks = writable([]);
    }
  };
  function eventDraggable(event2, $eventStartEditable, $editable) {
    var _a2, _b2, _c2;
    return (_c2 = (_b2 = (_a2 = event2.startEditable) != null ? _a2 : $eventStartEditable) != null ? _b2 : event2.editable) != null ? _c2 : $editable;
  }
  function eventResizable(event2, $eventDurationEditable, $editable) {
    var _a2, _b2, _c2;
    return (_c2 = (_b2 = (_a2 = event2.durationEditable) != null ? _a2 : $eventDurationEditable) != null ? _b2 : event2.editable) != null ? _c2 : $editable;
  }
  let busy = false;
  function animate(fn) {
    if (!busy) {
      busy = true;
      window.requestAnimationFrame(() => {
        fn();
        busy = false;
      });
    }
  }
  function limit(value, minLimit, maxLimit) {
    return max(minLimit, min(maxLimit, value));
  }
  function Action($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $eventStartEditable = () => store_get(eventStartEditable, "$eventStartEditable", $$stores);
    const $editable = () => store_get(editable, "$editable", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $selectable = () => store_get(selectable, "$selectable", $$stores);
    const $view = () => store_get(view2, "$view", $$stores);
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $datesAboveResources = () => store_get(datesAboveResources, "$datesAboveResources", $$stores);
    const $selectLongPressDelay = () => store_get(selectLongPressDelay, "$selectLongPressDelay", $$stores);
    const $eventLongPressDelay = () => store_get(eventLongPressDelay, "$eventLongPressDelay", $$stores);
    const $longPressDelay = () => store_get(longPressDelay, "$longPressDelay", $$stores);
    const $selectMinDistance = () => store_get(selectMinDistance, "$selectMinDistance", $$stores);
    const $eventDragMinDistance = () => store_get(eventDragMinDistance, "$eventDragMinDistance", $$stores);
    const $_iEvents = () => store_get(_iEvents, "$_iEvents", $$stores);
    const $eventResizeStart = () => store_get(eventResizeStart, "$eventResizeStart", $$stores);
    const $eventDragStart = () => store_get(eventDragStart, "$eventDragStart", $$stores);
    const $resizeConstraint = () => store_get(resizeConstraint, "$resizeConstraint", $$stores);
    const $selectConstraint = () => store_get(selectConstraint, "$selectConstraint", $$stores);
    const $dragConstraint = () => store_get(dragConstraint, "$dragConstraint", $$stores);
    const $dragScroll = () => store_get(dragScroll, "$dragScroll", $$stores);
    const $slotHeight = () => store_get(slotHeight, "$slotHeight", $$stores);
    const $slotWidth = () => store_get(slotWidth, "$slotWidth", $$stores);
    const $unselectAuto = () => store_get(unselectAuto, "$unselectAuto", $$stores);
    const $unselectCancel = () => store_get(unselectCancel, "$unselectCancel", $$stores);
    const $selectFn = () => store_get(selectFn, "$selectFn", $$stores);
    const $eventResizeStop = () => store_get(eventResizeStop, "$eventResizeStop", $$stores);
    const $eventDragStop = () => store_get(eventDragStop, "$eventDragStop", $$stores);
    const $_view = () => store_get(_view, "$_view", $$stores);
    const $eventResize = () => store_get(eventResize, "$eventResize", $$stores);
    const $eventDrop = () => store_get(eventDrop, "$eventDrop", $$stores);
    const $dateClick = () => store_get(dateClick, "$dateClick", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $_dayGrid = () => store_get(_dayGrid, "$_dayGrid", $$stores);
    const $_events = () => store_get(_events, "$_events", $$stores);
    const $selectBackgroundColor = () => store_get(selectBackgroundColor, "$selectBackgroundColor", $$stores);
    const $unselectFn = () => store_get(unselectFn, "$unselectFn", $$stores);
    let {
      _iEvents,
      _iClass,
      _events,
      _view,
      _dayGrid,
      _bodyEl,
      datesAboveResources,
      dateClick,
      dragConstraint,
      dragScroll,
      editable,
      eventStartEditable,
      eventDragMinDistance,
      eventDragStart,
      eventDragStop,
      eventDrop,
      eventLongPressDelay,
      eventResizeStart,
      eventResizeStop,
      eventResize,
      longPressDelay,
      resizeConstraint,
      selectable,
      select: selectFn,
      selectBackgroundColor,
      selectConstraint,
      selectLongPressDelay,
      selectMinDistance,
      slotDuration,
      slotHeight,
      slotWidth,
      unselect: unselectFn,
      unselectAuto,
      unselectCancel,
      validRange,
      view: view2
    } = getContext("state");
    const ACTION_DRAG = 1;
    const ACTION_RESIZE_END = 2;
    const ACTION_RESIZE_START = 3;
    const ACTION_SELECT = 4;
    const ACTION_CLICK = 5;
    const ACTION_NO_ACTION = 6;
    let action2;
    let interacting;
    let event$1;
    let display;
    let date, newDate;
    let resource, newResource;
    let fromX, fromY;
    let toX, toY;
    let bodyEl, bodyRect, clipEl, clipRect;
    let delta;
    let allDay;
    let iClass;
    let minResize;
    let selectStep;
    let selected;
    let noDateClick;
    let timer = /* @__PURE__ */ mutable_source();
    let viewport;
    let margin;
    let extraDuration;
    function draggable(event2) {
      return eventDraggable(event2, $eventStartEditable(), $editable());
    }
    function drag(eventToDrag, jsEvent, forceDate, forceMargin) {
      if (!action2) {
        action2 = validJsEvent(jsEvent) ? ACTION_DRAG : ACTION_NO_ACTION;
        if (complexAction()) {
          event$1 = eventToDrag;
          common(jsEvent);
          if (forceDate) {
            date = forceDate;
          }
          if (forceMargin) {
            margin = forceMargin;
          }
          iClass = "dragging";
          move2(jsEvent);
        }
      }
    }
    function resize(eventToResize, jsEvent, start, axis, forceDate, forceMargin, zeroDuration) {
      if (!action2) {
        action2 = validJsEvent(jsEvent) ? start ? ACTION_RESIZE_START : ACTION_RESIZE_END : ACTION_NO_ACTION;
        if (complexAction()) {
          event$1 = eventToResize;
          common(jsEvent);
          if (forceDate) {
            date = forceDate;
          }
          if (forceMargin) {
            margin = forceMargin;
          }
          iClass = axis === "x" ? "resizingX" : "resizingY";
          if (resizingStart()) {
            minResize = cloneDate(event$1.end);
            if (allDay) {
              copyTime(minResize, event$1.start);
              if (minResize >= event$1.end) {
                subtractDay(minResize);
              }
            } else {
              subtractDuration(minResize, $slotDuration());
              if (minResize < event$1.start) {
                minResize = event$1.start;
              }
              date = event$1.start;
            }
          } else {
            minResize = cloneDate(event$1.start);
            if (allDay) {
              copyTime(minResize, event$1.end);
              if (minResize <= event$1.start && !zeroDuration) {
                addDay(minResize);
              }
            } else {
              addDuration(minResize, $slotDuration());
              if (minResize > event$1.end) {
                minResize = event$1.end;
              }
              date = event$1.end;
              if (!zeroDuration) {
                date = subtractDuration(cloneDate(date), $slotDuration());
              }
            }
            if (zeroDuration && !allDay) {
              extraDuration = $slotDuration();
            }
          }
          move2(jsEvent);
        }
      }
    }
    function select(jsEvent) {
      if (!action2) {
        action2 = validJsEvent(jsEvent) ? $selectable() && !listView($view()) ? ACTION_SELECT : ACTION_CLICK : ACTION_NO_ACTION;
        if (complexAction()) {
          common(jsEvent);
          iClass = "selecting";
          selectStep = allDay ? createDuration({ day: 1 }) : $slotDuration();
          event$1 = {
            allDay,
            start: date,
            end: addDuration(cloneDate(date), selectStep),
            resourceIds: resource ? [resource.id] : []
          };
          move2(jsEvent);
        }
      }
    }
    function noAction() {
      if (!action2) {
        action2 = ACTION_NO_ACTION;
      }
    }
    function common(jsEvent) {
      var _a2;
      window.getSelection().removeAllRanges();
      fromX = toX = jsEvent.clientX;
      fromY = toY = jsEvent.clientY;
      let dayEl = getElementWithPayload(toX, toY);
      ({ allDay, date, resource } = getPayload(dayEl)(toX, toY));
      if (timelineView($view())) {
        bodyEl = clipEl = $_bodyEl();
      } else {
        bodyEl = ancestor(dayEl, resource ? 4 : 3);
        clipEl = ancestor(dayEl, resource && (dragging() || $datesAboveResources()) ? 2 : 1);
      }
      calcViewport();
      if (jsEvent.pointerType !== "mouse") {
        set(timer, setTimeout(
          () => {
            if (action2) {
              interacting = true;
              move2(jsEvent);
            }
          },
          (_a2 = selecting() ? $selectLongPressDelay() : $eventLongPressDelay()) != null ? _a2 : $longPressDelay()
        ));
      }
    }
    function move2(jsEvent) {
      if (interacting || jsEvent && jsEvent.pointerType === "mouse" && distance() >= (selecting() ? $selectMinDistance() : $eventDragMinDistance())) {
        interacting = true;
        unselect(jsEvent);
        store_set(_iClass, iClass);
        if (!$_iEvents()[0]) {
          if (selecting()) {
            createIEventSelect();
          } else {
            createIEvent(jsEvent, resizing() ? $eventResizeStart() : $eventDragStart());
          }
        }
        let payload = findPayload(findDayEl());
        if (payload) {
          let newAllDay;
          ({ allDay: newAllDay, date: newDate, resource: newResource } = payload);
          if (newAllDay === allDay) {
            let candidate = copyIEventData({}, $_iEvents()[0]);
            let constraintFn = $resizeConstraint();
            delta = createDuration((newDate - date) / 1e3);
            if (resizingStart()) {
              candidate.start = addDuration(cloneDate(event$1.start), delta);
              if (candidate.start > minResize) {
                candidate.start = minResize;
                delta = createDuration((minResize - event$1.start) / 1e3);
              }
            } else {
              candidate.end = addDuration(cloneDate(event$1.end), delta);
              if (extraDuration) {
                addDuration(candidate.end, extraDuration);
              }
              if (resizing()) {
                if (candidate.end < minResize) {
                  candidate.end = minResize;
                  delta = createDuration((minResize - event$1.end) / 1e3);
                }
              } else if (selecting()) {
                if (candidate.end < event$1.end) {
                  candidate.start = subtractDuration(candidate.end, selectStep);
                  candidate.end = event$1.end;
                } else {
                  candidate.start = event$1.start;
                }
                constraintFn = $selectConstraint();
              } else {
                candidate.start = addDuration(cloneDate(event$1.start), delta);
                if (resource) {
                  candidate.resourceIds = event$1.resourceIds.filter((id) => id !== resource.id);
                  candidate.resourceIds.push(newResource.id);
                }
                constraintFn = $dragConstraint();
              }
            }
            do {
              if (constraintFn !== void 0) {
                candidate = copyIEventData(cloneEvent(event$1), candidate);
                let result = constraintFn(selecting() ? createSelectCallbackInfo(candidate, jsEvent) : createCallbackInfo(candidate, event$1, jsEvent));
                if (result === false) {
                  store_mutate(_iEvents, untrack($_iEvents)[0] = copyIEventData($_iEvents()[0], event$1), untrack($_iEvents));
                  break;
                }
              }
              store_mutate(_iEvents, untrack($_iEvents)[0] = copyIEventData($_iEvents()[0], candidate), untrack($_iEvents));
            } while (0);
          }
        }
      }
      if ($dragScroll()) {
        let thresholdY = $slotHeight() * 2;
        let thresholdX = $slotWidth();
        animate(() => {
          if (bodyEl) {
            if (toY < thresholdY) {
              window.scrollBy(0, max(-10, (toY - thresholdY) / 3));
            }
            if (toY < bodyRect.top + thresholdY) {
              bodyEl.scrollTop += max(-10, (toY - bodyRect.top - thresholdY) / 3);
            }
            if (toY > window.innerHeight - thresholdY) {
              window.scrollBy(0, min(10, (toY - window.innerHeight + thresholdY) / 3));
            }
            if (toY > bodyRect.bottom - thresholdY) {
              bodyEl.scrollTop += min(10, (toY - bodyRect.bottom + thresholdY) / 3);
            }
            if (timelineView($view())) {
              if (toX < bodyRect.left + thresholdX) {
                bodyEl.scrollLeft += max(-10, (toX - bodyRect.left - thresholdX) / 3);
              }
              if (toX > bodyRect.right - thresholdX) {
                bodyEl.scrollLeft += min(10, (toX - bodyRect.right + thresholdX) / 3);
              }
            }
          }
        });
      }
    }
    function handleScroll() {
      if (complexAction()) {
        calcViewport();
        move2();
      }
    }
    function handlePointerMove(jsEvent) {
      if (complexAction() && jsEvent.isPrimary) {
        toX = jsEvent.clientX;
        toY = jsEvent.clientY;
        move2(jsEvent);
      }
    }
    function handlePointerUp(jsEvent) {
      if (selected && $unselectAuto() && !($unselectCancel() && jsEvent.target.closest($unselectCancel()))) {
        unselect(jsEvent);
      }
      if (action2 && jsEvent.isPrimary) {
        if (interacting) {
          if (selecting()) {
            selected = true;
            if (isFunction($selectFn())) {
              let info = createSelectCallbackInfo($_iEvents()[0], jsEvent);
              $selectFn()(info);
            }
          } else {
            event$1.display = display;
            let callback = resizing() ? $eventResizeStop() : $eventDragStop();
            if (isFunction(callback)) {
              callback({
                event: toEventWithLocalDates(event$1),
                jsEvent,
                view: toViewWithLocalDates($_view())
              });
            }
            let oldEvent = cloneEvent(event$1);
            updateEvent(event$1, $_iEvents()[0]);
            destroyIEvent();
            callback = resizing() ? $eventResize() : $eventDrop();
            if (isFunction(callback)) {
              let eventRef = event$1;
              let info = createCallbackInfo(event$1, oldEvent, jsEvent);
              callback(assign(info, {
                revert() {
                  updateEvent(eventRef, oldEvent);
                }
              }));
            }
          }
        } else {
          if (clicking() || selecting()) {
            if (isFunction($dateClick()) && !noDateClick) {
              toX = jsEvent.clientX;
              toY = jsEvent.clientY;
              let dayEl = getElementWithPayload(toX, toY);
              if (dayEl) {
                let { allDay: allDay2, date: date2, resource: resource2 } = getPayload(dayEl)(toX, toY);
                $dateClick()({
                  allDay: allDay2,
                  date: toLocalDate(date2),
                  dateStr: toISOString(date2),
                  dayEl,
                  jsEvent,
                  view: toViewWithLocalDates($_view()),
                  resource: resource2
                });
              }
            }
          }
        }
        interacting = false;
        action2 = fromX = fromY = toX = toY = event$1 = display = date = newDate = resource = newResource = delta = extraDuration = allDay = store_set(_iClass, minResize = selectStep = margin = void 0);
        bodyEl = clipEl = bodyRect = clipRect = void 0;
        if (get$1(timer)) {
          clearTimeout(get$1(timer));
          set(timer, void 0);
        }
      }
      noDateClick = false;
    }
    function findDayEl() {
      return getElementWithPayload(limit(toX, viewport[0], viewport[1]), limit(toY, viewport[2], viewport[3]));
    }
    function findPayload(dayEl) {
      if (dayEl) {
        let payload = getPayload(dayEl)(toX, toY);
        if (payload.disabled) {
          if (!$validRange().end || payload.date < $validRange().end) {
            return findPayload(dayEl.nextElementSibling);
          }
          if (!$validRange().start || payload.date > $validRange().start) {
            return findPayload(dayEl.previousElementSibling);
          }
        } else {
          return payload;
        }
      }
      return null;
    }
    function calcViewport() {
      bodyRect = rect(bodyEl);
      clipRect = rect(clipEl);
      viewport = [
        max(0, clipRect.left + (timelineView($view()) ? 1 : $_dayGrid() ? 0 : 8)),
        // left
        min(document.documentElement.clientWidth, clipRect.left + clipEl.clientWidth) - 2,
        // right
        max(0, bodyRect.top),
        // top
        min(document.documentElement.clientHeight, bodyRect.top + bodyEl.clientHeight) - 2
        // bottom
      ];
    }
    function createIEvent(jsEvent, callback) {
      if (isFunction(callback)) {
        callback({
          event: toEventWithLocalDates(event$1),
          jsEvent,
          view: toViewWithLocalDates($_view())
        });
      }
      display = event$1.display;
      event$1.display = "preview";
      store_mutate(_iEvents, untrack($_iEvents)[0] = cloneEvent(event$1), untrack($_iEvents));
      if (margin !== void 0) {
        store_mutate(_iEvents, untrack($_iEvents)[0]._margin = margin, untrack($_iEvents));
      }
      if (extraDuration) {
        addDuration($_iEvents()[0].end, extraDuration);
      }
      event$1.display = "ghost";
      store_set(_events, $_events());
    }
    function createIEventSelect() {
      store_mutate(
        _iEvents,
        untrack($_iEvents)[0] = {
          id: "{select}",
          allDay: event$1.allDay,
          start: event$1.start,
          title: "",
          display: "preview",
          extendedProps: {},
          backgroundColor: $selectBackgroundColor(),
          resourceIds: event$1.resourceIds,
          classNames: [],
          styles: []
        },
        untrack($_iEvents)
      );
    }
    function destroyIEvent() {
      store_mutate(_iEvents, untrack($_iEvents)[0] = null, untrack($_iEvents));
    }
    function copyIEventData(target, source2) {
      target.start = source2.start;
      target.end = source2.end;
      target.resourceIds = source2.resourceIds;
      return target;
    }
    function updateEvent(target, source2) {
      copyIEventData(target, source2);
      store_set(_events, $_events());
    }
    function createSelectCallbackInfo(event2, jsEvent) {
      let { start, end } = toEventWithLocalDates(event2);
      return {
        start,
        end,
        startStr: toISOString(event2.start),
        endStr: toISOString(event2.end),
        allDay,
        view: toViewWithLocalDates($_view()),
        resource,
        jsEvent
      };
    }
    function createCallbackInfo(event2, oldEvent, jsEvent) {
      let info;
      if (resizing()) {
        info = resizingStart() ? { startDelta: delta, endDelta: createDuration(0) } : { startDelta: createDuration(0), endDelta: delta };
      } else {
        info = {
          delta,
          oldResource: resource !== newResource ? resource : void 0,
          newResource: resource !== newResource ? newResource : void 0
        };
      }
      assign(info, {
        event: toEventWithLocalDates(event2),
        oldEvent: toEventWithLocalDates(oldEvent),
        view: toViewWithLocalDates($_view()),
        jsEvent
      });
      return info;
    }
    function distance() {
      return Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    }
    function dragging() {
      return action2 === ACTION_DRAG;
    }
    function resizing() {
      return action2 === ACTION_RESIZE_END || resizingStart();
    }
    function resizingStart() {
      return action2 === ACTION_RESIZE_START;
    }
    function clicking() {
      return action2 === ACTION_CLICK;
    }
    function selecting() {
      return action2 === ACTION_SELECT;
    }
    function complexAction() {
      return action2 && action2 < ACTION_CLICK;
    }
    function validJsEvent(jsEvent) {
      return jsEvent.isPrimary && (jsEvent.pointerType !== "mouse" || jsEvent.buttons & 1);
    }
    function unselect(jsEvent) {
      if (selected) {
        selected = false;
        destroyIEvent();
        if (isFunction($unselectFn())) {
          $unselectFn()({ jsEvent, view: toViewWithLocalDates($_view()) });
        }
      }
    }
    function noClick() {
      noDateClick = true;
    }
    _view.subscribe(unselect);
    function handleTouchStart(jsEvent) {
      if (complexAction()) {
        let target = jsEvent.target;
        let stops = [];
        let stop = () => runAll(stops);
        stops.push(listen(window, "touchmove", noop, { passive: false }));
        stops.push(listen(target, "touchmove", createPreventDefaultHandler(() => interacting)));
        stops.push(listen(target, "touchend", stop));
        stops.push(listen(target, "touchcancel", stop));
      }
    }
    function createPreventDefaultHandler(condition) {
      return (jsEvent) => {
        if (condition()) {
          jsEvent.preventDefault();
        }
      };
    }
    init();
    event("pointermove", $window, handlePointerMove);
    event("pointerup", $window, handlePointerUp);
    event("pointercancel", $window, handlePointerUp);
    event("scroll", $window, handleScroll);
    var event_handler = /* @__PURE__ */ user_derived(() => createPreventDefaultHandler(complexAction));
    event("selectstart", $window, function(...$$args) {
      var _a2;
      (_a2 = get$1(event_handler)) == null ? void 0 : _a2.apply(this, $$args);
    });
    var event_handler_1 = /* @__PURE__ */ user_derived(() => createPreventDefaultHandler(() => get$1(timer)));
    event("contextmenu", $window, function(...$$args) {
      var _a2;
      (_a2 = get$1(event_handler_1)) == null ? void 0 : _a2.apply(this, $$args);
    });
    event("touchstart", $window, handleTouchStart, void 0, true);
    bind_prop($$props, "draggable", draggable);
    bind_prop($$props, "drag", drag);
    bind_prop($$props, "resize", resize);
    bind_prop($$props, "select", select);
    bind_prop($$props, "noAction", noAction);
    bind_prop($$props, "handleScroll", handleScroll);
    bind_prop($$props, "unselect", unselect);
    bind_prop($$props, "noClick", noClick);
    var $$pop = pop({
      draggable,
      drag,
      resize,
      select,
      noAction,
      handleScroll,
      unselect,
      noClick
    });
    $$cleanup();
    return $$pop;
  }
  function Pointer($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_iEvents = () => store_get(_iEvents, "$_iEvents", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    let { _iEvents, slotDuration } = getContext("state");
    let x = 0, y = 0;
    user_effect(() => {
      if ($_iEvents()[0]) {
        removePointerEvent();
      }
    });
    function move2() {
      let dayEl = getElementWithPayload(x, y);
      if (dayEl) {
        let { allDay, date, resource, disabled } = getPayload(dayEl)(x, y);
        if (!disabled) {
          let idx = allDay ? 2 : 1;
          if (!$_iEvents()[idx]) {
            createPointerEvent(idx);
          }
          store_mutate(_iEvents, untrack($_iEvents)[idx].start = date, untrack($_iEvents));
          store_mutate(_iEvents, untrack($_iEvents)[idx].end = addDuration(cloneDate(date), $slotDuration()), untrack($_iEvents));
          store_mutate(_iEvents, untrack($_iEvents)[idx].resourceIds = resource ? [resource.id] : [], untrack($_iEvents));
          return;
        }
      }
      removePointerEvent();
    }
    function handleScroll() {
      move2();
    }
    function handlePointerMove(jsEvent) {
      if (validEvent(jsEvent)) {
        x = jsEvent.clientX;
        y = jsEvent.clientY;
        move2();
      }
    }
    function createPointerEvent(idx) {
      store_mutate(
        _iEvents,
        untrack($_iEvents)[idx] = {
          id: "{pointer}",
          title: "",
          display: "pointer",
          extendedProps: {},
          backgroundColor: "transparent",
          classNames: [],
          styles: []
        },
        untrack($_iEvents)
      );
    }
    function removePointerEvent() {
      if ($_iEvents()[1]) {
        store_mutate(_iEvents, untrack($_iEvents)[1] = null, untrack($_iEvents));
      }
      if ($_iEvents()[2]) {
        store_mutate(_iEvents, untrack($_iEvents)[2] = null, untrack($_iEvents));
      }
    }
    function validEvent(jsEvent) {
      return jsEvent.isPrimary && jsEvent.pointerType === "mouse";
    }
    event("pointermove", $window, handlePointerMove);
    event("scroll", $window, handleScroll);
    var $$pop = pop({ handleScroll });
    $$cleanup();
    return $$pop;
  }
  var root_1$9 = /* @__PURE__ */ from_html(`<div></div>`);
  var root_2$6 = /* @__PURE__ */ from_html(`<div></div>`);
  var root$i = /* @__PURE__ */ from_html(`<!> <!> <!>`, 1);
  function Resizer($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $eventDurationEditable = () => store_get(eventDurationEditable, "$eventDurationEditable", $$stores);
    const $editable = () => store_get(editable, "$editable", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $eventResizableFromStart = () => store_get(eventResizableFromStart, "$eventResizableFromStart", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let forceDate = prop($$props, "forceDate", 3, void 0), forceMargin = prop($$props, "forceMargin", 3, void 0);
    let {
      theme,
      eventDurationEditable,
      eventResizableFromStart,
      editable,
      _interaction
    } = getContext("state");
    let event2 = /* @__PURE__ */ user_derived(() => $$props.chunk.event);
    let display = /* @__PURE__ */ user_derived(() => $$props.chunk.event.display);
    let resizable = /* @__PURE__ */ user_derived(() => !bgEvent(get$1(display)) && !helperEvent(get$1(display)) && eventResizable(get$1(event2), $eventDurationEditable(), $editable()));
    function createResizeHandler(start) {
      return (jsEvent) => {
        var _a2, _b2;
        return $_interaction().action.resize(get$1(event2), jsEvent, start, $$props.axis, (_a2 = forceDate()) == null ? void 0 : _a2(), (_b2 = forceMargin()) == null ? void 0 : _b2(), $$props.chunk.zeroDuration);
      };
    }
    var fragment = root$i();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        var div = root_1$9();
        var event_handler = /* @__PURE__ */ user_derived(() => createResizeHandler(true));
        div.__pointerdown = function(...$$args) {
          var _a2;
          (_a2 = get$1(event_handler)) == null ? void 0 : _a2.apply(this, $$args);
        };
        template_effect(() => {
          var _a2, _b2;
          return set_class(div, 1, `${(_a2 = $theme().resizer) != null ? _a2 : ""} ${(_b2 = $theme().start) != null ? _b2 : ""}`);
        });
        append($$anchor2, div);
      };
      if_block(node, ($$render) => {
        if (get$1(resizable) && $eventResizableFromStart()) $$render(consequent);
      });
    }
    var node_1 = sibling(node, 2);
    snippet(node_1, () => $$props.children);
    var node_2 = sibling(node_1, 2);
    {
      var consequent_1 = ($$anchor2) => {
        var div_1 = root_2$6();
        var event_handler_1 = /* @__PURE__ */ user_derived(() => createResizeHandler(false));
        div_1.__pointerdown = function(...$$args) {
          var _a2;
          (_a2 = get$1(event_handler_1)) == null ? void 0 : _a2.apply(this, $$args);
        };
        template_effect(() => set_class(div_1, 1, $theme().resizer));
        append($$anchor2, div_1);
      };
      if_block(node_2, ($$render) => {
        if (get$1(resizable)) $$render(consequent_1);
      });
    }
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  delegate(["pointerdown"]);
  var root$h = /* @__PURE__ */ from_html(`<!> <!>`, 1);
  function Auxiliary($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $eventStartEditable = () => store_get(eventStartEditable, "$eventStartEditable", $$stores);
    const $editable = () => store_get(editable, "$editable", $$stores);
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $pointer = () => store_get(pointer, "$pointer", $$stores);
    let {
      theme,
      editable,
      eventStartEditable,
      pointer,
      _bodyEl,
      _interaction,
      _iClasses
    } = getContext("state");
    store_mutate(_interaction, untrack($_interaction).resizer = Resizer, untrack($_interaction));
    user_effect(() => {
      $theme();
      $eventStartEditable();
      $editable();
      store_set(_iClasses, (classNames, event2) => {
        let { display } = event2;
        return [
          ...classNames,
          helperEvent(display) ? [$theme()[display]] : !bgEvent(display) && eventDraggable(event2, $eventStartEditable(), $editable()) ? [$theme().draggable] : []
        ];
      });
    });
    user_effect(() => {
      if ($_bodyEl()) {
        return listen($_bodyEl(), "scroll", bodyScrollHandler);
      }
    });
    function bodyScrollHandler() {
      var _a2;
      for (let component2 of Object.values($_interaction())) {
        (_a2 = component2 == null ? void 0 : component2.handleScroll) == null ? void 0 : _a2.call(component2);
      }
    }
    var fragment = root$h();
    var node = first_child(fragment);
    bind_this(Action(node, {}), ($$value) => store_mutate(_interaction, untrack($_interaction).action = $$value, untrack($_interaction)), () => {
      var _a2;
      return (_a2 = $_interaction()) == null ? void 0 : _a2.action;
    });
    var node_1 = sibling(node, 2);
    {
      var consequent = ($$anchor2) => {
        bind_this(Pointer($$anchor2, {}), ($$value) => store_mutate(_interaction, untrack($_interaction).pointer = $$value, untrack($_interaction)), () => {
          var _a2;
          return (_a2 = $_interaction()) == null ? void 0 : _a2.pointer;
        });
      };
      if_block(node_1, ($$render) => {
        if ($pointer()) $$render(consequent);
      });
    }
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  const Interaction = {
    createOptions(options) {
      options.dateClick = void 0;
      options.dragConstraint = void 0;
      options.dragScroll = true;
      options.editable = false;
      options.eventDragMinDistance = 5;
      options.eventDragStart = void 0;
      options.eventDragStop = void 0;
      options.eventDrop = void 0;
      options.eventDurationEditable = true;
      options.eventLongPressDelay = void 0;
      options.eventResizableFromStart = false;
      options.eventResizeStart = void 0;
      options.eventResizeStop = void 0;
      options.eventResize = void 0;
      options.eventStartEditable = true;
      options.longPressDelay = 1e3;
      options.pointer = false;
      options.resizeConstraint = void 0;
      options.select = void 0;
      options.selectBackgroundColor = void 0;
      options.selectConstraint = void 0;
      options.selectLongPressDelay = void 0;
      options.selectMinDistance = 5;
      options.unselect = void 0;
      options.unselectAuto = true;
      options.unselectCancel = "";
      options.theme.draggable = "ec-draggable";
      options.theme.ghost = "ec-ghost";
      options.theme.preview = "ec-preview";
      options.theme.pointer = "ec-pointer";
      options.theme.resizer = "ec-resizer";
      options.theme.start = "ec-start";
      options.theme.dragging = "ec-dragging";
      options.theme.resizingY = "ec-resizing-y";
      options.theme.resizingX = "ec-resizing-x";
      options.theme.selecting = "ec-selecting";
    },
    createStores(state2) {
      state2._auxiliary.update(($_auxiliary) => [...$_auxiliary, Auxiliary]);
    }
  };
  var root_1$8 = /* @__PURE__ */ from_html(`<div></div> <!>`, 1);
  function Event$3($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let { theme, _interaction } = getContext("state");
    let styles = /* @__PURE__ */ user_derived(() => (style) => {
      delete style["background-color"];
      delete style["color"];
      return style;
    });
    {
      const body = ($$anchor2, defaultBody = noop$1, bgColor = noop$1, txtColor = noop$1) => {
        var fragment_1 = root_1$8();
        var div = first_child(fragment_1);
        let styles_1;
        var node = sibling(div, 2);
        snippet(node, defaultBody);
        template_effect(
          ($02) => {
            set_class(div, 1, $theme().eventTag);
            styles_1 = set_style(div, "", styles_1, $02);
          },
          [() => ({ "background-color": bgColor() })]
        );
        append($$anchor2, fragment_1);
      };
      let $0 = /* @__PURE__ */ user_derived(() => {
        var _a2;
        return (_a2 = $_interaction().action) == null ? void 0 : _a2.noAction;
      });
      BaseEvent($$anchor, {
        get chunk() {
          return $$props.chunk;
        },
        get styles() {
          return get$1(styles);
        },
        get onpointerdown() {
          return get$1($0);
        },
        body,
        $$slots: { body: true }
      });
    }
    pop();
    $$cleanup();
  }
  var root_1$7 = /* @__PURE__ */ from_html(`<div role="listitem"><h4><time></time> <time></time></h4> <!></div>`);
  function Day$3($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $highlightedDates = () => store_get(highlightedDates, "$highlightedDates", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $filterEventsWithResources = () => store_get(filterEventsWithResources, "$filterEventsWithResources", $$stores);
    const $resources = () => store_get(resources, "$resources", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $_intlListDay = () => store_get(_intlListDay, "$_intlListDay", $$stores);
    const $_intlListDaySide = () => store_get(_intlListDaySide, "$_intlListDaySide", $$stores);
    let {
      _filteredEvents,
      _interaction,
      _intlListDay,
      _intlListDaySide,
      _today,
      resources,
      filterEventsWithResources,
      highlightedDates,
      theme,
      validRange
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let isToday = /* @__PURE__ */ user_derived(() => datesEqual($$props.date, $_today()));
    let highlight = /* @__PURE__ */ user_derived(() => $highlightedDates().some((d) => datesEqual(d, $$props.date)));
    let disabled = /* @__PURE__ */ user_derived(() => outsideRange($$props.date, $validRange()));
    let datetime = /* @__PURE__ */ user_derived(() => toISOString($$props.date, 10));
    let chunks = /* @__PURE__ */ user_derived(() => {
      let chunks2 = [];
      if (!get$1(disabled)) {
        let start = $$props.date;
        let end = addDay(cloneDate($$props.date));
        for (let event2 of $_filteredEvents()) {
          if (!bgEvent(event2.display) && eventIntersects(event2, start, end, $filterEventsWithResources() ? $resources() : void 0)) {
            let chunk = createEventChunk(event2, start, end);
            chunks2.push(chunk);
          }
        }
        sortEventChunks(chunks2);
      }
      return chunks2;
    });
    user_effect(() => {
      if (get$1(el)) {
        setPayload(get$1(el), () => ({
          allDay: true,
          date: $$props.date,
          resource: void 0,
          dayEl: get$1(el),
          disabled: get$1(disabled)
        }));
      }
    });
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        var div = root_1$7();
        div.__pointerdown = function(...$$args) {
          var _a2, _b2;
          (_b2 = (_a2 = $_interaction().action) == null ? void 0 : _a2.select) == null ? void 0 : _b2.apply(this, $$args);
        };
        var h4 = child(div);
        var time = child(h4);
        action(time, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlListDay().format($$props.date));
        var time_1 = sibling(time, 2);
        action(time_1, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlListDaySide().format($$props.date));
        var node_1 = sibling(h4, 2);
        each(node_1, 17, () => get$1(chunks), (chunk) => chunk.event, ($$anchor3, chunk) => {
          Event$3($$anchor3, {
            get chunk() {
              return get$1(chunk);
            }
          });
        });
        bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
        template_effect(
          ($0) => {
            var _a2;
            set_class(div, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${get$1(isToday) ? " " + $theme().today : ""}${get$1(highlight) ? " " + $theme().highlight : ""}`);
            set_class(h4, 1, $theme().dayHead);
            set_attribute(time, "datetime", get$1(datetime));
            set_class(time_1, 1, $theme().daySide);
            set_attribute(time_1, "datetime", get$1(datetime));
          },
          [() => {
            var _a2;
            return (_a2 = $theme().weekdays) == null ? void 0 : _a2[$$props.date.getUTCDay()];
          }]
        );
        append($$anchor2, div);
      };
      if_block(node, ($$render) => {
        if (get$1(chunks).length) $$render(consequent);
      });
    }
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  delegate(["pointerdown"]);
  function onclick$1(jsEvent, $noEventsClick, noEventsClick, $_view, _view) {
    if (isFunction($noEventsClick())) {
      $noEventsClick()({ jsEvent, view: toViewWithLocalDates($_view()) });
    }
  }
  var root_1$6 = /* @__PURE__ */ from_html(`<div></div>`);
  var root$g = /* @__PURE__ */ from_html(`<div><div><!></div></div>`);
  function Body$2($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $noEventsContent = () => store_get(noEventsContent, "$noEventsContent", $$stores);
    const $noEventsClick = () => store_get(noEventsClick, "$noEventsClick", $$stores);
    const $_view = () => store_get(_view, "$_view", $$stores);
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let {
      _bodyEl,
      _filteredEvents,
      _view,
      _viewDates,
      noEventsClick,
      noEventsContent,
      theme
    } = getContext("state");
    let noEvents = /* @__PURE__ */ user_derived(() => {
      let noEvents2 = true;
      if ($_viewDates().length) {
        let start = $_viewDates()[0];
        let end = addDay(cloneDate($_viewDates().at(-1)));
        for (let event2 of $_filteredEvents()) {
          if (!bgEvent(event2.display) && event2.start < end && event2.end > start) {
            noEvents2 = false;
            break;
          }
        }
      }
      return noEvents2;
    });
    let content = /* @__PURE__ */ user_derived(() => isFunction($noEventsContent()) ? $noEventsContent()() : $noEventsContent());
    var div = root$g();
    var div_1 = child(div);
    var node = child(div_1);
    {
      var consequent = ($$anchor2) => {
        var div_2 = root_1$6();
        div_2.__click = [onclick$1, $noEventsClick, noEventsClick, $_view, _view];
        action(div_2, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(content));
        template_effect(() => set_class(div_2, 1, $theme().noEvents));
        append($$anchor2, div_2);
      };
      var alternate = ($$anchor2) => {
        var fragment = comment();
        var node_1 = first_child(fragment);
        each(node_1, 1, $_viewDates, index, ($$anchor3, date) => {
          Day$3($$anchor3, {
            get date() {
              return get$1(date);
            }
          });
        });
        append($$anchor2, fragment);
      };
      if_block(node, ($$render) => {
        if (get$1(noEvents)) $$render(consequent);
        else $$render(alternate, false);
      });
    }
    bind_this(div, ($$value) => store_set(_bodyEl, $$value), () => $_bodyEl());
    template_effect(() => {
      set_class(div, 1, $theme().body);
      set_class(div_1, 1, $theme().content);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  delegate(["click"]);
  function View$3($$anchor) {
    Body$2($$anchor, {});
  }
  const List = {
    createOptions(options) {
      options.buttonText.listDay = "list";
      options.buttonText.listWeek = "list";
      options.buttonText.listMonth = "list";
      options.buttonText.listYear = "list";
      options.listDayFormat = { weekday: "long" };
      options.listDaySideFormat = { year: "numeric", month: "long", day: "numeric" };
      options.noEventsClick = void 0;
      options.noEventsContent = "No events";
      options.theme.daySide = "ec-day-side";
      options.theme.eventTag = "ec-event-tag";
      options.theme.noEvents = "ec-no-events";
      options.view = "listWeek";
      options.views.listDay = {
        buttonText: btnTextDay,
        component: View$3,
        duration: { days: 1 },
        theme: themeView("ec-list ec-day-view")
      };
      options.views.listWeek = {
        buttonText: btnTextWeek,
        component: View$3,
        duration: { weeks: 1 },
        theme: themeView("ec-list ec-week-view")
      };
      options.views.listMonth = {
        buttonText: btnTextMonth,
        component: View$3,
        duration: { months: 1 },
        theme: themeView("ec-list ec-month-view")
      };
      options.views.listYear = {
        buttonText: btnTextYear,
        component: View$3,
        duration: { years: 1 },
        theme: themeView("ec-list ec-year-view")
      };
    },
    createStores(state2) {
      state2._intlListDay = intl(state2.locale, state2.listDayFormat);
      state2._intlListDaySide = intl(state2.locale, state2.listDaySideFormat);
    }
  };
  function times(state2) {
    return derived(
      [state2.slotDuration, state2.slotLabelInterval, state2._slotTimeLimits, state2._intlSlotLabel],
      (args) => createTimes(setMidnight(createDate()), ...args)
    );
  }
  function slotTimeLimits(state2) {
    return derived(
      [state2.slotMinTime, state2.slotMaxTime, state2.flexibleSlotTimeLimits, state2._viewDates, state2._filteredEvents],
      (args) => createSlotTimeLimits(...args)
    );
  }
  function groupEventChunks(chunks) {
    if (!chunks.length) {
      return;
    }
    sortEventChunks(chunks);
    let group = {
      columns: [],
      end: chunks[0].end
    };
    for (let chunk of chunks) {
      let c = 0;
      if (chunk.start < group.end) {
        for (; c < group.columns.length; ++c) {
          if (group.columns[c].at(-1).end <= chunk.start) {
            break;
          }
        }
        if (chunk.end > group.end) {
          group.end = chunk.end;
        }
      } else {
        group = {
          columns: [],
          end: chunk.end
        };
      }
      if (group.columns.length < c + 1) {
        group.columns.push([]);
      }
      group.columns[c].push(chunk);
      chunk.group = group;
      chunk.column = c;
    }
  }
  function createAllDayContent(allDayContent) {
    let text2 = "all-day";
    let content;
    if (allDayContent) {
      content = isFunction(allDayContent) ? allDayContent({ text: text2 }) : allDayContent;
      if (typeof content === "string") {
        content = { html: content };
      }
    } else {
      content = {
        html: text2
      };
    }
    return content;
  }
  var root_1$5 = /* @__PURE__ */ from_html(`<time></time>`);
  var root$f = /* @__PURE__ */ from_html(`<div><div></div> <!></div> <div role="row"><div><!></div> <!></div>`, 1);
  function Section($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $allDayContent = () => store_get(allDayContent, "$allDayContent", $$stores);
    const $slotLabelInterval = () => store_get(slotLabelInterval, "$slotLabelInterval", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_times = () => store_get(_times, "$_times", $$stores);
    let { allDayContent, slotLabelInterval, theme, _times } = getContext("state");
    let allDayText = /* @__PURE__ */ user_derived(() => createAllDayContent($allDayContent()));
    let showAllTimes = /* @__PURE__ */ user_derived(() => $slotLabelInterval() && $slotLabelInterval().seconds <= 0);
    var fragment = root$f();
    var div = first_child(fragment);
    var div_1 = child(div);
    action(div_1, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(allDayText));
    var node = sibling(div_1, 2);
    each(node, 1, $_times, index, ($$anchor2, time, i) => {
      var time_1 = root_1$5();
      action(time_1, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(time)[1]);
      template_effect(() => {
        var _a2;
        set_class(time_1, 1, `${(_a2 = $theme().time) != null ? _a2 : ""}${(i || get$1(showAllTimes)) && get$1(time)[2] ? "" : " " + $theme().minor}`);
        set_attribute(time_1, "datetime", get$1(time)[0]);
      });
      append($$anchor2, time_1);
    });
    var div_2 = sibling(div, 2);
    var div_3 = child(div_2);
    var node_1 = child(div_3);
    {
      var consequent = ($$anchor2) => {
        var fragment_1 = comment();
        var node_2 = first_child(fragment_1);
        snippet(node_2, () => $$props.lines);
        append($$anchor2, fragment_1);
      };
      if_block(node_1, ($$render) => {
        if ($$props.lines) $$render(consequent);
      });
    }
    var node_3 = sibling(div_3, 2);
    {
      var consequent_1 = ($$anchor2) => {
        var fragment_2 = comment();
        var node_4 = first_child(fragment_2);
        snippet(node_4, () => $$props.children);
        append($$anchor2, fragment_2);
      };
      if_block(node_3, ($$render) => {
        if ($$props.children) $$render(consequent_1);
      });
    }
    template_effect(() => {
      set_class(div, 1, $theme().sidebar);
      set_class(div_1, 1, $theme().sidebarTitle);
      set_class(div_2, 1, $theme().days);
      set_class(div_3, 1, $theme().lines);
    });
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  var root_2$5 = /* @__PURE__ */ from_html(`<div></div>`);
  var root$e = /* @__PURE__ */ from_html(`<div><div><!></div></div>`);
  function Body$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $scrollTime = () => store_get(scrollTime, "$scrollTime", $$stores);
    const $_slotTimeLimits = () => store_get(_slotTimeLimits, "$_slotTimeLimits", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $slotHeight = () => store_get(slotHeight, "$slotHeight", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_times = () => store_get(_times, "$_times", $$stores);
    let {
      _bodyEl,
      _viewDates,
      _slotTimeLimits,
      _times,
      _recheckScrollable,
      scrollTime,
      slotDuration,
      slotHeight,
      theme
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    user_effect(() => {
      store_set(_bodyEl, get$1(el));
    });
    user_effect(() => {
      $_viewDates();
      $scrollTime();
      untrack(scrollToTime);
    });
    function scrollToTime() {
      get$1(el).scrollTop = (($scrollTime().seconds - $_slotTimeLimits().min.seconds) / $slotDuration().seconds - 0.5) * $slotHeight();
    }
    var div = root$e();
    var div_1 = child(div);
    var node = child(div_1);
    {
      const lines = ($$anchor2) => {
        var fragment = comment();
        var node_1 = first_child(fragment);
        each(node_1, 1, $_times, index, ($$anchor3, time) => {
          var div_2 = root_2$5();
          template_effect(() => {
            var _a2;
            return set_class(div_2, 1, `${(_a2 = $theme().line) != null ? _a2 : ""}${get$1(time)[2] ? "" : " " + $theme().minor}`);
          });
          append($$anchor3, div_2);
        });
        append($$anchor2, fragment);
      };
      Section(node, {
        get children() {
          return $$props.children;
        },
        lines,
        $$slots: { lines: true }
      });
    }
    bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
    action(div, ($$node, $$action_arg) => observeResize == null ? void 0 : observeResize($$node, $$action_arg), () => () => store_set(_recheckScrollable, true));
    template_effect(() => {
      set_class(div, 1, $theme().body);
      set_class(div_1, 1, $theme().content);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  function Event$2($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $_slotTimeLimits = () => store_get(_slotTimeLimits, "$_slotTimeLimits", $$stores);
    const $slotHeight = () => store_get(slotHeight, "$slotHeight", $$stores);
    const $slotEventOverlap = () => store_get(slotEventOverlap, "$slotEventOverlap", $$stores);
    let { slotEventOverlap, slotDuration, slotHeight, _slotTimeLimits } = getContext("state");
    let display = /* @__PURE__ */ user_derived(() => $$props.chunk.event.display);
    let styles = /* @__PURE__ */ user_derived(() => (style) => {
      let step = $slotDuration().seconds;
      let offset = $_slotTimeLimits().min.seconds;
      let start = ($$props.chunk.start - $$props.date) / 1e3;
      let end = ($$props.chunk.end - $$props.date) / 1e3;
      let top = (start - offset) / step * $slotHeight();
      let height2 = (end - start) / step * $slotHeight() || $slotHeight();
      let maxHeight = ($_slotTimeLimits().max.seconds - start) / step * $slotHeight();
      style["top"] = `${top}px`;
      style["min-height"] = `${height2}px`;
      style["height"] = `${height2}px`;
      style["max-height"] = `${maxHeight}px`;
      if (!bgEvent(get$1(display)) && !helperEvent(get$1(display)) || ghostEvent(get$1(display))) {
        style["z-index"] = `${$$props.chunk.column + 1}`;
        style["left"] = `${100 / $$props.chunk.group.columns.length * $$props.chunk.column}%`;
        style["width"] = `${100 / $$props.chunk.group.columns.length * ($slotEventOverlap() ? 0.5 * (1 + $$props.chunk.group.columns.length - $$props.chunk.column) : 1)}%`;
      }
      return style;
    });
    InteractableEvent($$anchor, {
      get chunk() {
        return $$props.chunk;
      },
      get styles() {
        return get$1(styles);
      },
      axis: "y"
    });
    pop();
    $$cleanup();
  }
  var root$d = /* @__PURE__ */ from_html(`<div></div>`);
  function NowIndicator$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_now = () => store_get(_now, "$_now", $$stores);
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $_slotTimeLimits = () => store_get(_slotTimeLimits, "$_slotTimeLimits", $$stores);
    const $slotHeight = () => store_get(slotHeight, "$slotHeight", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let {
      slotDuration,
      slotHeight,
      theme,
      _now,
      _today,
      _slotTimeLimits
    } = getContext("state");
    let start = /* @__PURE__ */ user_derived(() => ($_now() - $_today()) / 1e3);
    let top = /* @__PURE__ */ user_derived(() => {
      let step = $slotDuration().seconds;
      let offset = $_slotTimeLimits().min.seconds;
      return (get$1(start) - offset) / step * $slotHeight();
    });
    var div = root$d();
    template_effect(() => {
      var _a2;
      set_class(div, 1, $theme().nowIndicator);
      set_style(div, `top:${(_a2 = get$1(top)) != null ? _a2 : ""}px`);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  var root_3$4 = /* @__PURE__ */ from_html(`<!> <!> <!>`, 1);
  var root$c = /* @__PURE__ */ from_html(`<div role="cell"><div><!></div> <div><!></div> <div><!></div></div>`);
  function Day$2($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $highlightedDates = () => store_get(highlightedDates, "$highlightedDates", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $_slotTimeLimits = () => store_get(_slotTimeLimits, "$_slotTimeLimits", $$stores);
    const $filterEventsWithResources = () => store_get(filterEventsWithResources, "$filterEventsWithResources", $$stores);
    const $resources = () => store_get(resources, "$resources", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $_iEvents = () => store_get(_iEvents, "$_iEvents", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $slotHeight = () => store_get(slotHeight, "$slotHeight", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    const $nowIndicator = () => store_get(nowIndicator, "$nowIndicator", $$stores);
    let resource = prop($$props, "resource", 3, void 0);
    let {
      _filteredEvents,
      _iEvents,
      highlightedDates,
      nowIndicator,
      slotDuration,
      slotHeight,
      filterEventsWithResources,
      theme,
      resources,
      validRange,
      _interaction,
      _today,
      _slotTimeLimits
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let isToday = /* @__PURE__ */ user_derived(() => datesEqual($$props.date, $_today()));
    let highlight = /* @__PURE__ */ user_derived(() => $highlightedDates().some((d) => datesEqual(d, $$props.date)));
    let disabled = /* @__PURE__ */ user_derived(() => outsideRange($$props.date, $validRange()));
    let start = /* @__PURE__ */ user_derived(() => addDuration(cloneDate($$props.date), $_slotTimeLimits().min));
    let end = /* @__PURE__ */ user_derived(() => addDuration(cloneDate($$props.date), $_slotTimeLimits().max));
    let resourceFilter = /* @__PURE__ */ user_derived(() => {
      var _a2;
      return (_a2 = resource()) != null ? _a2 : $filterEventsWithResources() ? $resources() : void 0;
    });
    let $$d = /* @__PURE__ */ user_derived(() => {
      if (get$1(disabled)) {
        return [[], []];
      }
      let chunks2 = [];
      let bgChunks2 = [];
      for (let event2 of $_filteredEvents()) {
        if ((!event2.allDay || bgEvent(event2.display)) && eventIntersects(event2, get$1(start), get$1(end), get$1(resourceFilter))) {
          let chunk = createEventChunk(event2, get$1(start), get$1(end));
          switch (event2.display) {
            case "background":
              bgChunks2.push(chunk);
              break;
            default:
              chunks2.push(chunk);
          }
        }
      }
      groupEventChunks(chunks2);
      return [chunks2, bgChunks2];
    }), $$array = /* @__PURE__ */ user_derived(() => to_array(get$1($$d), 2)), chunks = /* @__PURE__ */ user_derived(() => get$1($$array)[0]), bgChunks = /* @__PURE__ */ user_derived(() => get$1($$array)[1]);
    let iChunks = /* @__PURE__ */ user_derived(() => {
      if (get$1(disabled)) {
        return [];
      }
      return $_iEvents().map((event2) => event2 && eventIntersects(event2, get$1(start), get$1(end), resource()) ? createEventChunk(event2, get$1(start), get$1(end)) : null);
    });
    function dateFromPoint(x, y) {
      y -= rect(get$1(el)).top;
      return {
        allDay: false,
        date: addDuration(addDuration(cloneDate($$props.date), $_slotTimeLimits().min), $slotDuration(), floor(y / $slotHeight())),
        resource: resource(),
        dayEl: get$1(el),
        disabled: get$1(disabled)
      };
    }
    onMount(() => {
      setPayload(get$1(el), dateFromPoint);
    });
    var div = root$c();
    div.__pointerdown = function(...$$args) {
      var _a2, _b2;
      (_b2 = !get$1(disabled) ? (_a2 = $_interaction().action) == null ? void 0 : _a2.select : void 0) == null ? void 0 : _b2.apply(this, $$args);
    };
    var div_1 = child(div);
    var node = child(div_1);
    {
      var consequent = ($$anchor2) => {
        var fragment = comment();
        var node_1 = first_child(fragment);
        each(node_1, 17, () => get$1(bgChunks), (chunk) => chunk.event, ($$anchor3, chunk) => {
          Event$2($$anchor3, {
            get date() {
              return $$props.date;
            },
            get chunk() {
              return get$1(chunk);
            }
          });
        });
        append($$anchor2, fragment);
      };
      if_block(node, ($$render) => {
        if (!get$1(disabled)) $$render(consequent);
      });
    }
    var div_2 = sibling(div_1, 2);
    var node_2 = child(div_2);
    {
      var consequent_3 = ($$anchor2) => {
        var fragment_2 = root_3$4();
        var node_3 = first_child(fragment_2);
        {
          var consequent_1 = ($$anchor3) => {
            Event$2($$anchor3, {
              get date() {
                return $$props.date;
              },
              get chunk() {
                return get$1(iChunks)[1];
              }
            });
          };
          if_block(node_3, ($$render) => {
            if (get$1(iChunks)[1]) $$render(consequent_1);
          });
        }
        var node_4 = sibling(node_3, 2);
        each(node_4, 17, () => get$1(chunks), (chunk) => chunk.event, ($$anchor3, chunk) => {
          Event$2($$anchor3, {
            get date() {
              return $$props.date;
            },
            get chunk() {
              return get$1(chunk);
            }
          });
        });
        var node_5 = sibling(node_4, 2);
        {
          var consequent_2 = ($$anchor3) => {
            Event$2($$anchor3, {
              get date() {
                return $$props.date;
              },
              get chunk() {
                return get$1(iChunks)[0];
              }
            });
          };
          if_block(node_5, ($$render) => {
            if (get$1(iChunks)[0] && !get$1(iChunks)[0].event.allDay) $$render(consequent_2);
          });
        }
        append($$anchor2, fragment_2);
      };
      if_block(node_2, ($$render) => {
        if (!get$1(disabled)) $$render(consequent_3);
      });
    }
    var div_3 = sibling(div_2, 2);
    var node_6 = child(div_3);
    {
      var consequent_4 = ($$anchor2) => {
        NowIndicator$1($$anchor2, {});
      };
      if_block(node_6, ($$render) => {
        if ($nowIndicator() && get$1(isToday) && !get$1(disabled)) $$render(consequent_4);
      });
    }
    bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
    template_effect(
      ($0) => {
        var _a2;
        set_class(div, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${get$1(isToday) ? " " + $theme().today : ""}${get$1(highlight) ? " " + $theme().highlight : ""}${get$1(disabled) ? " " + $theme().disabled : ""}`);
        set_class(div_1, 1, $theme().bgEvents);
        set_class(div_2, 1, $theme().events);
        set_class(div_3, 1, $theme().extra);
      },
      [() => {
        var _a2;
        return (_a2 = $theme().weekdays) == null ? void 0 : _a2[$$props.date.getUTCDay()];
      }]
    );
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  delegate(["pointerdown"]);
  function Event$1($$anchor, $$props) {
    push($$props, true);
    let longChunks = prop($$props, "longChunks", 19, () => ({}));
    let el = /* @__PURE__ */ state(void 0);
    let margin = /* @__PURE__ */ state(1);
    let event2 = /* @__PURE__ */ user_derived(() => $$props.chunk.event);
    let display = /* @__PURE__ */ user_derived(() => $$props.chunk.event.display);
    let styles = /* @__PURE__ */ user_derived(() => (style) => {
      var _a2;
      if (bgEvent(get$1(display))) {
        style["width"] = `calc(${$$props.chunk.days * 100}% + ${$$props.chunk.days - 1}px)`;
      } else {
        style["width"] = `calc(${$$props.chunk.days * 100}% + ${($$props.chunk.days - 1) * 7}px)`;
        style["margin-top"] = `${(_a2 = get$1(event2)._margin) != null ? _a2 : get$1(margin)}px`;
      }
      return style;
    });
    function reposition() {
      if (!get$1(el)) {
        return;
      }
      set(margin, repositionEvent$1($$props.chunk, longChunks(), height(get$1(el))), true);
    }
    InteractableEvent($$anchor, {
      get chunk() {
        return $$props.chunk;
      },
      get styles() {
        return get$1(styles);
      },
      axis: "x",
      forceMargin: () => rect(get$1(el)).top - rect(ancestor(get$1(el), 1)).top,
      get el() {
        return get$1(el);
      },
      set el($$value) {
        set(el, $$value, true);
      }
    });
    return pop({ reposition });
  }
  var root_3$3 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root$b = /* @__PURE__ */ from_html(`<div role="cell"><div><!></div> <!> <div><!></div></div>`);
  function Day$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $highlightedDates = () => store_get(highlightedDates, "$highlightedDates", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    let iChunks = prop($$props, "iChunks", 19, () => []), resource = prop($$props, "resource", 3, void 0);
    let { highlightedDates, theme, validRange, _interaction, _today } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let refs = [];
    let dayChunks = /* @__PURE__ */ user_derived(() => $$props.chunks.filter((chunk) => datesEqual(chunk.date, $$props.date)));
    let dayBgChunks = /* @__PURE__ */ user_derived(() => $$props.bgChunks.filter((bgChunk) => datesEqual(bgChunk.date, $$props.date)));
    let isToday = /* @__PURE__ */ user_derived(() => datesEqual($$props.date, $_today()));
    let highlight = /* @__PURE__ */ user_derived(() => $highlightedDates().some((d) => datesEqual(d, $$props.date)));
    let disabled = /* @__PURE__ */ user_derived(() => outsideRange($$props.date, $validRange()));
    onMount(() => {
      setPayload(get$1(el), () => ({
        allDay: true,
        date: $$props.date,
        resource: resource(),
        dayEl: get$1(el),
        disabled: get$1(disabled)
      }));
    });
    function reposition() {
      if (!get$1(disabled)) {
        runReposition(refs, get$1(dayChunks));
      }
    }
    var div = root$b();
    div.__pointerdown = function(...$$args) {
      var _a2, _b2;
      (_b2 = !get$1(disabled) ? (_a2 = $_interaction().action) == null ? void 0 : _a2.select : void 0) == null ? void 0 : _b2.apply(this, $$args);
    };
    var div_1 = child(div);
    var node = child(div_1);
    {
      var consequent = ($$anchor2) => {
        var fragment = comment();
        var node_1 = first_child(fragment);
        each(node_1, 17, () => get$1(dayBgChunks), (chunk) => chunk.event, ($$anchor3, chunk) => {
          Event$1($$anchor3, {
            get chunk() {
              return get$1(chunk);
            }
          });
        });
        append($$anchor2, fragment);
      };
      if_block(node, ($$render) => {
        if (!get$1(disabled)) $$render(consequent);
      });
    }
    var node_2 = sibling(div_1, 2);
    {
      var consequent_1 = ($$anchor2) => {
        var div_2 = root_3$3();
        var node_3 = child(div_2);
        Event$1(node_3, {
          get chunk() {
            return iChunks()[0];
          }
        });
        template_effect(() => {
          var _a2, _b2;
          return set_class(div_2, 1, `${(_a2 = $theme().events) != null ? _a2 : ""} ${(_b2 = $theme().preview) != null ? _b2 : ""}`);
        });
        append($$anchor2, div_2);
      };
      if_block(node_2, ($$render) => {
        if (iChunks()[0] && datesEqual(iChunks()[0].date, $$props.date) && !get$1(disabled)) $$render(consequent_1);
      });
    }
    var div_3 = sibling(node_2, 2);
    var node_4 = child(div_3);
    {
      var consequent_2 = ($$anchor2) => {
        var fragment_2 = comment();
        var node_5 = first_child(fragment_2);
        each(node_5, 19, () => get$1(dayChunks), (chunk) => chunk.event, ($$anchor3, chunk, i) => {
          bind_this(
            Event$1($$anchor3, {
              get chunk() {
                return get$1(chunk);
              },
              get longChunks() {
                return $$props.longChunks;
              }
            }),
            ($$value, i2) => refs[i2] = $$value,
            (i2) => refs == null ? void 0 : refs[i2],
            () => [get$1(i)]
          );
        });
        append($$anchor2, fragment_2);
      };
      if_block(node_4, ($$render) => {
        if (!get$1(disabled)) $$render(consequent_2);
      });
    }
    bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
    template_effect(
      ($0) => {
        var _a2;
        set_class(div, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${get$1(isToday) ? " " + $theme().today : ""}${get$1(highlight) ? " " + $theme().highlight : ""}${get$1(disabled) ? " " + $theme().disabled : ""}`);
        set_class(div_1, 1, $theme().bgEvents);
        set_class(div_3, 1, $theme().events);
      },
      [() => {
        var _a2;
        return (_a2 = $theme().weekdays) == null ? void 0 : _a2[$$props.date.getUTCDay()];
      }]
    );
    append($$anchor, div);
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  delegate(["pointerdown"]);
  function Week($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $filterEventsWithResources = () => store_get(filterEventsWithResources, "$filterEventsWithResources", $$stores);
    const $resources = () => store_get(resources, "$resources", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $hiddenDays = () => store_get(hiddenDays, "$hiddenDays", $$stores);
    const $_iEvents = () => store_get(_iEvents, "$_iEvents", $$stores);
    let resource = prop($$props, "resource", 3, void 0);
    let {
      _filteredEvents,
      _iEvents,
      hiddenDays,
      resources,
      filterEventsWithResources,
      validRange
    } = getContext("state");
    let refs = [];
    let start = /* @__PURE__ */ user_derived(() => limitToRange($$props.dates[0], $validRange()));
    let end = /* @__PURE__ */ user_derived(() => addDay(cloneDate(limitToRange($$props.dates.at(-1), $validRange()))));
    let resourceFilter = /* @__PURE__ */ user_derived(() => {
      var _a2;
      return (_a2 = resource()) != null ? _a2 : $filterEventsWithResources() ? $resources() : void 0;
    });
    let $$d = /* @__PURE__ */ user_derived(() => {
      let chunks2 = [];
      let bgChunks2 = [];
      for (let event2 of $_filteredEvents()) {
        if (event2.allDay && eventIntersects(event2, get$1(start), get$1(end), get$1(resourceFilter))) {
          let chunk = createEventChunk(event2, get$1(start), get$1(end));
          if (bgEvent(event2.display)) {
            bgChunks2.push(chunk);
          } else {
            chunks2.push(chunk);
          }
        }
      }
      prepareEventChunks$1(bgChunks2, $hiddenDays());
      let longChunks2 = prepareEventChunks$1(chunks2, $hiddenDays());
      return [chunks2, bgChunks2, longChunks2];
    }), $$array = /* @__PURE__ */ user_derived(() => to_array(get$1($$d), 3)), chunks = /* @__PURE__ */ user_derived(() => get$1($$array)[0]), bgChunks = /* @__PURE__ */ user_derived(() => get$1($$array)[1]), longChunks = /* @__PURE__ */ user_derived(() => get$1($$array)[2]);
    function reposition() {
      runReposition(refs, $$props.dates);
    }
    user_effect(() => {
      get$1(chunks);
      untrack(reposition);
    });
    let iChunks = /* @__PURE__ */ user_derived(() => $_iEvents().map((event2) => {
      let chunk;
      if (event2 && event2.allDay && eventIntersects(event2, get$1(start), get$1(end), resource())) {
        chunk = createEventChunk(event2, get$1(start), get$1(end));
        prepareEventChunks$1([chunk], $hiddenDays());
      } else {
        chunk = null;
      }
      return chunk;
    }));
    var fragment = comment();
    event("resize", $window, reposition);
    var node = first_child(fragment);
    each(node, 17, () => $$props.dates, index, ($$anchor2, date, i) => {
      bind_this(
        Day$1($$anchor2, {
          get date() {
            return get$1(date);
          },
          get chunks() {
            return get$1(chunks);
          },
          get bgChunks() {
            return get$1(bgChunks);
          },
          get longChunks() {
            return get$1(longChunks);
          },
          get iChunks() {
            return get$1(iChunks);
          },
          get resource() {
            return resource();
          }
        }),
        ($$value, i2) => refs[i2] = $$value,
        (i2) => refs == null ? void 0 : refs[i2],
        () => [i]
      );
    });
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  var root_2$4 = /* @__PURE__ */ from_html(`<div role="columnheader"><time></time></div>`);
  var root_3$2 = /* @__PURE__ */ from_html(`<div><div><!> <div></div></div></div>`);
  var root$a = /* @__PURE__ */ from_html(`<div><!> <div></div></div> <!> <!>`, 1);
  function View$2($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $_intlDayHeaderAL = () => store_get(_intlDayHeaderAL, "$_intlDayHeaderAL", $$stores);
    const $_intlDayHeader = () => store_get(_intlDayHeader, "$_intlDayHeader", $$stores);
    const $allDaySlot = () => store_get(allDaySlot, "$allDaySlot", $$stores);
    let {
      _viewDates,
      _intlDayHeader,
      _intlDayHeaderAL,
      _today,
      allDaySlot,
      theme
    } = getContext("state");
    init();
    var fragment = root$a();
    var div = first_child(fragment);
    var node = child(div);
    Section(node, {
      children: ($$anchor2, $$slotProps) => {
        var fragment_1 = comment();
        var node_1 = first_child(fragment_1);
        each(node_1, 1, $_viewDates, index, ($$anchor3, date) => {
          var div_1 = root_2$4();
          var time = child(div_1);
          action(time, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayHeader().format(get$1(date)));
          template_effect(
            ($0, $1, $2, $3) => {
              var _a2;
              set_class(div_1, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${$1 != null ? $1 : ""}`);
              set_attribute(time, "datetime", $2);
              set_attribute(time, "aria-label", $3);
            },
            [
              () => {
                var _a2;
                return (_a2 = $theme().weekdays) == null ? void 0 : _a2[get$1(date).getUTCDay()];
              },
              () => datesEqual(get$1(date), $_today()) ? " " + $theme().today : "",
              () => toISOString(get$1(date), 10),
              () => $_intlDayHeaderAL().format(get$1(date))
            ]
          );
          append($$anchor3, div_1);
        });
        append($$anchor2, fragment_1);
      },
      $$slots: { default: true }
    });
    var div_2 = sibling(node, 2);
    var node_2 = sibling(div, 2);
    {
      var consequent = ($$anchor2) => {
        var div_3 = root_3$2();
        var div_4 = child(div_3);
        var node_3 = child(div_4);
        Section(node_3, {
          children: ($$anchor3, $$slotProps) => {
            Week($$anchor3, {
              get dates() {
                return $_viewDates();
              }
            });
          },
          $$slots: { default: true }
        });
        var div_5 = sibling(node_3, 2);
        template_effect(() => {
          set_class(div_3, 1, $theme().allDay);
          set_class(div_4, 1, $theme().content);
          set_class(div_5, 1, $theme().hiddenScroll);
        });
        append($$anchor2, div_3);
      };
      if_block(node_2, ($$render) => {
        if ($allDaySlot()) $$render(consequent);
      });
    }
    var node_4 = sibling(node_2, 2);
    Body$1(node_4, {
      children: ($$anchor2, $$slotProps) => {
        var fragment_3 = comment();
        var node_5 = first_child(fragment_3);
        each(node_5, 1, $_viewDates, index, ($$anchor3, date) => {
          Day$2($$anchor3, {
            get date() {
              return get$1(date);
            }
          });
        });
        append($$anchor2, fragment_3);
      },
      $$slots: { default: true }
    });
    template_effect(() => {
      set_class(div, 1, $theme().header);
      set_class(div_2, 1, $theme().hiddenScroll);
    });
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  const TimeGrid = {
    createOptions(options) {
      options.buttonText.timeGridDay = "day";
      options.buttonText.timeGridWeek = "week";
      options.view = "timeGridWeek";
      options.views.timeGridDay = {
        buttonText: btnTextDay,
        component: View$2,
        dayHeaderFormat: { weekday: "long" },
        duration: { days: 1 },
        theme: themeView("ec-time-grid ec-day-view"),
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      };
      options.views.timeGridWeek = {
        buttonText: btnTextWeek,
        component: View$2,
        duration: { weeks: 1 },
        theme: themeView("ec-time-grid ec-week-view")
      };
    },
    createStores(state2) {
      state2._slotTimeLimits = slotTimeLimits(state2);
      state2._times = times(state2);
    }
  };
  var root$9 = /* @__PURE__ */ from_html(`<span></span>`);
  function Label$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $resourceLabelContent = () => store_get(resourceLabelContent, "$resourceLabelContent", $$stores);
    const $_intlDayHeaderAL = () => store_get(_intlDayHeaderAL, "$_intlDayHeaderAL", $$stores);
    const $resourceLabelDidMount = () => store_get(resourceLabelDidMount, "$resourceLabelDidMount", $$stores);
    let date = prop($$props, "date", 3, void 0), setLabel = prop($$props, "setLabel", 3, void 0);
    let {
      resourceLabelContent,
      resourceLabelDidMount,
      _intlDayHeaderAL
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let content = /* @__PURE__ */ user_derived(() => {
      if ($resourceLabelContent()) {
        return isFunction($resourceLabelContent()) ? $resourceLabelContent()({
          resource: $$props.resource,
          date: date() ? toLocalDate(date()) : void 0
        }) : $resourceLabelContent();
      } else {
        return $$props.resource.title;
      }
    });
    let ariaLabel = /* @__PURE__ */ state(void 0);
    user_effect(() => {
      get$1(content);
      untrack(() => {
        if (date()) {
          set(ariaLabel, $_intlDayHeaderAL().format(date()) + ", " + get$1(el).innerText);
        } else if (setLabel()) {
          set(ariaLabel, void 0);
          setLabel()(get$1(el).innerText);
        }
      });
    });
    onMount(() => {
      if (isFunction($resourceLabelDidMount())) {
        $resourceLabelDidMount()({
          resource: $$props.resource,
          date: date() ? toLocalDate(date()) : void 0,
          el: get$1(el)
        });
      }
    });
    var span = root$9();
    bind_this(span, ($$value) => set(el, $$value), () => get$1(el));
    action(span, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(content));
    template_effect(() => set_attribute(span, "aria-label", get$1(ariaLabel)));
    append($$anchor, span);
    pop();
    $$cleanup();
  }
  var root_3$1 = /* @__PURE__ */ from_html(`<div><time></time></div>`);
  var root_4$1 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root_7 = /* @__PURE__ */ from_html(`<div role="columnheader"><!></div>`);
  var root_8 = /* @__PURE__ */ from_html(`<div role="columnheader"><time></time></div>`);
  var root_5 = /* @__PURE__ */ from_html(`<div></div>`);
  var root_2$3 = /* @__PURE__ */ from_html(`<div><!> <!></div>`);
  var root_12 = /* @__PURE__ */ from_html(`<div></div>`);
  var root_15 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root_9 = /* @__PURE__ */ from_html(`<div><div><!> <div></div></div></div>`);
  var root_17 = /* @__PURE__ */ from_html(`<div></div>`);
  var root$8 = /* @__PURE__ */ from_html(`<div><!> <div></div></div> <!> <!>`, 1);
  function View$1($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $datesAboveResources = () => store_get(datesAboveResources, "$datesAboveResources", $$stores);
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $_viewResources = () => store_get(_viewResources, "$_viewResources", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $_intlDayHeaderAL = () => store_get(_intlDayHeaderAL, "$_intlDayHeaderAL", $$stores);
    const $_intlDayHeader = () => store_get(_intlDayHeader, "$_intlDayHeader", $$stores);
    const $allDaySlot = () => store_get(allDaySlot, "$allDaySlot", $$stores);
    let {
      datesAboveResources,
      _today,
      _viewDates,
      _viewResources,
      _intlDayHeader,
      _intlDayHeaderAL,
      allDaySlot,
      theme
    } = getContext("state");
    let loops = /* @__PURE__ */ user_derived(() => $datesAboveResources() ? [$_viewDates(), $_viewResources()] : [$_viewResources(), $_viewDates()]);
    let resourceLabels = proxy([]);
    var fragment = root$8();
    var div = first_child(fragment);
    var node = child(div);
    Section(node, {
      children: ($$anchor2, $$slotProps) => {
        var fragment_1 = comment();
        var node_1 = first_child(fragment_1);
        each(node_1, 17, () => get$1(loops)[0], index, ($$anchor3, item0, i) => {
          var div_1 = root_2$3();
          var node_2 = child(div_1);
          {
            var consequent = ($$anchor4) => {
              var div_2 = root_3$1();
              var time = child(div_2);
              action(time, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayHeader().format(get$1(item0)));
              template_effect(
                ($0, $1, $2, $3) => {
                  var _a2;
                  set_class(div_2, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${$1 != null ? $1 : ""}`);
                  set_attribute(time, "datetime", $2);
                  set_attribute(time, "aria-label", $3);
                },
                [
                  () => {
                    var _a2;
                    return (_a2 = $theme().weekdays) == null ? void 0 : _a2[get$1(item0).getUTCDay()];
                  },
                  () => datesEqual(get$1(item0), $_today()) ? " " + $theme().today : "",
                  () => toISOString(get$1(item0), 10),
                  () => $_intlDayHeaderAL().format(get$1(item0))
                ]
              );
              append($$anchor4, div_2);
            };
            var alternate = ($$anchor4) => {
              var div_3 = root_4$1();
              var node_3 = child(div_3);
              Label$1(node_3, {
                get resource() {
                  return get$1(item0);
                },
                setLabel: (e) => resourceLabels[i] = e.detail + ", "
              });
              template_effect(() => set_class(div_3, 1, $theme().day));
              append($$anchor4, div_3);
            };
            if_block(node_2, ($$render) => {
              if ($datesAboveResources()) $$render(consequent);
              else $$render(alternate, false);
            });
          }
          var node_4 = sibling(node_2, 2);
          {
            var consequent_2 = ($$anchor4) => {
              var div_4 = root_5();
              each(div_4, 21, () => get$1(loops)[1], index, ($$anchor5, item1) => {
                var fragment_2 = comment();
                var node_5 = first_child(fragment_2);
                {
                  var consequent_1 = ($$anchor6) => {
                    var div_5 = root_7();
                    var node_6 = child(div_5);
                    Label$1(node_6, {
                      get resource() {
                        return get$1(item1);
                      },
                      get date() {
                        return get$1(item0);
                      }
                    });
                    template_effect(() => set_class(div_5, 1, $theme().day));
                    append($$anchor6, div_5);
                  };
                  var alternate_1 = ($$anchor6) => {
                    var div_6 = root_8();
                    var time_1 = child(div_6);
                    action(time_1, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayHeader().format(get$1(item1)));
                    template_effect(
                      ($0, $1, $2, $3) => {
                        var _a2, _b2;
                        set_class(div_6, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${$1 != null ? $1 : ""}`);
                        set_attribute(time_1, "datetime", $2);
                        set_attribute(time_1, "aria-label", `${(_b2 = resourceLabels[i]) != null ? _b2 : ""}${$3 != null ? $3 : ""}`);
                      },
                      [
                        () => {
                          var _a2;
                          return (_a2 = $theme().weekdays) == null ? void 0 : _a2[get$1(item1).getUTCDay()];
                        },
                        () => datesEqual(get$1(item1), $_today()) ? " " + $theme().today : "",
                        () => toISOString(get$1(item1), 10),
                        () => $_intlDayHeaderAL().format(get$1(item1))
                      ]
                    );
                    append($$anchor6, div_6);
                  };
                  if_block(node_5, ($$render) => {
                    if ($datesAboveResources()) $$render(consequent_1);
                    else $$render(alternate_1, false);
                  });
                }
                append($$anchor5, fragment_2);
              });
              template_effect(() => set_class(div_4, 1, $theme().days));
              append($$anchor4, div_4);
            };
            if_block(node_4, ($$render) => {
              if (get$1(loops)[1].length > 1) $$render(consequent_2);
            });
          }
          template_effect(() => set_class(div_1, 1, $theme().resource));
          append($$anchor3, div_1);
        });
        append($$anchor2, fragment_1);
      },
      $$slots: { default: true }
    });
    var div_7 = sibling(node, 2);
    var node_7 = sibling(div, 2);
    {
      var consequent_4 = ($$anchor2) => {
        var div_8 = root_9();
        var div_9 = child(div_8);
        var node_8 = child(div_9);
        Section(node_8, {
          children: ($$anchor3, $$slotProps) => {
            var fragment_3 = comment();
            var node_9 = first_child(fragment_3);
            {
              var consequent_3 = ($$anchor4) => {
                var fragment_4 = comment();
                var node_10 = first_child(fragment_4);
                each(node_10, 1, $_viewDates, index, ($$anchor5, date) => {
                  var div_10 = root_12();
                  each(div_10, 5, $_viewResources, index, ($$anchor6, resource) => {
                    {
                      let $0 = /* @__PURE__ */ user_derived(() => [get$1(date)]);
                      Week($$anchor6, {
                        get dates() {
                          return get$1($0);
                        },
                        get resource() {
                          return get$1(resource);
                        }
                      });
                    }
                  });
                  template_effect(() => set_class(div_10, 1, $theme().resource));
                  append($$anchor5, div_10);
                });
                append($$anchor4, fragment_4);
              };
              var alternate_2 = ($$anchor4) => {
                var fragment_6 = comment();
                var node_11 = first_child(fragment_6);
                each(node_11, 1, $_viewResources, index, ($$anchor5, resource) => {
                  var div_11 = root_15();
                  var node_12 = child(div_11);
                  Week(node_12, {
                    get dates() {
                      return $_viewDates();
                    },
                    get resource() {
                      return get$1(resource);
                    }
                  });
                  template_effect(() => set_class(div_11, 1, $theme().resource));
                  append($$anchor5, div_11);
                });
                append($$anchor4, fragment_6);
              };
              if_block(node_9, ($$render) => {
                if ($datesAboveResources()) $$render(consequent_3);
                else $$render(alternate_2, false);
              });
            }
            append($$anchor3, fragment_3);
          },
          $$slots: { default: true }
        });
        var div_12 = sibling(node_8, 2);
        template_effect(() => {
          set_class(div_8, 1, $theme().allDay);
          set_class(div_9, 1, $theme().content);
          set_class(div_12, 1, $theme().hiddenScroll);
        });
        append($$anchor2, div_8);
      };
      if_block(node_7, ($$render) => {
        if ($allDaySlot()) $$render(consequent_4);
      });
    }
    var node_13 = sibling(node_7, 2);
    Body$1(node_13, {
      children: ($$anchor2, $$slotProps) => {
        var fragment_7 = comment();
        var node_14 = first_child(fragment_7);
        each(node_14, 17, () => get$1(loops)[0], index, ($$anchor3, item0) => {
          var div_13 = root_17();
          each(div_13, 21, () => get$1(loops)[1], index, ($$anchor4, item1) => {
            {
              let $0 = /* @__PURE__ */ user_derived(() => $datesAboveResources() ? get$1(item0) : get$1(item1));
              let $1 = /* @__PURE__ */ user_derived(() => $datesAboveResources() ? get$1(item1) : get$1(item0));
              Day$2($$anchor4, {
                get date() {
                  return get$1($0);
                },
                get resource() {
                  return get$1($1);
                }
              });
            }
          });
          template_effect(() => set_class(div_13, 1, $theme().resource));
          append($$anchor3, div_13);
        });
        append($$anchor2, fragment_7);
      },
      $$slots: { default: true }
    });
    template_effect(() => {
      set_class(div, 1, $theme().header);
      set_class(div_7, 1, $theme().hiddenScroll);
    });
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  const ResourceTimeGrid = {
    createOptions(options) {
      options.datesAboveResources = false;
      options.buttonText.resourceTimeGridDay = "resources";
      options.buttonText.resourceTimeGridWeek = "resources";
      options.view = "resourceTimeGridWeek";
      options.views.resourceTimeGridDay = {
        buttonText: btnTextDay,
        component: View$1,
        duration: { days: 1 },
        theme: themeView("ec-time-grid ec-resource-day-view")
      };
      options.views.resourceTimeGridWeek = {
        buttonText: btnTextWeek,
        component: View$1,
        duration: { weeks: 1 },
        theme: themeView("ec-time-grid ec-resource-week-view")
      };
    },
    createStores(state2) {
      if (!("_times" in state2)) {
        TimeGrid.createStores(state2);
      }
      if (!("_viewResources" in state2)) {
        state2._viewResources = viewResources(state2);
      }
    }
  };
  function dayTimeLimits(state2) {
    return derived(
      [state2.slotMinTime, state2.slotMaxTime, state2.flexibleSlotTimeLimits, state2._viewDates, state2._filteredEvents],
      ([$slotMinTime, $slotMaxTime, $flexibleSlotTimeLimits, $_viewDates, $_filteredEvents]) => {
        let dayTimeLimits2 = {};
        for (let date of $_viewDates) {
          dayTimeLimits2[date.getTime()] = createSlotTimeLimits(
            $slotMinTime,
            $slotMaxTime,
            $flexibleSlotTimeLimits,
            [date],
            $_filteredEvents
          );
        }
        return dayTimeLimits2;
      }
    );
  }
  function dayTimes(state2) {
    return derived(
      [state2._viewDates, state2.slotDuration, state2.slotLabelInterval, state2._dayTimeLimits, state2._intlSlotLabel],
      ([$_viewDates, $slotDuration, $slotLabelInterval, $_dayTimeLimits, $_intlSlotLabel]) => {
        let dayTimes2 = {};
        for (let date of $_viewDates) {
          let time = date.getTime();
          dayTimes2[time] = time in $_dayTimeLimits ? createTimes(date, $slotDuration, $slotLabelInterval, $_dayTimeLimits[time], $_intlSlotLabel) : [];
        }
        return dayTimes2;
      }
    );
  }
  function nestedResources(state2) {
    return derived(state2.resources, ($resources) => $resources.some((resource) => getPayload(resource).children.length));
  }
  var root$7 = /* @__PURE__ */ from_html(`<span></span>`);
  function Label($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $resourceLabelContent = () => store_get(resourceLabelContent, "$resourceLabelContent", $$stores);
    const $resourceLabelDidMount = () => store_get(resourceLabelDidMount, "$resourceLabelDidMount", $$stores);
    let date = prop($$props, "date", 3, void 0);
    let { resourceLabelContent, resourceLabelDidMount } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let content = /* @__PURE__ */ user_derived(() => {
      if ($resourceLabelContent()) {
        return isFunction($resourceLabelContent()) ? $resourceLabelContent()({
          resource: $$props.resource,
          date: date() ? toLocalDate(date()) : void 0
        }) : $resourceLabelContent();
      } else {
        return $$props.resource.title;
      }
    });
    onMount(() => {
      if (isFunction($resourceLabelDidMount())) {
        $resourceLabelDidMount()({
          resource: $$props.resource,
          date: date() ? toLocalDate(date()) : void 0,
          el: get$1(el)
        });
      }
    });
    var span = root$7();
    bind_this(span, ($$value) => set(el, $$value), () => get$1(el));
    action(span, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(content));
    append($$anchor, span);
    pop();
    $$cleanup();
  }
  function onclick(_, expanded, payload, toggle, resources) {
    set(expanded, !get$1(expanded));
    get$1(payload).expanded = get$1(expanded);
    toggle(get$1(payload).children, get$1(expanded));
    resources.update(identity);
  }
  var root_1$4 = /* @__PURE__ */ from_html(`<span></span>`);
  var root_2$2 = /* @__PURE__ */ from_html(`<button><!></button>`);
  var root$6 = /* @__PURE__ */ from_html(`<!> <span><!></span>`, 1);
  function Expander($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $theme = () => store_get(theme, "$theme", $$stores);
    let { resources, theme } = getContext("state");
    let payload = /* @__PURE__ */ state({});
    let expanded = /* @__PURE__ */ state(true);
    user_pre_effect(() => {
      set(payload, getPayload($$props.resource));
      set(expanded, get$1(payload).expanded, true);
    });
    function toggle(children, expand) {
      for (let child2 of children) {
        let payload2 = getPayload(child2);
        payload2.hidden = !expand;
        if (payload2.expanded) {
          toggle(payload2.children, expand);
        }
      }
    }
    var fragment = root$6();
    var node = first_child(fragment);
    each(node, 17, () => Array(get$1(payload).level), index, ($$anchor2, level) => {
      var span = root_1$4();
      template_effect(() => set_class(span, 1, $theme().expander));
      append($$anchor2, span);
    });
    var span_1 = sibling(node, 2);
    var node_1 = child(span_1);
    {
      var consequent_1 = ($$anchor2) => {
        var button = root_2$2();
        button.__click = [onclick, expanded, payload, toggle, resources];
        var node_2 = child(button);
        {
          var consequent = ($$anchor3) => {
            var text$1 = text("−");
            append($$anchor3, text$1);
          };
          var alternate = ($$anchor3) => {
            var text_1 = text("+");
            append($$anchor3, text_1);
          };
          if_block(node_2, ($$render) => {
            if (get$1(expanded)) $$render(consequent);
            else $$render(alternate, false);
          });
        }
        template_effect(() => set_class(button, 1, $theme().button));
        append($$anchor2, button);
      };
      if_block(node_1, ($$render) => {
        var _a2;
        if ((_a2 = get$1(payload).children) == null ? void 0 : _a2.length) $$render(consequent_1);
      });
    }
    template_effect(() => set_class(span_1, 1, $theme().expander));
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  delegate(["click"]);
  var root_1$3 = /* @__PURE__ */ from_html(`<div role="rowheader"><!> <!></div>`);
  var root$5 = /* @__PURE__ */ from_html(`<div><div></div> <div></div></div>`);
  function Sidebar($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_headerHeight = () => store_get(_headerHeight, "$_headerHeight", $$stores);
    const $_sidebarEl = () => store_get(_sidebarEl, "$_sidebarEl", $$stores);
    const $_viewResources = () => store_get(_viewResources, "$_viewResources", $$stores);
    const $_resHs = () => store_get(_resHs, "$_resHs", $$stores);
    const $_nestedResources = () => store_get(_nestedResources, "$_nestedResources", $$stores);
    let {
      _viewResources,
      _headerHeight,
      _bodyEl,
      _resHs,
      _sidebarEl,
      _nestedResources,
      theme
    } = getContext("state");
    function onwheel(jsEvent) {
      $_bodyEl().scrollBy({ top: jsEvent.deltaY < 0 ? -30 : 30 });
    }
    init();
    var div = root$5();
    var div_1 = child(div);
    var div_2 = sibling(div_1, 2);
    each(div_2, 5, $_viewResources, index, ($$anchor2, resource) => {
      var div_3 = root_1$3();
      var node = child(div_3);
      {
        var consequent = ($$anchor3) => {
          Expander($$anchor3, {
            get resource() {
              return get$1(resource);
            }
          });
        };
        if_block(node, ($$render) => {
          if ($_nestedResources()) $$render(consequent);
        });
      }
      var node_1 = sibling(node, 2);
      Label(node_1, {
        get resource() {
          return get$1(resource);
        }
      });
      template_effect(
        ($0) => {
          set_class(div_3, 1, $theme().resource);
          set_style(div_3, `flex-basis: ${$0 != null ? $0 : ""}px`);
        },
        [() => {
          var _a2;
          return max((_a2 = $_resHs().get(get$1(resource))) != null ? _a2 : 0, 34);
        }]
      );
      append($$anchor2, div_3);
    });
    bind_this(div_2, ($$value) => store_set(_sidebarEl, $$value), () => $_sidebarEl());
    template_effect(() => {
      var _a2;
      set_class(div, 1, $theme().sidebar);
      set_class(div_1, 1, $theme().sidebarTitle);
      set_style(div_1, `flex-basis: ${(_a2 = $_headerHeight()) != null ? _a2 : ""}px`);
      set_class(div_2, 1, $theme().content);
    });
    event("wheel", div_2, onwheel);
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  var root_3 = /* @__PURE__ */ from_html(`<div role="columnheader"><time></time></div>`);
  var root_2$1 = /* @__PURE__ */ from_html(`<div><time></time></div> <div></div>`, 1);
  var root_4 = /* @__PURE__ */ from_html(`<div role="columnheader"><time></time></div>`);
  var root_1$2 = /* @__PURE__ */ from_html(`<div><!></div>`);
  var root$4 = /* @__PURE__ */ from_html(`<div><div role="row"></div> <div></div></div>`);
  function Header($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_headerEl = () => store_get(_headerEl, "$_headerEl", $$stores);
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $_intlDayHeaderAL = () => store_get(_intlDayHeaderAL, "$_intlDayHeaderAL", $$stores);
    const $_intlDayHeader = () => store_get(_intlDayHeader, "$_intlDayHeader", $$stores);
    const $_dayTimes = () => store_get(_dayTimes, "$_dayTimes", $$stores);
    let {
      _headerEl,
      _headerHeight,
      _intlDayHeader,
      _intlDayHeaderAL,
      _dayTimes,
      _today,
      _viewDates,
      slotDuration,
      theme
    } = getContext("state");
    init();
    var div = root$4();
    var div_1 = child(div);
    each(div_1, 5, $_viewDates, index, ($$anchor2, date) => {
      var div_2 = root_1$2();
      var node = child(div_2);
      {
        var consequent = ($$anchor3) => {
          var fragment = root_2$1();
          var div_3 = first_child(fragment);
          var time_1 = child(div_3);
          action(time_1, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayHeader().format(get$1(date)));
          var div_4 = sibling(div_3, 2);
          each(div_4, 5, () => $_dayTimes()[get$1(date).getTime()], index, ($$anchor4, time) => {
            var div_5 = root_3();
            var time_2 = child(div_5);
            action(time_2, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => get$1(time)[1]);
            template_effect(() => {
              var _a2;
              set_class(div_5, 1, `${(_a2 = $theme().time) != null ? _a2 : ""}${get$1(time)[2] ? "" : " " + $theme().minor}`);
              set_attribute(time_2, "datetime", get$1(time)[0]);
            });
            append($$anchor4, div_5);
          });
          template_effect(
            ($0, $1) => {
              set_class(div_3, 1, $theme().dayHead);
              set_attribute(time_1, "datetime", $0);
              set_attribute(time_1, "aria-label", $1);
              set_class(div_4, 1, $theme().times);
            },
            [
              () => toISOString(get$1(date), 10),
              () => $_intlDayHeaderAL().format(get$1(date))
            ]
          );
          append($$anchor3, fragment);
        };
        var alternate = ($$anchor3) => {
          var div_6 = root_4();
          var time_3 = child(div_6);
          action(time_3, ($$node, $$action_arg) => setContent == null ? void 0 : setContent($$node, $$action_arg), () => $_intlDayHeader().format(get$1(date)));
          template_effect(
            ($0, $1) => {
              set_class(div_6, 1, $theme().time);
              set_attribute(time_3, "datetime", $0);
              set_attribute(time_3, "aria-label", $1);
            },
            [
              () => toISOString(get$1(date), 10),
              () => $_intlDayHeaderAL().format(get$1(date))
            ]
          );
          append($$anchor3, div_6);
        };
        if_block(node, ($$render) => {
          if (toSeconds($slotDuration())) $$render(consequent);
          else $$render(alternate, false);
        });
      }
      template_effect(($0, $1) => {
        var _a2;
        return set_class(div_2, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${$1 != null ? $1 : ""}`);
      }, [
        () => {
          var _a2;
          return (_a2 = $theme().weekdays) == null ? void 0 : _a2[get$1(date).getUTCDay()];
        },
        () => datesEqual(get$1(date), $_today()) ? " " + $theme().today : ""
      ]);
      append($$anchor2, div_2);
    });
    var div_7 = sibling(div_1, 2);
    bind_this(div, ($$value) => store_set(_headerEl, $$value), () => $_headerEl());
    action(div, ($$node, $$action_arg) => observeResize == null ? void 0 : observeResize($$node, $$action_arg), () => () => store_set(_headerHeight, $_headerEl().clientHeight));
    template_effect(() => {
      set_class(div, 1, $theme().header);
      set_class(div_1, 1, $theme().days);
      set_class(div_7, 1, $theme().hiddenScroll);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  function prepareEventChunks(chunks, $_viewDates, $_dayTimeLimits, $slotDuration) {
    let longChunks = {};
    let filteredChunks = [];
    if (chunks.length) {
      sortEventChunks(chunks);
      let step = toSeconds($slotDuration);
      let prevChunk;
      for (let chunk of chunks) {
        let prevDayEnd;
        if (step) {
          let slots = 0;
          for (let i = 0; i < $_viewDates.length; ++i) {
            let slotTimeLimits2 = getSlotTimeLimits($_dayTimeLimits, $_viewDates[i]);
            let dayStart = addDuration(cloneDate($_viewDates[i]), slotTimeLimits2.min);
            let dayEnd = addDuration(cloneDate($_viewDates[i]), slotTimeLimits2.max);
            if (!chunk.date) {
              if (chunk.start < dayEnd && chunk.end > dayStart) {
                chunk.date = $_viewDates[i];
                if (chunk.start < dayStart) {
                  chunk.start = dayStart;
                }
                chunk.offset = (chunk.start - dayStart) / 1e3 / step;
                if (chunk.end > dayEnd) {
                  slots += dayEnd - chunk.start;
                } else {
                  slots += chunk.end - chunk.start || step * 1e3;
                  break;
                }
              }
            } else {
              if (chunk.end <= dayStart) {
                chunk.end = prevDayEnd;
                break;
              }
              let key = $_viewDates[i].getTime();
              if (longChunks[key]) {
                longChunks[key].push(chunk);
              } else {
                longChunks[key] = [chunk];
              }
              if (chunk.end > dayEnd) {
                slots += dayEnd - dayStart;
              } else {
                slots += chunk.end - dayStart;
                break;
              }
            }
            prevDayEnd = dayEnd;
          }
          chunk.slots = slots / 1e3 / step;
        } else {
          let days2 = 0;
          for (let i = 0; i < $_viewDates.length; ++i) {
            let dayStart = $_viewDates[i];
            let dayEnd = addDay(cloneDate(dayStart));
            if (!chunk.date) {
              if (chunk.start < dayEnd) {
                chunk.date = dayStart;
                if (chunk.start < dayStart) {
                  chunk.start = dayStart;
                }
                ++days2;
              }
            } else {
              if (chunk.end <= dayStart) {
                chunk.end = prevDayEnd;
                break;
              }
              let key = dayStart.getTime();
              if (longChunks[key]) {
                longChunks[key].push(chunk);
              } else {
                longChunks[key] = [chunk];
              }
              ++days2;
            }
            prevDayEnd = dayEnd;
          }
          chunk.days = days2;
        }
        if (!chunk.date) {
          continue;
        }
        if (prevChunk && datesEqual(prevChunk.date, chunk.date)) {
          chunk.prev = prevChunk;
        }
        prevChunk = chunk;
        filteredChunks.push(chunk);
      }
    }
    return [filteredChunks, longChunks];
  }
  function repositionEvent(chunk, dayChunks, longChunks, height2, allDay) {
    var _a2;
    chunk.top = 0;
    chunk.bottom = height2;
    let margin = 1;
    let key = chunk.date.getTime();
    longChunks = (_a2 = longChunks == null ? void 0 : longChunks[key]) != null ? _a2 : [];
    let chunks = [...dayChunks, ...longChunks];
    chunks.sort((a, b) => {
      var _a3, _b2;
      return ((_a3 = a.top) != null ? _a3 : 0) - ((_b2 = b.top) != null ? _b2 : 0) || a.start - b.start || b.event.allDay - a.event.allDay;
    });
    for (let dayChunk of chunks) {
      if (dayChunk === chunk) {
        continue;
      }
      if ((allDay || chunk.start < dayChunk.end && chunk.end > dayChunk.start) && chunk.top < dayChunk.bottom && chunk.bottom > dayChunk.top) {
        let offset = dayChunk.bottom - chunk.top + 1;
        margin += offset;
        chunk.top += offset;
        chunk.bottom += offset;
      }
    }
    return margin;
  }
  function getSlotTimeLimits($_dayTimeLimits, date) {
    var _a2;
    return (_a2 = $_dayTimeLimits[date.getTime()]) != null ? _a2 : { min: createDuration(0), max: createDuration(0) };
  }
  function Event($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $slotWidth = () => store_get(slotWidth, "$slotWidth", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    let dayChunks = prop($$props, "dayChunks", 19, () => []), longChunks = prop($$props, "longChunks", 19, () => ({})), resource = prop($$props, "resource", 3, void 0);
    let { slotDuration, slotWidth } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let margin = /* @__PURE__ */ state(proxy(helperEvent($$props.chunk.event.display) ? 1 : 0));
    let event2 = /* @__PURE__ */ user_derived(() => $$props.chunk.event);
    let width = /* @__PURE__ */ user_derived(() => "slots" in $$props.chunk ? $$props.chunk.slots * $slotWidth() : $$props.chunk.days * 100);
    let styles = /* @__PURE__ */ user_derived(() => (style) => {
      if ("slots" in $$props.chunk) {
        let left = $$props.chunk.offset * $slotWidth();
        style["left"] = `${left}px`;
        style["width"] = `${get$1(width)}px`;
      } else {
        style["width"] = `${get$1(width)}%`;
      }
      let marginTop = get$1(margin);
      if (get$1(event2)._margin) {
        let [_margin, _resource] = get$1(event2)._margin;
        if (resource() === _resource) {
          marginTop = _margin;
        }
      }
      style["margin-top"] = `${marginTop}px`;
      return style;
    });
    function reposition() {
      if (!get$1(el)) {
        return 0;
      }
      let h = height(get$1(el));
      set(margin, repositionEvent($$props.chunk, dayChunks(), longChunks(), h, !toSeconds($slotDuration())), true);
      return get$1(margin) + h;
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        InteractableEvent($$anchor2, {
          get chunk() {
            return $$props.chunk;
          },
          get styles() {
            return get$1(styles);
          },
          axis: "x",
          forceMargin: () => [get$1(margin), resource()],
          get el() {
            return get$1(el);
          },
          set el($$value) {
            set(el, $$value, true);
          }
        });
      };
      if_block(node, ($$render) => {
        if (get$1(width) > 0) $$render(consequent);
      });
    }
    append($$anchor, fragment);
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  var root_1$1 = /* @__PURE__ */ from_html(`<!> <!> <!> <!>`, 1);
  var root$3 = /* @__PURE__ */ from_html(`<div role="cell"><div><!></div></div>`);
  function Day($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $highlightedDates = () => store_get(highlightedDates, "$highlightedDates", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $_dayTimeLimits = () => store_get(_dayTimeLimits, "$_dayTimeLimits", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $slotWidth = () => store_get(slotWidth, "$slotWidth", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_interaction = () => store_get(_interaction, "$_interaction", $$stores);
    let iChunks = prop($$props, "iChunks", 19, () => []);
    let {
      highlightedDates,
      slotDuration,
      slotWidth,
      theme,
      validRange,
      _interaction,
      _today,
      _dayTimeLimits
    } = getContext("state");
    let el = /* @__PURE__ */ state(void 0);
    let refs = [];
    let isToday = /* @__PURE__ */ user_derived(() => datesEqual($$props.date, $_today()));
    let highlight = /* @__PURE__ */ user_derived(() => $highlightedDates().some((d) => datesEqual(d, $$props.date)));
    let disabled = /* @__PURE__ */ user_derived(() => outsideRange($$props.date, $validRange()));
    let slotTimeLimits2 = /* @__PURE__ */ user_derived(() => getSlotTimeLimits($_dayTimeLimits(), $$props.date));
    let allDay = /* @__PURE__ */ user_derived(() => !toSeconds($slotDuration()));
    let pointerIdx = /* @__PURE__ */ user_derived(() => get$1(allDay) ? 2 : 1);
    let dayChunks = /* @__PURE__ */ user_derived(() => $$props.chunks.filter(chunkIntersects));
    let dayBgChunks = /* @__PURE__ */ user_derived(() => $$props.bgChunks.filter((bgChunk) => (!get$1(allDay) || bgChunk.event.allDay) && chunkIntersects(bgChunk)));
    function chunkIntersects(chunk) {
      return datesEqual(chunk.date, $$props.date);
    }
    function dateFromPoint(x, y) {
      x -= rect(get$1(el)).left;
      return {
        allDay: get$1(allDay),
        date: get$1(allDay) ? cloneDate($$props.date) : addDuration(addDuration(cloneDate($$props.date), get$1(slotTimeLimits2).min), $slotDuration(), floor(x / $slotWidth())),
        resource: $$props.resource,
        dayEl: get$1(el),
        disabled: get$1(disabled)
      };
    }
    user_effect(() => {
      setPayload(get$1(el), dateFromPoint);
    });
    function reposition() {
      return max(...runReposition(refs, get$1(dayChunks)));
    }
    var div = root$3();
    div.__pointerdown = function(...$$args) {
      var _a2, _b2;
      (_b2 = (_a2 = $_interaction().action) == null ? void 0 : _a2.select) == null ? void 0 : _b2.apply(this, $$args);
    };
    var div_1 = child(div);
    var node = child(div_1);
    {
      var consequent_2 = ($$anchor2) => {
        var fragment = root_1$1();
        var node_1 = first_child(fragment);
        each(node_1, 17, () => get$1(dayBgChunks), (chunk) => chunk.event, ($$anchor3, chunk) => {
          Event($$anchor3, {
            get chunk() {
              return get$1(chunk);
            }
          });
        });
        var node_2 = sibling(node_1, 2);
        {
          var consequent = ($$anchor3) => {
            Event($$anchor3, {
              get chunk() {
                return iChunks()[get$1(pointerIdx)];
              }
            });
          };
          if_block(node_2, ($$render) => {
            if (iChunks()[get$1(pointerIdx)] && chunkIntersects(iChunks()[get$1(pointerIdx)])) $$render(consequent);
          });
        }
        var node_3 = sibling(node_2, 2);
        each(node_3, 19, () => get$1(dayChunks), (chunk) => chunk.event, ($$anchor3, chunk, i) => {
          bind_this(
            Event($$anchor3, {
              get chunk() {
                return get$1(chunk);
              },
              get dayChunks() {
                return get$1(dayChunks);
              },
              get longChunks() {
                return $$props.longChunks;
              },
              get resource() {
                return $$props.resource;
              }
            }),
            ($$value, i2) => refs[i2] = $$value,
            (i2) => refs == null ? void 0 : refs[i2],
            () => [get$1(i)]
          );
        });
        var node_4 = sibling(node_3, 2);
        {
          var consequent_1 = ($$anchor3) => {
            Event($$anchor3, {
              get chunk() {
                return iChunks()[0];
              },
              get resource() {
                return $$props.resource;
              }
            });
          };
          if_block(node_4, ($$render) => {
            if (iChunks()[0] && chunkIntersects(iChunks()[0])) $$render(consequent_1);
          });
        }
        append($$anchor2, fragment);
      };
      if_block(node, ($$render) => {
        if (!get$1(disabled)) $$render(consequent_2);
      });
    }
    bind_this(div, ($$value) => set(el, $$value), () => get$1(el));
    template_effect(
      ($0, $1) => {
        var _a2;
        set_class(div, 1, `${(_a2 = $theme().day) != null ? _a2 : ""} ${$0 != null ? $0 : ""}${get$1(isToday) ? " " + $theme().today : ""}${get$1(highlight) ? " " + $theme().highlight : ""}${get$1(disabled) ? " " + $theme().disabled : ""}`);
        set_style(div, `flex-grow: ${$1 != null ? $1 : ""}`);
        set_class(div_1, 1, $theme().events);
      },
      [
        () => {
          var _a2;
          return (_a2 = $theme().weekdays) == null ? void 0 : _a2[$$props.date.getUTCDay()];
        },
        () => get$1(allDay) ? null : ceil((toSeconds(get$1(slotTimeLimits2).max) - toSeconds(get$1(slotTimeLimits2).min)) / toSeconds($slotDuration()))
      ]
    );
    append($$anchor, div);
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  delegate(["pointerdown"]);
  var root$2 = /* @__PURE__ */ from_html(`<div role="row"></div>`);
  function Days($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $validRange = () => store_get(validRange, "$validRange", $$stores);
    const $_dayTimeLimits = () => store_get(_dayTimeLimits, "$_dayTimeLimits", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $_iEvents = () => store_get(_iEvents, "$_iEvents", $$stores);
    const $_resHs = () => store_get(_resHs, "$_resHs", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    let {
      _viewDates,
      _filteredEvents,
      _iEvents,
      _resHs,
      _dayTimeLimits,
      slotDuration,
      theme,
      validRange
    } = getContext("state");
    let refs = [];
    let height2 = /* @__PURE__ */ state(0);
    let $$d = /* @__PURE__ */ user_derived(() => {
      let start2 = cloneDate(limitToRange($_viewDates()[0], $validRange()));
      let end2 = cloneDate(limitToRange($_viewDates().at(-1), $validRange()));
      let slotTimeLimits2 = getSlotTimeLimits($_dayTimeLimits(), start2);
      addDuration(start2, slotTimeLimits2.min);
      slotTimeLimits2 = getSlotTimeLimits($_dayTimeLimits(), end2);
      if (slotTimeLimits2.max.seconds > DAY_IN_SECONDS) {
        addDuration(end2, slotTimeLimits2.max);
      } else {
        addDay(end2);
      }
      return [start2, end2];
    }), $$array = /* @__PURE__ */ user_derived(() => to_array(get$1($$d), 2)), start = /* @__PURE__ */ user_derived(() => get$1($$array)[0]), end = /* @__PURE__ */ user_derived(() => get$1($$array)[1]);
    let $$d_1 = /* @__PURE__ */ user_derived(() => {
      let chunks2 = [];
      let bgChunks2 = [];
      let longChunks2;
      for (let event2 of $_filteredEvents()) {
        if (eventIntersects(event2, get$1(start), get$1(end), $$props.resource)) {
          let chunk = createEventChunk(event2, get$1(start), get$1(end));
          if (bgEvent(event2.display)) {
            bgChunks2.push(chunk);
          } else {
            chunks2.push(chunk);
          }
        }
      }
      [bgChunks2] = prepareEventChunks(bgChunks2, $_viewDates(), $_dayTimeLimits(), $slotDuration());
      [chunks2, longChunks2] = prepareEventChunks(chunks2, $_viewDates(), $_dayTimeLimits(), $slotDuration());
      return [chunks2, bgChunks2, longChunks2];
    }), $$array_3 = /* @__PURE__ */ user_derived(() => to_array(get$1($$d_1), 3)), chunks = /* @__PURE__ */ user_derived(() => get$1($$array_3)[0]), bgChunks = /* @__PURE__ */ user_derived(() => get$1($$array_3)[1]), longChunks = /* @__PURE__ */ user_derived(() => get$1($$array_3)[2]);
    let iChunks = /* @__PURE__ */ user_derived(() => $_iEvents().map((event2) => {
      let chunk;
      if (event2 && eventIntersects(event2, get$1(start), get$1(end), $$props.resource)) {
        chunk = createEventChunk(event2, get$1(start), get$1(end));
        [[chunk]] = prepareEventChunks([chunk], $_viewDates(), $_dayTimeLimits(), $slotDuration());
      } else {
        chunk = null;
      }
      return chunk;
    }));
    function reposition() {
      set(height2, ceil(max(...runReposition(refs, $_viewDates()))) + 10);
      $_resHs().set($$props.resource, get$1(height2));
      store_set(_resHs, $_resHs());
    }
    var div = root$2();
    each(div, 5, $_viewDates, index, ($$anchor2, date, i) => {
      bind_this(
        Day($$anchor2, {
          get date() {
            return get$1(date);
          },
          get resource() {
            return $$props.resource;
          },
          get chunks() {
            return get$1(chunks);
          },
          get bgChunks() {
            return get$1(bgChunks);
          },
          get longChunks() {
            return get$1(longChunks);
          },
          get iChunks() {
            return get$1(iChunks);
          }
        }),
        ($$value, i2) => refs[i2] = $$value,
        (i2) => refs == null ? void 0 : refs[i2],
        () => [i]
      );
    });
    template_effect(
      ($0) => {
        set_class(div, 1, $theme().days);
        set_style(div, `flex-basis: ${$0 != null ? $0 : ""}px`);
      },
      [() => max(get$1(height2), 34)]
    );
    append($$anchor, div);
    var $$pop = pop({ reposition });
    $$cleanup();
    return $$pop;
  }
  var root_2 = /* @__PURE__ */ from_html(`<div></div>`);
  var root$1 = /* @__PURE__ */ from_html(`<div><div><div></div> <!></div></div>`);
  function Body($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_dayTimeLimits = () => store_get(_dayTimeLimits, "$_dayTimeLimits", $$stores);
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $_bodyEl = () => store_get(_bodyEl, "$_bodyEl", $$stores);
    const $scrollTime = () => store_get(scrollTime, "$scrollTime", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $slotWidth = () => store_get(slotWidth, "$slotWidth", $$stores);
    const $_resHs = () => store_get(_resHs, "$_resHs", $$stores);
    const $_viewResources = () => store_get(_viewResources, "$_viewResources", $$stores);
    const $_filteredEvents = () => store_get(_filteredEvents, "$_filteredEvents", $$stores);
    const $_headerEl = () => store_get(_headerEl, "$_headerEl", $$stores);
    const $_sidebarEl = () => store_get(_sidebarEl, "$_sidebarEl", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_dayTimes = () => store_get(_dayTimes, "$_dayTimes", $$stores);
    let {
      _bodyEl,
      _bodyHeight,
      _bodyWidth,
      _bodyScrollLeft,
      _headerEl,
      _filteredEvents,
      _sidebarEl,
      _dayTimes,
      _dayTimeLimits,
      _recheckScrollable,
      _resHs,
      _viewResources,
      _viewDates,
      scrollTime,
      slotDuration,
      slotWidth,
      theme
    } = getContext("state");
    let refs = [];
    function scrollToTime() {
      let slotTimeLimits2 = getSlotTimeLimits($_dayTimeLimits(), $_viewDates()[0]);
      store_mutate(_bodyEl, untrack($_bodyEl).scrollLeft = (toSeconds($scrollTime()) - toSeconds(slotTimeLimits2.min)) / toSeconds($slotDuration()) * $slotWidth(), untrack($_bodyEl));
      store_set(_bodyScrollLeft, $_bodyEl().scrollLeft);
    }
    user_effect(() => {
      $_viewDates();
      $scrollTime();
      untrack(scrollToTime);
    });
    function reposition() {
      $_resHs().clear();
      runReposition(refs, $_viewResources());
    }
    user_effect(() => {
      $_filteredEvents();
      $_viewResources();
      untrack(reposition);
    });
    function onscroll() {
      store_mutate(_headerEl, untrack($_headerEl).scrollLeft = $_bodyEl().scrollLeft, untrack($_headerEl));
      store_mutate(_sidebarEl, untrack($_sidebarEl).scrollTop = $_bodyEl().scrollTop, untrack($_sidebarEl));
      store_set(_bodyScrollLeft, $_bodyEl().scrollLeft);
    }
    function onresize() {
      store_set(_bodyHeight, $_bodyEl().clientHeight);
      store_set(_bodyWidth, $_bodyEl().clientWidth);
      store_set(_recheckScrollable, true);
    }
    var div = root$1();
    event("resize", $window, reposition);
    var div_1 = child(div);
    var div_2 = child(div_1);
    each(div_2, 5, $_viewDates, index, ($$anchor2, date) => {
      var fragment = comment();
      var node = first_child(fragment);
      each(node, 1, () => $_dayTimes()[get$1(date).getTime()], index, ($$anchor3, time) => {
        var div_3 = root_2();
        template_effect(() => {
          var _a2;
          return set_class(div_3, 1, `${(_a2 = $theme().line) != null ? _a2 : ""}${get$1(time)[2] ? "" : " " + $theme().minor}`);
        });
        append($$anchor3, div_3);
      });
      append($$anchor2, fragment);
    });
    var node_1 = sibling(div_2, 2);
    each(node_1, 1, $_viewResources, index, ($$anchor2, resource, i) => {
      bind_this(
        Days($$anchor2, {
          get resource() {
            return get$1(resource);
          }
        }),
        ($$value, i2) => refs[i2] = $$value,
        (i2) => refs == null ? void 0 : refs[i2],
        () => [i]
      );
    });
    bind_this(div, ($$value) => store_set(_bodyEl, $$value), () => $_bodyEl());
    action(div, ($$node, $$action_arg) => observeResize == null ? void 0 : observeResize($$node, $$action_arg), () => onresize);
    template_effect(() => {
      set_class(div, 1, $theme().body);
      set_class(div_1, 1, $theme().content);
      set_class(div_2, 1, $theme().lines);
    });
    event("scroll", div, onscroll);
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  var root_1 = /* @__PURE__ */ from_html(`<div></div>`);
  function NowIndicator($$anchor, $$props) {
    push($$props, true);
    const [$$stores, $$cleanup] = setup_stores();
    const $_viewDates = () => store_get(_viewDates, "$_viewDates", $$stores);
    const $_dayTimeLimits = () => store_get(_dayTimeLimits, "$_dayTimeLimits", $$stores);
    const $_today = () => store_get(_today, "$_today", $$stores);
    const $_now = () => store_get(_now, "$_now", $$stores);
    const $slotDuration = () => store_get(slotDuration, "$slotDuration", $$stores);
    const $slotWidth = () => store_get(slotWidth, "$slotWidth", $$stores);
    const $_bodyScrollLeft = () => store_get(_bodyScrollLeft, "$_bodyScrollLeft", $$stores);
    const $_bodyWidth = () => store_get(_bodyWidth, "$_bodyWidth", $$stores);
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $_headerHeight = () => store_get(_headerHeight, "$_headerHeight", $$stores);
    const $_bodyHeight = () => store_get(_bodyHeight, "$_bodyHeight", $$stores);
    let {
      slotDuration,
      slotWidth,
      theme,
      _bodyHeight,
      _bodyWidth,
      _bodyScrollLeft,
      _headerHeight,
      _dayTimeLimits,
      _now,
      _today,
      _viewDates
    } = getContext("state");
    let left = /* @__PURE__ */ user_derived(() => {
      let offset = 0;
      for (let i = 0; i < $_viewDates().length; ++i) {
        let slotTimeLimits2 = getSlotTimeLimits($_dayTimeLimits(), $_viewDates()[i]);
        if (datesEqual($_viewDates()[i], $_today())) {
          let dayStart = addDuration(cloneDate($_viewDates()[i]), slotTimeLimits2.min);
          let dayEnd = addDuration(cloneDate($_viewDates()[i]), slotTimeLimits2.max);
          if ($_now() >= dayStart && $_now() <= dayEnd) {
            offset += ($_now() - dayStart) / 1e3;
            break;
          } else {
            return null;
          }
        } else {
          offset += slotTimeLimits2.max.seconds - slotTimeLimits2.min.seconds;
        }
      }
      let step = $slotDuration().seconds;
      return offset / step * $slotWidth() - $_bodyScrollLeft();
    });
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        var div = root_1();
        let styles;
        template_effect(
          ($0) => {
            set_class(div, 1, $theme().nowIndicator);
            styles = set_style(div, "", styles, $0);
          },
          [
            () => {
              var _a2;
              return {
                top: `${$_headerHeight() + 2}px`,
                left: `${(_a2 = get$1(left)) != null ? _a2 : ""}px`,
                height: `${$_bodyHeight() - 1}px`
              };
            }
          ]
        );
        append($$anchor2, div);
      };
      if_block(node, ($$render) => {
        if (get$1(left) !== null && get$1(left) >= 3 && get$1(left) <= $_bodyWidth() - 3) $$render(consequent);
      });
    }
    append($$anchor, fragment);
    pop();
    $$cleanup();
  }
  var root = /* @__PURE__ */ from_html(`<div><!> <div><!> <!> <!></div></div>`);
  function View($$anchor, $$props) {
    push($$props, false);
    const [$$stores, $$cleanup] = setup_stores();
    const $theme = () => store_get(theme, "$theme", $$stores);
    const $nowIndicator = () => store_get(nowIndicator, "$nowIndicator", $$stores);
    let { nowIndicator, theme } = getContext("state");
    init();
    var div = root();
    var node = child(div);
    Sidebar(node, {});
    var div_1 = sibling(node, 2);
    var node_1 = child(div_1);
    Header(node_1, {});
    var node_2 = sibling(node_1, 2);
    Body(node_2, {});
    var node_3 = sibling(node_2, 2);
    {
      var consequent = ($$anchor2) => {
        NowIndicator($$anchor2, {});
      };
      if_block(node_3, ($$render) => {
        if ($nowIndicator()) $$render(consequent);
      });
    }
    template_effect(() => {
      set_class(div, 1, $theme().container);
      set_class(div_1, 1, $theme().main);
    });
    append($$anchor, div);
    pop();
    $$cleanup();
  }
  const ResourceTimeline = {
    createOptions(options) {
      options.buttonText.resourceTimelineDay = "timeline";
      options.buttonText.resourceTimelineWeek = "timeline";
      options.buttonText.resourceTimelineMonth = "timeline";
      options.theme.expander = "ec-expander";
      options.theme.main = "ec-main";
      options.theme.times = "ec-times";
      options.theme.container = "ec-container";
      options.view = "resourceTimelineWeek";
      options.views.resourceTimelineDay = {
        buttonText: btnTextDay,
        component: View,
        displayEventEnd: false,
        dayHeaderFormat: { weekday: "long" },
        duration: { days: 1 },
        slotDuration: "01:00",
        theme: themeView("ec-timeline ec-resource-day-view"),
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      };
      options.views.resourceTimelineWeek = {
        buttonText: btnTextWeek,
        component: View,
        displayEventEnd: false,
        duration: { weeks: 1 },
        slotDuration: "01:00",
        theme: themeView("ec-timeline ec-resource-week-view")
      };
      options.views.resourceTimelineMonth = {
        buttonText: btnTextMonth,
        component: View,
        displayEventEnd: false,
        dayHeaderFormat: {
          weekday: "short",
          day: "numeric"
        },
        duration: { months: 1 },
        slotDuration: { days: 1 },
        theme: themeView("ec-timeline ec-resource-month-view"),
        titleFormat: { year: "numeric", month: "long" }
      };
    },
    createStores(state2) {
      if (!("_viewResources" in state2)) {
        state2._viewResources = viewResources(state2);
      }
      state2._bodyHeight = writable(0);
      state2._bodyWidth = writable(0);
      state2._bodyScrollLeft = writable(0);
      state2._headerEl = writable(void 0);
      state2._headerHeight = writable(0);
      state2._dayTimeLimits = dayTimeLimits(state2);
      state2._dayTimes = dayTimes(state2);
      state2._nestedResources = nestedResources(state2);
      state2._resHs = writable(/* @__PURE__ */ new Map());
      state2._sidebarEl = writable(void 0);
    }
  };
  function createCalendar(target, plugins, options) {
    return mount(Calendar, {
      target,
      props: {
        plugins,
        options
      }
    });
  }
  function destroyCalendar(calendar) {
    return unmount(calendar);
  }
  function create(target, options) {
    return createCalendar(target, [
      DayGrid,
      Interaction,
      List,
      ResourceTimeGrid,
      ResourceTimeline,
      TimeGrid
    ], options);
  }
  exports.create = create;
  exports.destroy = destroyCalendar;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
//# sourceMappingURL=event-calendar.js.map
