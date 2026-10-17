import React from 'react';
import { createRoot } from 'react-dom/client';
import InteractiveMuscleMap from '../src/components/InteractiveMuscleMap/InteractiveMuscleMap';
import DayDetail from '../src/pages/DayDetailPage';
import { APP_MUSCLE_BY_ID } from '../src/components/InteractiveMuscleMap/muscleMapping';
import '../src/index.css';

window.mapping = APP_MUSCLE_BY_ID;
window.payloads = [];
window.groupClicks = [];
const callbacks = {
  onSelect: region => window.payloads.push(region),
  onMuscleClick: group => window.groupClicks.push(group),
};
let root = createRoot(document.getElementById('root'));
window.renderMap = props => root.render(
  <React.StrictMode><InteractiveMuscleMap {...callbacks} {...props} /></React.StrictMode>,
);
window.remount = () => {
  root.unmount();
  root = createRoot(document.getElementById('root'));
  window.renderMap({});
};
if (new URLSearchParams(location.search).has('daily')) {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  root.render(<React.StrictMode><DayDetail date={date} onBack={() => {}} /></React.StrictMode>);
} else window.renderMap({});
