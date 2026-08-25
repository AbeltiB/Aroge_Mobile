import { useAppState } from '../../../src/context/AppContext';
import BuyerHome from '../../../src/screens/BuyerHomeScreen';
import SellerDashboard from '../../../src/screens/SellerDashboardScreen';

export default function HomeTab() {
  const { sellerMode } = useAppState();
  return sellerMode ? <SellerDashboard /> : <BuyerHome />;
}
