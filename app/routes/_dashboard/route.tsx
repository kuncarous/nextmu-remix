import { Outlet } from '@remix-run/react';

export default function Layout() {
    return (
        <>
            <main>
                <Outlet />
            </main>
        </>
    );
}
