import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate
} from "react-router-dom";
import axios from "axios";

import Navbar from "./components/navigation/Navbar";
import Footer from "./components/footer/Footer";

import Home from "./pages/homePage/Home";
import LoginPage from "./pages/loginPage/Login";
import Register from "./pages/registerPage/Register";
import MyFlights from "./pages/myFlightsPage/MyFlights";
import ManageUsers from "./pages/manageUsersPage/ManageUsers";
import Upload from "./pages/uploadPage/Upload";
import EditUserDialog from "./components/editUser/EditUserDialog";
import Info from "./pages/infoPage/Info";
import Contact from "./pages/contactPage/Contact";
import PrivateRoute from "./components/PrivateRoute";

import "./App.css";

/* ------- axios – globálna Authorization hlavička --------------------- */

const jwt = localStorage.getItem("jwtToken");
if (jwt) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
}

function App() {
    return (
        <div className="App">
            <Router>
                <Navbar />

                <div className="content-wrapper">
                    <Routes>
                        <Route path="/" element={<Navigate to="/api/login" replace />} />
                        <Route path="/home" element={<Home />} />

                        {/* auth */}
                        <Route path="/api/login" element={<LoginPage />} />
                        <Route path="/api/register" element={<Register />} />

                        {/* chránené cesty */}
                        <Route
                            path="/manage-users"
                            element={
                                <PrivateRoute roles={["ROLE_ADMIN"]} page={<ManageUsers />} />
                            }
                        />
                        <Route
                            path="/my-flights"
                            element={
                                <PrivateRoute
                                    roles={["ROLE_ADMIN", "ROLE_USER"]}
                                    page={<MyFlights />}
                                />
                            }
                        />
                        <Route
                            path="/upload-files"
                            element={
                                <PrivateRoute
                                    roles={["ROLE_ADMIN", "ROLE_USER"]}
                                    page={<Upload />}
                                />
                            }
                        />
                        <Route
                            path="/edit-user/:id"
                            element={
                                <PrivateRoute
                                    roles={["ROLE_ADMIN", "ROLE_USER"]}
                                    page={<EditUserDialog />}
                                />
                            }
                        />

                        {/* verejné informácie */}
                        <Route path="/info" element={<Info />} />
                        <Route path="/contact" element={<Contact />} />
                    </Routes>
                </div>
            </Router>

            <Footer />
        </div>
    );
}

export default App;
