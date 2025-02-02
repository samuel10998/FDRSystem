import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ page, roles }) => {

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const isAllowed = user && user.roles && Array.isArray(user.roles)
        ? roles.some(role => user.roles.map(roleName => roleName.name).includes(role))
        : false;


    return isAllowed ? page : <Navigate to="/api/login" replace />;
};

export default PrivateRoute;