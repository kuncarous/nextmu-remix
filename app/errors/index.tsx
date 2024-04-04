import {
    Links,
    Meta,
    Scripts,
    isRouteErrorResponse,
    useRouteError,
} from '@remix-run/react';
import { StatusCodes } from 'http-status-codes';
import styles from './styles.module.scss';

const NotFoundComponent = () => {
    return (
        <div
            className={styles.background}
            style={{ backgroundImage: 'url("/images/not-found.svg")' }}
        />
    );
};

const UnknownErrorComponent = () => {
    return (
        <div
            className={styles.background}
            style={{ backgroundImage: 'url("/images/not-found.svg")' }}
        />
    );
};

export function ErrorBoundary() {
    const error = useRouteError();
    return (
        <html>
            <head>
                <title>Oops!</title>
                <Meta />
                <Links />
            </head>
            <body>
                <div className={styles.container}>
                    {isRouteErrorResponse(error) ? (
                        error.status === StatusCodes.NOT_FOUND ? (
                            <NotFoundComponent />
                        ) : (
                            <UnknownErrorComponent />
                        )
                    ) : (
                        <UnknownErrorComponent />
                    )}
                </div>
                <Scripts />
            </body>
        </html>
    );
}
