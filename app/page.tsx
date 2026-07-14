// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import './home.css'; // ✅ CSS import (not module)

interface Role {
    id: 'admin' | 'vendor' | 'customer' | 'rider';
    label: string;
    icon: string;
    color: string;
    description: string;
}

const roles: Role[] = [
    { id: 'admin', label: 'Admin', icon: '⚙️', color: '#dc3545', description: 'Manage the platform' },
    { id: 'vendor', label: 'Vendor', icon: '🏪', color: '#28a745', description: 'Sell your products' },
    { id: 'customer', label: 'Customer', icon: '🛍️', color: '#4a6cf7', description: 'Shop & buy' },
    { id: 'rider', label: 'Rider', icon: '🛵', color: '#ffc107', description: 'Deliver orders' }
];

export default function HomePage() {
    const router = useRouter();

    const handleRoleClick = (roleId: Role['id']) => {
        router.push(`/auth/login?role=${roleId}`);
    };

    return (
        <div className="container">
            <div className="content">
                <div className="brand">
                    <h1 className="title">
                        🏪 Digital<span className="titleHighlight">Rawalpindi</span>
                    </h1>
                    <p className="subtitle">Rawalpindi&apos;s Premier Multi-Vendor Marketplace</p>
                    <p className="description">Choose your role to get started</p>
                </div>

                <div className="cardContainer">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="card"
                            onClick={() => handleRoleClick(role.id)}
                            style={{ 
                                borderTopColor: role.color
                            }}
                        >
                            <div className="cardIcon">{role.icon}</div>
                            <h3 className="cardTitle">{role.label}</h3>
                            <p className="cardDesc">{role.description}</p>
                            <span 
                                className="cardArrow"
                                style={{ color: role.color }}
                            >
                                →
                            </span>
                        </div>
                    ))}
                </div>

                <div className="footer">
                    <p>
                        Don&apos;t have an account?{' '}
                        <span 
                            className="footerLink"
                            onClick={() => router.push('/auth/register')}
                            style={{ cursor: 'pointer' }}
                        >
                            Register here
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}