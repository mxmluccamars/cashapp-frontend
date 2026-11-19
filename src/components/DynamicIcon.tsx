import { icons, type LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name?: string | null;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent =
    (name && icons[name as keyof typeof icons]) || icons.Tag;

  return <IconComponent {...props} />;
}