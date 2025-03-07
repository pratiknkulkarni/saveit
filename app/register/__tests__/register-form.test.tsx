import {describe, it, vi} from "vitest";
import {fireEvent, render, screen, waitFor} from "@testing-library/react"
import "@testing-library/jest-dom";
import RegisterForm from "@/app/register/components/RegisterForm";
import {userEvent} from "@testing-library/user-event";
import {registerUser} from "@/app/actions/auth";
import {useToast} from "@/hooks/use-toast";

vi.mock("@/app/actions/auth", () => ({
    registerUser: vi.fn()
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: vi.fn()
}));

describe("register-form", () => {
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

    it("should render the form", () => {
        render(<RegisterForm/>);
        expect(screen.getByText("Welcome")).toBeInTheDocument()
        expect(screen.getByText("Please create an account to continue")).toBeInTheDocument()

        //expect(screen.getByText("Continue with GitHub")).toBeInTheDocument()
        //expect(screen.getByText("Continue with Google")).toBeInTheDocument()

        expect(screen.getByLabelText("Email")).toBeInTheDocument()
        expect(screen.getByLabelText("Password")).toBeInTheDocument()
        expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()

        expect(screen.getByRole("button", {name: "Register"})).toBeInTheDocument()

        expect(screen.getByText("Already have an account?")).toBeInTheDocument()
        expect(screen.getByRole("link", {name: "Login"})).toHaveAttribute("href", "/login")
    });

    it("displays validation errors for invalid email", async () => {
        render(<RegisterForm/>)

        const emailInput = screen.getByLabelText("Email")
        await userEvent.type(emailInput, "invalid-email")

        fireEvent.submit(screen.getByRole("button", {name: "Register"}))

        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument()
        })
    });

    it("displays validation error for short password", async () => {
        render(<RegisterForm/>)

        const passwordInput = screen.getByLabelText("Password")
        await userEvent.type(passwordInput, "short")

        fireEvent.submit(screen.getByRole("button", {name: "Register"}))

        await waitFor(() => {
            expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
        })
    })

    it("displays error when passwords do not match", async () => {
        render(<RegisterForm/>)

        const passwordInput = screen.getByLabelText("Password")
        const confirmPasswordInput = screen.getByLabelText("Confirm Password")

        await userEvent.type(passwordInput, "validpassword123")
        await userEvent.type(confirmPasswordInput, "differentpassword123")

        fireEvent.submit(screen.getByRole("button", {name: "Register"}))

        await waitFor(() => {
            expect(screen.getByText("Passwords do not match")).toBeInTheDocument()
        })
    });

    it("successfully submits form with valid data", async () => {
        const mockRequest = {
            email: "fromthetest@example.com",
            password: "validpassword123",
            confirmPassword: "validpassword123"
        };

        const mockResponse = {
            data: {
                token: "mock-token-123",
                user: {
                    id: "user-123",
                    email: "fromthetest@example.com",
                    name: "",
                    image: null,
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            error: null
        }
        vi.mocked(registerUser).mockResolvedValue(mockResponse);

        render(<RegisterForm/>)

        await userEvent.type(screen.getByLabelText("Email"), mockRequest.email)
        await userEvent.type(screen.getByLabelText("Password"), mockRequest.password)
        await userEvent.type(screen.getByLabelText("Confirm Password"), mockRequest.confirmPassword)

        fireEvent.submit(screen.getByRole("button", {name: "Register"}))

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith({
                email: mockRequest.email,
                password: mockRequest.password,
                name: "",
                callbackURL: "",
            })
        });
        expect(mockResponse.data.user.email).toBe(mockRequest.email);
        expect(mockToast).toHaveBeenCalledWith({
            title: "Success!",
            description: "User account created successfully."
        });
    })
});
