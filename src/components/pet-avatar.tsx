import { ESPECIE_META, type Pet } from "@/lib/petcare";
import { cn } from "@/lib/utils";

export function PetAvatar({
  pet,
  size = "md",
  className,
}: {
  pet: Pet;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = ESPECIE_META[pet.especie] ?? ESPECIE_META.Outro;
  const Icon = meta.icon;
  const sizes = {
    sm: "size-9",
    md: "size-12",
    lg: "size-16",
  };
  const icons = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl",
        meta.avatar,
        sizes[size],
        className,
      )}
      aria-hidden
    >
      <Icon className={icons[size]} strokeWidth={1.8} />
    </span>
  );
}
