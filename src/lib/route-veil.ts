/* Whether this visit has already moved between pages. The first page of a
   visit is shown without the route veil (see app/template.tsx); every page
   after that mounts underneath it. Module state, so it survives the
   template's remount on each path, and anything mounting can read it during
   its first render to know whether the veil is covering it.

   `pending` is how a page asks the veil to wait for it: push a promise from
   an effect (a child's effects run before the template's, so it is in the
   list by the time the veil looks) and the veil holds until it settles, up
   to its own backstop. The hero uses it for its 3D scene's first frame. */
export const routeVeil = {
  navigated: false,
  pending: [] as Promise<unknown>[],
};
