import { useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddPropertyWizard from './components/AddPropertyWizard';
import PropertyDetail from './components/PropertyDetail';
import ComparisonView from './components/ComparisonView';
import Toast from './components/shared/Toast';

export default function App() {
  const page = useStore((s) => s.page);

  let content;
  switch (page.name) {
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'add-property':
      content = <AddPropertyWizard />;
      break;
    case 'property':
      content = <PropertyDetail id={page.id} />;
      break;
    case 'compare':
      content = <ComparisonView />;
      break;
  }

  return (
    <>
      <Layout>{content}</Layout>
      <Toast />
    </>
  );
}
