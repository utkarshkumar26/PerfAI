import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/features/auth/components/login-form";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("<LoginForm />", () => {
  it("renders the employee and manager login toggle and form fields", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole("button", { name: /employee login/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /manager login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("switches the login mode to manager", () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /manager login/i }));
    expect(screen.getByText(/manager sign in/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/manager@company.com/i)).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email", async () => {
    renderWithProviders(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });
});
