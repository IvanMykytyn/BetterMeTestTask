import type { ButtonProps } from "@mantine/core";
import { Button as MantineButton } from "@mantine/core";

type Props = ButtonProps & {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}
export function Button(props: Props) {
  return <MantineButton {...props} />;
}
