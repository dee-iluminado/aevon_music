import { accountInitial } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  avatar?: string | null;
  className?: string;
  textClassName?: string;
}

/** Circular avatar: the uploaded photo when there is one, otherwise initials. */
export function UserAvatar({
  name,
  avatar,
  className,
  textClassName,
}: UserAvatarProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ember/15 font-semibold text-ember ring-1 ring-ember/25",
        className
      )}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className={cn("text-[11px]", textClassName)}>
          {accountInitial(name)}
        </span>
      )}
    </span>
  );
}
