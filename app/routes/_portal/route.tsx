import { Outlet } from '@remix-run/react';
import { Footer } from './sections/footer';
import { Header } from './sections/header';

export default function Layout() {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}
