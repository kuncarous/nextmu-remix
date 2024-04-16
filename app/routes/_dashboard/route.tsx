import { Flex } from '@mantine/core';
import { Outlet } from '@remix-run/react';
import { Navbar } from './sections/navbar';

export default function Layout() {
    return (
        <Flex direction="row" flex="1 1 auto">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </Flex>
    );
}
