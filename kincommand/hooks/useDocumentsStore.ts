import { useKinStoreContext } from '../context/KinStoreContext';

export const useDocumentsStore = () => {
  const { documents, addDocument, deleteDocument } = useKinStoreContext();
  return { documents, addDocument, deleteDocument };
};
