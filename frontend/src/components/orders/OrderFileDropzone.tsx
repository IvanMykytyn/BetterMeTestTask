import { Dropzone } from "@mantine/dropzone";
import { Group, Text, useMantineTheme } from "@mantine/core";
import { IconCloudUpload, IconDownload, IconX } from "@tabler/icons-react";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
};

export function OrderFileDropzone({ value, onChange }: Props) {
  const theme = useMantineTheme();

  return (
    <Dropzone
      onDrop={(files) => onChange(files[0] ?? null)}
      onReject={() => onChange(null)}
      accept={["text/csv"]}
      maxSize={30 * 1024 ** 2}
      radius="md"
    >
      <Group justify="center" style={{ pointerEvents: "none" }}>
        <Dropzone.Accept>
          <IconDownload size={50} color={theme.colors.blue[6]} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={50} color={theme.colors.red[6]} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconCloudUpload size={50} />
        </Dropzone.Idle>
      </Group>

      <Text ta="center" fw={700} mt="md">
        {value ? value.name : "Upload CVS file"}
      </Text>

      <Text ta="center" size="sm" c="dimmed">
        Only .cvs files less than 30MB
      </Text>
    </Dropzone>
  );
}
