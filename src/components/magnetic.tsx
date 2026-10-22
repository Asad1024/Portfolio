/** Wraps a call-to-action. It used to drift toward the pointer; hovers on the
 *  site are now kept still (colour and light only), so this just holds the
 *  layout the buttons were built around. */
export function Magnetic({ children }: { children: React.ReactNode; strength?: number }) {
  return <div className="inline-flex">{children}</div>;
}
