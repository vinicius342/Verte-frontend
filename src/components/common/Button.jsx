const variantes = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
  map: "btn btn-map",
};

export default function Button({ variant = "primary", className = "", type = "button", ...props }) {
  return <button type={type} className={`${variantes[variant] ?? variantes.primary} ${className}`} {...props} />;
}
