import React from "react";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/features/auth/components/login-form";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
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

  it("fills manager demo credentials when selected", () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /manager demo/i }));
    expect(screen.getByLabelText(/email/i)).toHaveValue("manager@perfai.demo");
    expect(screen.getByLabelText(/password/i)).toHaveValue("Password1");
    expect(screen.getByText(/manager sign in/i)).toBeInTheDocument();
  });

  it("fills Abhay's employee demo credentials when selected", () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /abhay \(employee\)/i }));
    expect(screen.getByLabelText(/email/i)).toHaveValue("abhay@perfai.demo");
    expect(screen.getByLabelText(/password/i)).toHaveValue("Password1");
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
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

  it("shows the number of sign-in attempts remaining after a bad password", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "Invalid email or password. 2 attempts remaining before a 1-hour lock.",
        attemptsRemaining: 2,
      }),
    } as Response);
    renderWithProviders(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "person@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("2 attempts remaining");
    fetchSpy.mockRestore();
  });

  it("shows the one-hour lock warning and disables sign-in after the third failure", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "This account is locked for 1 hour after 3 incorrect sign-in attempts.",
        locked: true,
        retryAfterSeconds: 3600,
      }),
    } as Response);
    renderWithProviders(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "person@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("locked for 1 hour");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again in 60 minutes");
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    fetchSpy.mockRestore();
  });
});
