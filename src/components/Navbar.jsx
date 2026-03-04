import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-xl font-bold text-blue-700 mr-4">💪 GymPlanner</span>
        <NavLink to="/" end className={linkClass}>
          Workout Scheduler
        </NavLink>
        <NavLink to="/planner" className={linkClass}>
          Exercise Planner
        </NavLink>
      </div>
    </nav>
  );
}
