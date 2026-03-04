import Navbar from './components/Navbar';
import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <WorkoutSchedulerPage />
      </main>
    </div>
  );
}
