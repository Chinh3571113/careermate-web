import ChangePasswordForm from "@/modules/client/auth/ui/components/change-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - CareerMate",
  description: "Reset your CareerMate account password",
};

const ChangePasswordPage = () => {
  return <ChangePasswordForm />;
};

export default ChangePasswordPage;
