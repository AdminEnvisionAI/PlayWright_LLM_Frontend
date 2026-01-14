import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CompanyListPage from './pages/CompanyListPage.jsx'
import ProjectListPage from './pages/ProjectListPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<CompanyListPage />} />
                <Route path="/companies/:companyId/projects" element={<ProjectListPage />} />
                <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
