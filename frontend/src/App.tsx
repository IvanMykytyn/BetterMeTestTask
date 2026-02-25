import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { Layout } from "@/components/shared/Layout";
import { OrdersPage } from "@/pages/OrdersPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/orders" replace /> },
      { path: "orders", element: <OrdersPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/orders" replace /> },
]);

export function App() {
  return (
    <MantineProvider>
      <ModalsProvider>
        <Notifications />
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  );
}
