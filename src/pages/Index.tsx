
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";

const Index = () => {
  return (
    <AuthGuard>
      
      <MainLayout />
    
    </AuthGuard>
  );
};

export default Index;

