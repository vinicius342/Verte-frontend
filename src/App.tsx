import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import AppRoutes from "./routes/AppRoutes.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TutorialProvider>
          <AppRoutes />
        </TutorialProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
