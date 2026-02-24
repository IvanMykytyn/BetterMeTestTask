import { Dropzone } from "@mantine/dropzone";

export function ImportOrders() {
  return (
    <Dropzone onDrop={() => {}}>
      <Dropzone.Idle>Import orders</Dropzone.Idle>
    </Dropzone>
  );
}
