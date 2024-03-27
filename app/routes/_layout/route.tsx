import { Outlet } from "@remix-run/react";
import Header from "./sections/header";
import Footer from "./sections/footer";

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