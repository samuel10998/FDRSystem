import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/navigation/Navbar';
import Home from './pages/homePage/Home';
import LoginPage from './pages/loginPage/Login';
import MyFlights from './pages/myFlightsPage/MyFlights';
import ManageUsers from './pages/manageUsersPage/ManageUsers';
import Upload from './pages/uploadPage/Upload';
import Footer from './components/footer/Footer';

import './App.css'; // Make sure to import the updated CSS

function App() {
    return (
        <div className="App">
            <Router>
                <Navbar />
                {/* Use a main 'content' area that grows to push footer down */}
                <div className="content-wrapper">
                    <Routes>
                        <Route path="/" element={<Navigate to="/auth/login" replace />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/auth/login" element={<LoginPage />} />
                        <Route path="/manage-users" element={<ManageUsers />} />
                        <Route path="/my-flights" element={<MyFlights />} />
                        <Route path="/upload-files" element={<Upload />} />
                    </Routes>
                </div>
            </Router>
            <Footer />
        </div>
    );
}

export default App;
