import { useEffect, useRef } from 'react';

import './vendor/muscle-map.js';
import maleSvg from './vendor/male-muscle-map.svg?raw';
import femaleSvg from './vendor/female-muscle-map.svg?raw';
import { APP_MUSCLE_BY_ID } from './muscleMapping';
import './openMuscleMap.css';

const SVG_BY_MODEL = { male: maleSvg, female: femaleSvg };

/** Bind the upstream controller to trusted, bundled SVGs and clean up in StrictMode. */
export default function OpenMuscleMap({
  model, view, multiple = false, bilateral = false, muscleStats,
  onSelect, onChange, controllerRef,
}) {
  const host = useRef(null);
  const controller = useRef(null);

  useEffect(() => {
    // Only these checked-in assets are inlined, never user-provided HTML.
    host.current.innerHTML = SVG_BY_MODEL[model];
    const svg = host.current.querySelector('svg');
    const map = window.MuscleMap.createMuscleMap(svg, {
      multiple, bilateral, onSelect, onChange,
    });
    controller.current = map;
    if (controllerRef) controllerRef.current = map;
    return () => {
      map.destroy();
      controller.current = null;
      if (controllerRef) controllerRef.current = null;
    };
  }, [model, multiple, bilateral, onSelect, onChange, controllerRef]);

  useEffect(() => {
    controller.current.setView(view);
  }, [model, view, multiple, bilateral, onSelect, onChange, controllerRef]);

  useEffect(() => {
    // Only host metadata is added; artwork, geometry, and fills stay untouched.
    for (const region of host.current.querySelectorAll('[data-selectable="true"]')) {
      const appMuscle = APP_MUSCLE_BY_ID[region.dataset.muscleId];
      const status = muscleStats[appMuscle]?.status;
      if (status) region.dataset.recoveryStatus = status;
      else delete region.dataset.recoveryStatus;
    }
  }, [model, muscleStats, multiple, bilateral, onSelect, onChange, controllerRef]);

  return <div className="open-muscle-map" ref={host} />;
}
