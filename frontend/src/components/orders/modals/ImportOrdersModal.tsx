import { Group, Loader, Modal, Progress, Stack, Text } from "@mantine/core";
import { OrderFileDropzone } from "../OrderFileDropzone";
import { Button } from "../../shared/Button";
import { useState } from "react";
import { useUploadOrdersFile } from "@/hooks/useUploadOrdersFile";

type Props = {
  opened: boolean;
  onClose: () => void;
};

export function ImportOrdersModal({ opened, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  const { mutate: uploadOrdersFile, isPending: isUploading } = useUploadOrdersFile();

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setUploadProgress(0);
      setUploadingFileName(null);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={isUploading ? () => {} : handleClose}
      title="Upload CSV"
      size="md"
      padding="xl"
      radius="md"
      closeOnClickOutside={!isUploading}
      closeOnEscape={!isUploading}
      withCloseButton={!isUploading}
    >
      {isUploading ? (
        <Stack gap="md">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Uploading {uploadingFileName ?? "file"}...
            </Text>
          </Group>
          <Progress value={uploadProgress} size="lg" radius="xl" />
        </Stack>
      ) : (
        <>
          <OrderFileDropzone
            value={file}
            onChange={(f) => setFile(f)}
          />
          <Group mt="md" justify="center">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!file) return;
                setUploadingFileName(file.name);
                uploadOrdersFile(
                  { file, onProgress: setUploadProgress },
                  {
                    onSuccess: handleClose,
                    onSettled: () => {
                      setUploadProgress(0);
                      setUploadingFileName(null);
                    },
                  }
                );
              }}
            >
              Upload
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
