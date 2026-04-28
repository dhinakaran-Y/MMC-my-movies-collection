"use client";

import { createContext, useContext, useState } from "react";
import CollectionCreateForm from "@/components/CollectionComponents/CollectionCreateForm";

const CollectionModalContext = createContext();

export function CollectionModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [onSubmitAction, setOnSubmitAction] = useState(null);

  /**
   * @param {Object|null} data - Existing collection data for editing (or null for new)
   * @param {Function} callback - The async function to run on form submit
   */
  const openModal = (data = null, callback) => {
    setEditingData(data);
    setOnSubmitAction(() => callback);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingData(null);
    setOnSubmitAction(null);
  };

  return (
    <CollectionModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {/* The Form is rendered ONLY ONCE here. 
        It is hidden/shown by the context state.
      */}
      <CollectionCreateForm
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={onSubmitAction}
        initialData={editingData}
      />
    </CollectionModalContext.Provider>
  );
}

// Custom hook to access the modal from any component
export const useCollectionModal = () => {
  const context = useContext(CollectionModalContext);
  if (!context) {
    throw new Error(
      "useCollectionModal must be used within a CollectionModalProvider",
    );
  }
  return context;
};
