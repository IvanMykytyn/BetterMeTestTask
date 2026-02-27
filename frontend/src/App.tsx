import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import queryString from "query-string";

import { Layout } from "@/components/shared/Layout";
import OrdersPage from "./components/orders/OrdersPage";
import { ROUTES } from "@/constants/routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: (
      <QueryParamProvider
        adapter={ReactRouter6Adapter}
        options={{
          searchStringToObject: queryString.parse,
          objectToSearchString: queryString.stringify,
        }}
      >
        <Layout />
      </QueryParamProvider>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.ORDERS} replace /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "products", element: <div>Products</div> },
    ],
  },
  { path: "*", element: <Navigate to={ROUTES.ORDERS} replace /> },
]);

export function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <ModalsProvider>
          <Notifications />
          <RouterProvider router={router} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
