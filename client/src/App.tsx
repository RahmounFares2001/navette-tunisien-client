import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Providers } from './globalRedux/Providers';
import Home from './pages/Home';
import Transfers from './pages/Transfers';
import Excursions from './pages/Excursions';
import ExcursionDetails from './pages/ExcursionDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTransfers from './pages/admin/AdminTransfers';
import AdminExcursionRequests from './pages/admin/AdminExcursionRequests';
import AdminExcursions from './pages/admin/AdminExcursions';
import AdminVehicles from './pages/admin/AdminVehicles';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import ProtectedAdminRoute from './utils/ProtectedAdminRoute';
import AdminBlogs from './pages/admin/AdminBlogs';
import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Providers>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Toaster />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/resetPassword" element={<ResetPassword />} />
              <Route
                path="/"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <Home />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/transfers"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <Transfers />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/excursions"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <Excursions />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/excursion/:id"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <ExcursionDetails />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/blogs"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <Blogs />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/blogs/:id/:slug?"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <BlogDetails />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/about"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <About />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/contact"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <Contact />
                    </main>
                    <Footer />
                  </>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/transfers"
                element={
                  <ProtectedAdminRoute>
                    <AdminTransfers />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/excursion-requests"
                element={
                  <ProtectedAdminRoute>
                    <AdminExcursionRequests />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/excursions"
                element={
                  <ProtectedAdminRoute>
                    <AdminExcursions />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/vehicles"
                element={
                  <ProtectedAdminRoute>
                    <AdminVehicles />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/blogs"
                element={
                  <ProtectedAdminRoute>
                    <AdminBlogs />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="*"
                element={
                  <>
                    <Navigation />
                    <main className="flex-1">
                      <NotFound />
                    </main>
                    <Footer />
                  </>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </Providers>
  </QueryClientProvider>
);

export default App;