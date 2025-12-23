import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include at least one uppercase letter",
  })
  .refine((value) => /[a-z]/.test(value), {
    message: "Password must include at least one lowercase letter",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "Password must include at least one special character",
  });

const phoneRegex = /^0\d{9}$/;

export const signUpRecruiterFormSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z
    .string()
    .email({ message: "Invalid email address" }),
  password: passwordSchema,
  // Organization Information
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters" }),
  website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .url({ message: "Please enter a valid logo URL" })
    .optional()
    .or(z.literal("")),
  about: z
    .string()
    .optional()
    .or(z.literal("")),
  companyEmail: z
    .string()
    .email({ message: "Please enter a valid company email" })
    .optional()
    .or(z.literal("")),
  contactPerson: z
    .string()
    .min(2, { message: "Contact person name must be at least 2 characters" }),
  phoneNumber: z
    .string()
    .regex(phoneRegex, { message: "Phone number must be 10 digits starting with 0" }),
  companyAddress: z
    .string()
    .min(5, { message: "Company address must be at least 5 characters" }),
  terms: z.boolean().refine((v) => v === true, {
    message: "You must accept the Terms and Conditions",
  }),
});

export type SignUpRecruiterFormValues = z.infer<typeof signUpRecruiterFormSchema>;

const useSignUpRecruiterHook = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpRecruiterFormValues>({
    resolver: zodResolver(signUpRecruiterFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      companyName: "",
      website: "",
      logoUrl: "",
      about: "",
      companyEmail: "",
      contactPerson: "",
      phoneNumber: "",
      companyAddress: "",
      terms: false,
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (values: SignUpRecruiterFormValues) => {
    try {
      // Single step: Create recruiter account with all information
      console.log("🔵 [SIGNUP] Creating recruiter account with organization info...");
      
      // Backend expects organizationInfo as a nested object
      const payload = {
        // User account info (flat)
        username: values.username,
        email: values.email,
        password: values.password,
        // Organization info (nested in organizationInfo object)
        organizationInfo: {
          companyName: values.companyName,
          website: values.website && values.website.trim() !== "" ? values.website : undefined,
          logoUrl: values.logoUrl && values.logoUrl.trim() !== "" ? values.logoUrl : undefined,
          about: values.about && values.about.trim() !== "" ? values.about : undefined,
          companyEmail: values.companyEmail && values.companyEmail.trim() !== "" ? values.companyEmail : undefined,
          contactPerson: values.contactPerson,
          phoneNumber: values.phoneNumber,
          companyAddress: values.companyAddress,
        }
      };

      console.log("📤 [SIGNUP] Payload:", { 
        ...payload, 
        password: '***hidden***',
        organizationInfo: { ...payload.organizationInfo }
      });

      const response = await api.post("/api/registration/recruiter", payload);

      console.log("📥 [SIGNUP] Response:", response.data);

      if (response.status >= 200 && response.status < 300) {
        console.log("✅ [SIGNUP] Registration successful!");
        
        // Successful registration
        toast.success("Registration successful! Your account is pending approval.");
        
        // Store user info in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("pending_profile_email", values.email);
          localStorage.setItem("pending_profile_username", values.username);
        }
        
        form.reset({
          username: "",
          email: "",
          password: "",
          companyName: "",
          website: "",
          logoUrl: "",
          about: "",
          companyEmail: "",
          contactPerson: "",
          phoneNumber: "",
          companyAddress: "",
          terms: false,
        });
        setShowPassword(false);
        
        // Redirect to pending page after successful registration
        setTimeout(() => {
          router.push("/auth/account-pending");
        }, 1500);
        return;
      }

      toast.error("Không thể tạo tài khoản. Vui lòng thử lại.");
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      
      // Log detailed error for debugging
      console.error("❌ [SIGNUP] Error details:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      
      // Check if there are validation errors
      if (axiosError.response?.data?.errors) {
        console.error("❌ [SIGNUP] Validation errors:", axiosError.response.data.errors);
      }
      
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      
      console.error("❌ [SIGNUP] Error:", message);
      toast.error(message);
    }
  };
  
  useEffect(() => {
    const firstError = Object.keys(form.formState.errors)[0];
    if (firstError) {
      const field = document.querySelector(
        `[name="${firstError}"]`
      ) as HTMLElement;
      field?.focus();
    }
  }, [form.formState.errors]);

  return {
    form,
    onSubmit,
    showPassword,
    togglePasswordVisibility,
  };
};

export default useSignUpRecruiterHook;
