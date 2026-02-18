import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
    useLocation,
} from "react-router-dom";

import Navbar from "./components/navigation/Navbar";
import Footer from "./components/footer/Footer";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/homePage/Home";
import LoginPage from "./pages/loginPage/Login";
import Register from "./pages/registerPage/Register";
import RegisterModal from "./pages/registerPage/RegisterModal"; // ✅ NOVÉ
import MyFlights from "./pages/myFlightsPage/MyFlights";
import ManageUsers from "./pages/manageUsersPage/ManageUsers";
import Upload from "./pages/uploadPage/Upload";
import EditUserDialog from "./components/editUser/EditUserDialog";
import EditUserModal from "./components/editUser/EditUserModal"; // ✅ NOVÉ
import Info from "./pages/infoPage/Info";
import Contact from "./pages/contactPage/Contact";
import FlightDetails from "./pages/flightDetailsPage/FlightDetails";
import MyDevices from "./pages/devicesPage/MyDevices";
import AdminDevices from "./pages/adminDevicesPage/AdminDevices";

import "./App.css";

function AppRoutes() {
    const location = useLocation();
    const backgroundLocation = location.state?.backgroundLocation;

    return (
        <div className="content-wrapper">
            {/* ✅ Hlavné routy sa renderujú buď normálne, alebo ako "pozadie" */}
            <Routes location={backgroundLocation || location}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/api/login" element={<Navigate to="/login" replace />} />
                <Route path="/api/register" element={<Navigate to="/register" replace />} />

                <Route path="/home" element={<Home />} />
                <Route path="/info" element={<Info />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/manage-users"
                    element={<PrivateRoute roles={["ROLE_ADMIN"]} page={<ManageUsers />} />}
                />
                <Route
                    path="/my-flights"
                    element={<PrivateRoute roles={["ROLE_ADMIN", "ROLE_USER"]} page={<MyFlights />} />}
                />
                <Route
                    path="/upload-files"
                    element={<PrivateRoute roles={["ROLE_ADMIN", "ROLE_USER"]} page={<Upload />} />}
                />

                {/* ✅ keď user otvorí /edit-user/:id priamo → normálna page */}
                <Route
                    path="/edit-user/:id"
                    element={<PrivateRoute roles={["ROLE_ADMIN", "ROLE_USER"]} page={<EditUserDialog />} />}
                />

                <Route
                    path="/flights/:id"
                    element={<PrivateRoute roles={["ROLE_ADMIN", "ROLE_USER"]} page={<FlightDetails />} />}
                />
                <Route
                    path="/my-devices"
                    element={<PrivateRoute roles={["ROLE_ADMIN", "ROLE_USER"]} page={<MyDevices />} />}
                />
                <Route
                    path="/admin-devices"
                    element={<PrivateRoute roles={["ROLE_ADMIN"]} page={<AdminDevices />} />}
                />
            </Routes>

            {/* ✅ Modal route – len keď existuje backgroundLocation */}
            {backgroundLocation && (
                <Routes>
                    <Route
                        path="/edit-user/:id"
                        element={<PrivateRoute roles={["ROLE_ADMIN", "ROLE_USER"]} page={<EditUserModal />} />}
                    />
                    <Route path="/register" element={<RegisterModal />} /> {/* ✅ NOVÉ */}
                </Routes>
            )}
        </div>
    );
}

function App() {
    return (
        <div className="App">
            <Router>
                <Navbar />
                <AppRoutes />
                <Footer />
            </Router>
        </div>
    );
}

export default App;
