import {describe, it, vi} from "vitest";
import {fireEvent, render, screen, waitFor} from "@testing-library/react"
import "@testing-library/jest-dom";
import {userEvent} from "@testing-library/user-event";
import LoginForm from "@/app/login/components/LoginForm";
import {useToast} from "@/hooks/use-toast";
import {loginUser} from "@/app/actions/auth";

vi.mock("@/app/actions/auth", () => ({
    loginUser: vi.fn()
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: vi.fn()
}));

describe("LoginForm", () => {
    const mockToast = vi.fn();
    const mockDismiss = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToast).mockReturnValue({
            toast: mockToast,
            dismiss: mockDismiss,
            toasts: []
        });
    });

    it("renders the form with all required elements", () => {
        render(<LoginForm/>)

        expect(screen.getByText("Welcome back")).toBeInTheDocument()
        expect(screen.getByText("Please login to your account")).toBeInTheDocument()

        expect(screen.getByLabelText("Email")).toBeInTheDocument()
        expect(screen.getByLabelText("Password")).toBeInTheDocument()

        expect(screen.getByText("Forgot your password?")).toBeInTheDocument()
        expect(screen.getByRole("button", {name: "Login"})).toBeInTheDocument()
        expect(screen.getByText("Don\'t have an account?")).toBeInTheDocument()
        expect(screen.getByRole("link", {name: "Register"})).toHaveAttribute("href", "/register")
    })

    it("displays validation error for invalid email", async () => {
        render(<LoginForm/>)

        const emailInput = screen.getByLabelText("Email")
        await userEvent.type(emailInput, "invalid-email")

        fireEvent.submit(screen.getByRole("button", {name: "Login"}))

        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument()
        })
    })

    it("displays validation error for empty password", async () => {
        render(<LoginForm/>)

        const emailInput = screen.getByLabelText("Email")
        await userEvent.type(emailInput, "test@example.com")

        fireEvent.submit(screen.getByRole("button", {name: "Login"}))

        await waitFor(() => {
            expect(screen.getByText("Password is required")).toBeInTheDocument()
        })
    })


    it("successfully submits form with valid data", async () => {
        const mockRequest = {
            email: "test@example.com",
            password: "validpassword123",
        };

        const mockResponse = {
            data: {
                token: "mock-token-123",
                redirect: false,
                url: "",
                user: {
                    id: "user-123",
                    email: "test@example.com",
                    name: "",
                    image: null,
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            error: null
        }
        vi.mocked(loginUser).mockResolvedValue(mockResponse);

        render(<LoginForm/>)

        await userEvent.type(screen.getByLabelText("Email"), mockRequest.email)
        await userEvent.type(screen.getByLabelText("Password"), mockRequest.password)
        fireEvent.submit(screen.getByRole("button", {name: "Login"}))
        await waitFor(() => {
            expect(loginUser).toHaveBeenCalledWith({
                email: mockRequest.email,
                password: mockRequest.password,
            })
            expect(mockResponse.data.user.email).toBe(mockRequest.email);
            expect(mockToast).toHaveBeenCalledWith({
                title: "Success!",
                description: "Login successful."
            });
        });

    })
})