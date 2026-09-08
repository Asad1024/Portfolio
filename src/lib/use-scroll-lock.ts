"use client";

import { useEffect } from "react";

/* One page, one scrollbar, and four things that want to freeze it: the
   preloader, the mobile menu, the palette and the terminal.

   Each of them used to write document.body.style.overflow directly and clear
   it on cleanup, which is fine until two overlap — and two do. The palette
   does not close the terminal, so `terminal` can open the palette and sit
   underneath it; closing the palette then cleared the lock and let the page
   scroll behind a terminal that was still open.

   Counting owners fixes it: the first one in takes the lock, the last one out
   restores whatever the body had before. The count is module-level because
   the thing being locked is module-level too — there is only one body. */

let owners = 0;
let restore = "";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (owners === 0) {
      restore = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    owners += 1;

    return () => {
      owners -= 1;
      if (owners === 0) document.body.style.overflow = restore;
    };
  }, [active]);
}
