import { NewtonsCradleLoader } from "./newtons-cradle-loader";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function Loader({ size = "md", className = "", text }: LoaderProps) {
  const sizeMap = {
    sm: 20,
    md: 40,
    lg: 60,
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <NewtonsCradleLoader size={sizeMap[size]} speed={1.2} color="#030213" />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

