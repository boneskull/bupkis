declare module 'set.prototype.difference' {
  function implementation<T, U>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<U>,
  ): Set<T>;
  export default implementation;
}

declare module 'set.prototype.union' {
  function implementation<T, U>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<U>,
  ): Set<T | U>;
  export default implementation;
}

declare module 'set.prototype.intersection' {
  function implementation<T, U>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<U>,
  ): Set<T & U>;
  export default implementation;
}

declare module 'set.prototype.symmetricdifference' {
  function implementation<T, U>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<U>,
  ): Set<T | U>;
  export default implementation;
}

declare module 'set.prototype.issubsetof' {
  function implementation<T>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<unknown>,
  ): boolean;
  export default implementation;
}

declare module 'set.prototype.issupersetof' {
  function implementation<T>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<unknown>,
  ): boolean;
  export default implementation;
}

declare module 'set.prototype.isdisjointfrom' {
  function implementation<T>(
    this: void,
    set: ReadonlySet<T>,
    other: ReadonlySetLike<unknown>,
  ): boolean;
  export default implementation;
}
