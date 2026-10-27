import { createBrowserRouter } from 'react-router';
import { StatusPage } from './status-page';

export const router = createBrowserRouter([{ path: '/', element: <StatusPage /> }]);
