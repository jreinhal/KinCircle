import { useKinStoreContext } from '../context/KinStoreContext';

export const useFamilyInvitesStore = () => {
  const { familyInvites, addFamilyInvite, cancelFamilyInvite, updateFamilyInvite } = useKinStoreContext();
  return { familyInvites, addFamilyInvite, cancelFamilyInvite, updateFamilyInvite };
};
