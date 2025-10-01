import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from 'react-query';
import { listDocuments, uploadDocument, deleteDocument, downloadDocument } from '@/services/documentService';

const Documents: React.FC = () => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const { data: documents = [], isLoading } = useQuery(['documents'], () => listDocuments());
  const [uploading, setUploading] = React.useState(false);

  const handleUploadClick = () => inputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument({ file });
      await queryClient.invalidateQueries(['documents']);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (id: string, name: string) => {
    const blob = await downloadDocument(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    await queryClient.invalidateQueries(['documents']);
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Documents</Typography>
          <Typography variant="body2" color="text.secondary">Securely store and share client files.</Typography>
        </Box>
        <Button variant="contained" onClick={handleUploadClick} startIcon={<UploadIcon />} disabled={uploading}>
          Upload document
        </Button>
        <input ref={inputRef} type="file" hidden onChange={handleFileChange} />
      </Box>

      {(isLoading || uploading) && <LinearProgress />}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc: any) => (
              <TableRow key={doc._id} hover>
                <TableCell>{doc.originalName}</TableCell>
                <TableCell>{doc.mimeType}</TableCell>
                <TableCell align="right">{(doc.size / 1024).toFixed(1)} KB</TableCell>
                <TableCell>{dayjs(doc.createdAt).format('MMM D, YYYY h:mm A')}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleDownload(doc._id, doc.originalName)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(doc._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!documents.length && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Documents;
