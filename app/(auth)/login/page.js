import { Suspense } from "react";
import LoginWorkspace from "@/components/auth/LoginWorkspace";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="otp-login-page" />}>
      <LoginWorkspace />
    </Suspense>
  );
}
