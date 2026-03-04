import { Dashboard } from './components/Dashboard';
import sampleData from '../public/data.json';
import type { PortfolioRecommendation } from './types/portfolio';

function App() {
  // Use sample data from JSON (inferred from backend)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = sampleData as any as PortfolioRecommendation;

  return <Dashboard data={data} />;
}

export default App;
