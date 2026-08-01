import { CalculatorProvider } from "@/components/calculator/CalculatorContext";

export default function CalculatorLayout({ children }) {
  return <CalculatorProvider>{children}</CalculatorProvider>;
}
