import { useEffect, useLayoutEffect } from 'react'

/**
 * useLayoutEffect in the browser, useEffect where there is no layout.
 *
 * The tree is prerendered at build time (entry-server.tsx), where React warns
 * that a layout effect cannot run. Nothing that uses this needs to run there:
 * it is for reads of the viewport or a media query that must land before the
 * first client paint.
 */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
