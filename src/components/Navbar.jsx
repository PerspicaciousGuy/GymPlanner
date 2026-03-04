export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">💪</span>
        <span className="text-xl font-bold text-blue-700 tracking-tight">GymPlanner</span>
        <span className="ml-2 text-sm text-gray-400 font-medium">Daily Workout Scheduler</span>
      </div>
    </nav>
  );
}
