import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/navigation/Navbar';
import Home from './pages/homePage/Home';
import LoginPage from './pages/loginPage/Login';
import Register from './pages/registerPage/Register';
import MyFlights from './pages/myFlightsPage/MyFlights';
import ManageUsers from './pages/manageUsersPage/ManageUsers';
import Upload from './pages/uploadPage/Upload';
import Footer from './components/footer/Footer';
import PrivateRoute from './components/PrivateRoute';


import axios from "axios";
import './App.css'; // Make sure to import the updated CSS

function App() {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken){
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    }

    return (
        <div className="App">
            <Router>
                <Navbar />
                {/* Use a main 'content' area that grows to push footer down */}
                <div className="content-wrapper">
                    <Routes>
                        <Route path="/" element={<Navigate to="/api/login" replace />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/api/login" element={<LoginPage />} />
                        <Route path="/api/register" element={<Register />} />
                        <Route path="/manage-users" element={<PrivateRoute roles={['ROLE_ADMIN']} page={<ManageUsers />} />} />
                        <Route path="/my-flights" element={<PrivateRoute roles={['ROLE_ADMIN','ROLE_USER']} page={<MyFlights />} />} />
                        <Route path="/upload-files" element={<PrivateRoute roles={['ROLE_ADMIN','ROLE_USER']} page={<Upload />} />} />
                    </Routes>
                </div>
            </Router>
            <Footer />
        </div>
    );
}

export default App;
