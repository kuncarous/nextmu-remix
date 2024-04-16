import {
    ErrorResponse,
    Links,
    Meta,
    Scripts,
    isRouteErrorResponse,
    useRouteError,
} from '@remix-run/react';
import { StatusCodes } from 'http-status-codes';
import { ReactElement } from 'react';
import styles from './styles.module.scss';

const NotFoundComponent = () => {
    return (
        <>
            <div
                className={styles.background}
                style={{ backgroundImage: 'url("/images/not-found.svg")' }}
            />
            <span>
                <a href="https://www.freepik.com/free-vector/oops-404-error-with-broken-robot-concept-illustration_13315300.htm">
                    Image by storyset
                </a>{' '}
                on Freepik
            </span>
        </>
    );
};

const UnauthorizedComponent = () => {
    return (
        <>
            <div
                className={styles.background}
                style={{ backgroundImage: 'url("/images/unauthorized.svg")' }}
            />
            <span>
                <a href="https://www.freepik.com/free-vector/401-error-unauthorized-concept-illustration_13315291.htm">
                    Image by storyset
                </a>{' '}
                on Freepik
            </span>
        </>
    );
};

const UnknownErrorComponent = () => {
    return <NotFoundComponent />;
};

const StatusComponents: {
    [key: number]: ReactElement;
} = {
    [StatusCodes.NOT_FOUND]: <NotFoundComponent />,
    [StatusCodes.UNAUTHORIZED]: <UnauthorizedComponent />,
};

interface IErrorComponentProps {
    error: ErrorResponse;
}
function ErrorComponent({ error }: IErrorComponentProps) {
    const component = StatusComponents[error.status];
    if (component == null) return <UnknownErrorComponent />;
    return component;
}

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
                        <ErrorComponent error={error} />
                    ) : (
                        <UnknownErrorComponent />
                    )}
                </div>
                <Scripts />
            </body>
        </html>
    );
}
