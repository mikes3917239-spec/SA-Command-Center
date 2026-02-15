import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuthStore } from '@/features/auth/auth-store';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NotesListPage } from '@/features/notes/NotesListPage';
import { NoteEditorPage } from '@/features/notes/NoteEditorPage';
import { DemoSelectorPage } from '@/features/demo-selector/DemoSelectorPage';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { AgendaBuilderPage } from '@/features/agenda/AgendaBuilderPage';
import { DataWorkbenchPage } from '@/features/data-workbench/DataWorkbenchPage';

function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'notes', element: <NotesListPage /> },
          { path: 'notes/:noteId', element: <NoteEditorPage /> },
          { path: 'demo-selector', element: <DemoSelectorPage /> },
          { path: 'agendas', element: <AgendaPage /> },
          { path: 'agendas/:agendaId', element: <AgendaBuilderPage /> },
          { path: 'data-workbench', element: <DataWorkbenchPage /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
